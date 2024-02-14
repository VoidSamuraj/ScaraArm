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
        route("/set"){
            post("/length"){
                val formParameters = call.receiveParameters()
                val arm1 = formParameters["arm1"]?.toDoubleOrNull()
                val arm2 = formParameters["arm2"]?.toDoubleOrNull()
                if(arm1!=null)
                    GCodeSender.setArm1Length((arm1*10).toLong())
                if(arm2!=null)
                    GCodeSender.setArm2Length((arm2*10).toLong())
                if(arm1!=null || arm2!=null)
                    call.respond(HttpStatusCode.OK, "Success")
                else
                    call.respond(HttpStatusCode.BadRequest, "Bad argument, arm1 and arm2.")
            }
            post("/direction"){
                val formParameters = call.receiveParameters()
                val dir = formParameters.getOrFail("isRight").toBoolean()
                GCodeSender.setArmDirection(dir)
                println("\nCHANGED dir \n")
                call.respond(HttpStatusCode.OK, "Success")
            }
            post("/gear-ratio"){
                val formParameters = call.receiveParameters()
                val arm1Ratio = formParameters["arm1Ratio"]?.toDoubleOrNull()
                val arm2Ratio = formParameters["arm2Ratio"]?.toDoubleOrNull()
                val armAdditionalRatio = formParameters["armAdditionalRatio"]?.toDoubleOrNull()
                println("\nLENGTH $arm1Ratio $arm2Ratio \n")
                if(arm1Ratio!=null)
                    GCodeSender.setArm1GearRatio(arm1Ratio)
                if(arm2Ratio!=null)
                    GCodeSender.setArm2GearRatio(arm2Ratio)
                if(armAdditionalRatio!=null)
                    GCodeSender.setArmAdditionalGearRatio(armAdditionalRatio)
                call.respond(HttpStatusCode.OK, "Success")
            }
            post("/motor-mode"){
                val formParameters = call.receiveParameters()
                val mode = formParameters.getOrFail("mode").toInt()
                val enum=GCodeSender.StepsMode.values().find{it.steps == mode}
                if(enum!=null) {
                    GCodeSender.setMotorStepMode(enum)
                    call.respond(HttpStatusCode.OK, "Success")
                }else {
                    val rightArgs = GCodeSender.StepsMode.values().joinToString { "GCodeSender.$it-${it.steps}" }
                    call.respond(HttpStatusCode.BadRequest, "Bad argument, mode. Use one of $rightArgs")
                }
            }
            post("/max-speed"){
                val formParameters = call.receiveParameters()
                val speed = formParameters.getOrFail("speed").toDouble().toInt()
                GCodeSender.setMaxSpeed(speed)
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
    get("/modes"){
        call.respond(GCodeSender.StepsMode.values().map { Pair(it.name,it.steps)})
    }
}