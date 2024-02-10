package com.voidsamuraj.routes

import com.fazecast.jSerialComm.SerialPort
import com.voidsamuraj.gcode.GCodeSender
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.util.*


fun Route.armRoute() {
    route("/arm"){

        post("/start"){
            GCodeSender.openPort()

            call.respond(HttpStatusCode.OK, "Success")
        }
     /*   post("/end"){
            GCodeSender.endCommunication()
            GCodeSender.closePort()
            call.respond(HttpStatusCode.OK, "Success")
        }*/
        route("/movement"){
            post("/angle"){
                if (!GCodeSender.isPortOpen)
                    GCodeSender.openPort()
                val formParameters = call.receiveParameters()
                val L = formParameters.getOrFail("L").toDoubleOrNull()
                val S = formParameters.getOrFail("S").toDoubleOrNull()
                GCodeSender.moveBy(L,S)
                call.respond(HttpStatusCode.OK, "Success")
            }
            post("/cartesian"){
                if (!GCodeSender.isPortOpen)
                    GCodeSender.openPort()
                val formParameters = call.receiveParameters()
                var x = formParameters.getOrFail("x").toDoubleOrNull()
                var y = formParameters.getOrFail("y").toDoubleOrNull()
                var z = formParameters.getOrFail("z").toDoubleOrNull()
                val isRightSide = formParameters.getOrFail("isRightSide").toBooleanStrictOrNull()
                if(x!=null)
                    x*=10
                if(y!=null)
                    y*=10
                if(z!=null)
                    z*=10
                GCodeSender.moveBy(x,y,z,isRightSide!!)
                call.respond(HttpStatusCode.OK, "Success")
            }
        }
    }
    route("/ports"){
        get{
            call.respond( SerialPort.getCommPorts().map{ it.systemPortName})
        }
        post("/select"){
            val formParameters = call.receiveParameters()
            val port = formParameters.getOrFail("port")
            GCodeSender.setPort(port)
            call.respond(HttpStatusCode.OK, "Success")
        }
    }
}