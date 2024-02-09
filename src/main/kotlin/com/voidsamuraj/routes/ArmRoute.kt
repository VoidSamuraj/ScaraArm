package com.voidsamuraj.routes

import com.fazecast.jSerialComm.SerialPort
import com.voidsamuraj.gcode.GCodeSender
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.util.*


fun Route.armRoute() {
    route("/movement"){
        post{
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
        }
        post("/start"){
            GCodeSender.openPort()
        }
        post("/end"){
            GCodeSender.endCommunication()
            GCodeSender.closePort()
        }
        post("/angle"){
            if (!GCodeSender.isPortOpen)
                GCodeSender.openPort()
            val formParameters = call.receiveParameters()
            val L = formParameters.getOrFail("L").toDoubleOrNull()
            val S = formParameters.getOrFail("S").toDoubleOrNull()
            GCodeSender.moveBy(L,S)
        }
    }

    get("/ports"){
        call.respond( SerialPort.getCommPorts().map{ it.systemPortName})
    }
}