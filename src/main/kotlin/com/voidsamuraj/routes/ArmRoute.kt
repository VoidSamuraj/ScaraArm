package com.voidsamuraj.routes

import com.fazecast.jSerialComm.SerialPort
import com.voidsamuraj.gCodeService
import com.voidsamuraj.gcode.GCodeSender
import com.voidsamuraj.webSocketHandler
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.util.*
import kotlinx.coroutines.delay

fun Route.armRoute() {
    route("/arm"){
        post("/start"){
            checkUserPermission {
                if(GCodeSender.openPort()==GCodeSender.StateReturn.SUCCESS)
                    call.respond(HttpStatusCode.OK, "Success")
                else
                    call.respond(HttpStatusCode.InternalServerError, "Failed to open port")
            }
        }
        post("/pause"){
            GCodeSender.setPaused(true)
            call.respond(HttpStatusCode.OK, "Success")
        }
        post("/resume"){
            GCodeSender.setPaused(false)
            call.respond(HttpStatusCode.OK, "Success")
        }
        post("/stop"){
            gCodeService.stopService()
            call.respond(HttpStatusCode.OK, "Success")
        }
        get("/is-drawing"){
            call.respond(webSocketHandler.isCurrentDrawing)
        }
        post("/send-command"){
            val formParameters = call.receiveParameters()
            val command = formParameters["command"]
            if(command!=null){
                val temp=GCodeSender.getIsPaused()
                GCodeSender.setPaused(true)
                while(GCodeSender.getIsNowPrinting()){
                    delay(100)
                }
                val state= GCodeSender.sendGCodeCommand(command)
                GCodeSender.setPaused(temp)
                if(state == GCodeSender.StateReturn.SUCCESS)
                    call.respond(HttpStatusCode.OK, "Success")
                else if(state == GCodeSender.StateReturn.OUTSIDE_RANGE){
                    call.respond(HttpStatusCode.BadRequest, "Object outside range")
                }else
                    call.respond(HttpStatusCode.BadRequest, "Something gone wrong")
            }else
                call.respond(HttpStatusCode.BadRequest, "Wrong command")
        }
        post("/disconnect"){
            GCodeSender.endCommunication()
            GCodeSender.closePort()
            call.respond(HttpStatusCode.OK, "Success")
        }
        route("/movement"){
            post("/angle"){
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        if (!GCodeSender.isPortOpen)
                            if (GCodeSender.openPort() == GCodeSender.StateReturn.FAILURE) {
                                call.respond(HttpStatusCode.InternalServerError, "Failed to open port")
                                return@checkUserPermission
                            }
                        val formParameters = call.receiveParameters()
                        val L = formParameters.getOrFail("L").toDoubleOrNull()
                        val S = formParameters.getOrFail("S").toDoubleOrNull()
                        val ret = GCodeSender.moveBy(L, S)
                        when (ret) {
                            GCodeSender.StateReturn.SUCCESS -> call.respond(HttpStatusCode.OK, "Success")
                            GCodeSender.StateReturn.PORT_DISCONNECTED -> {
                                GCodeSender.closePort()
                                call.respond(HttpStatusCode.ServiceUnavailable, "Connection lost")
                            }
                            else -> call.respond(HttpStatusCode.InternalServerError, "Failed to move arm")
                        }
                    }
                }
            }
            post("/cartesian") {
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        if (!GCodeSender.isPortOpen)
                            if (GCodeSender.openPort() == GCodeSender.StateReturn.FAILURE) {
                                call.respond(HttpStatusCode.InternalServerError, "Failed to open port")
                                return@checkUserPermission
                            }
                        val formParameters = call.receiveParameters()
                        val x = formParameters.getOrFail("x").toDoubleOrNull()
                        val y = formParameters.getOrFail("y").toDoubleOrNull()
                        val z = formParameters.getOrFail("z").toDoubleOrNull()
                        val isRightSide = formParameters.getOrFail("isRightSide").toBooleanStrictOrNull()

                        val ret = GCodeSender.moveBy(x, y, z, isRightSide!!)
                        when (ret) {
                            GCodeSender.StateReturn.SUCCESS -> call.respond(HttpStatusCode.OK, "Success")
                            GCodeSender.StateReturn.PORT_DISCONNECTED -> {
                                GCodeSender.closePort()
                                call.respond(HttpStatusCode.ServiceUnavailable, "Connection lost")
                            }
                            else ->  call.respond(HttpStatusCode.InternalServerError, "Failed to move arm")
                        }
                    }
                }
            }
            get("/calibrate"){
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        if (!GCodeSender.isPortOpen)
                            if (GCodeSender.openPort() == GCodeSender.StateReturn.FAILURE) {
                                call.respond(HttpStatusCode.InternalServerError, "Failed to open port")
                                return@checkUserPermission
                            }
                        val ret = GCodeSender.calibrate()
                        print("CALIBRATE "+ret)
                        when (ret.first) {
                            GCodeSender.StateReturn.SUCCESS -> call.respond(ret)
                            GCodeSender.StateReturn.PORT_DISCONNECTED -> {
                                GCodeSender.closePort()
                                call.respond(HttpStatusCode.ServiceUnavailable, "Connection lost")
                            }
                            else ->  call.respond(HttpStatusCode.InternalServerError, "Failed to move arm")
                        }
                    }
                }
            }
            post("/home"){
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        if (!GCodeSender.isPortOpen)
                            if (GCodeSender.openPort() == GCodeSender.StateReturn.FAILURE) {
                                call.respond(HttpStatusCode.InternalServerError, "Failed to open port")
                                return@checkUserPermission
                            }
                        val ret = GCodeSender.homeArm()
                        when (ret.first) {
                            GCodeSender.StateReturn.SUCCESS -> call.respond(ret)
                            GCodeSender.StateReturn.PORT_DISCONNECTED -> {
                                GCodeSender.closePort()
                                call.respond(HttpStatusCode.ServiceUnavailable, "Connection lost")
                            }
                            else ->  call.respond(HttpStatusCode.InternalServerError, "Failed to move arm")
                        }
                    }
                }
            }
        }
        route("/set"){
            post("/length"){
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        val formParameters = call.receiveParameters()
                        val arm1 = formParameters["arm1"]?.toDoubleOrNull()
                        val arm2 = formParameters["arm2"]?.toDoubleOrNull()
                        if (arm1 != null)
                            GCodeSender.setArm1Length((arm1 * 10).toLong())
                        if (arm2 != null)
                            GCodeSender.setArm2Length((arm2 * 10).toLong())
                        if (arm1 != null || arm2 != null)
                            call.respond(HttpStatusCode.OK, "Success")
                        else
                            call.respond(HttpStatusCode.BadRequest, "Bad argument, arm1 and arm2.")
                    }
                }
            }
            post("/direction"){
                checkUserPermission {
                    if (!webSocketHandler.isCurrentDrawing) {
                        val formParameters = call.receiveParameters()
                        val dir = formParameters.getOrFail("isRight").toBoolean()
                        GCodeSender.setArmDirection(dir)
                        call.respond(HttpStatusCode.OK, "Success")
                    }
                }
            }
            post("/gear-ratio"){
                checkUserPermission {
                    if (!webSocketHandler.isCurrentDrawing) {
                        val formParameters = call.receiveParameters()
                        val arm1Ratio = formParameters["arm1Ratio"]?.toDoubleOrNull()
                        val arm2Ratio = formParameters["arm2Ratio"]?.toDoubleOrNull()
                        val armAdditionalRatio = formParameters["armAdditionalRatio"]?.toDoubleOrNull()
                        if (arm1Ratio != null)
                            GCodeSender.setArm1GearRatio(arm1Ratio)
                        if (arm2Ratio != null)
                            GCodeSender.setArm2GearRatio(arm2Ratio)
                        if (armAdditionalRatio != null)
                            GCodeSender.setArmAdditionalGearRatio(armAdditionalRatio)
                        call.respond(HttpStatusCode.OK, "Success")
                    }
                }
            }
            post("/motor-mode"){
                checkUserPermission {
                    if(!webSocketHandler.isCurrentDrawing){
                        val formParameters = call.receiveParameters()
                        val mode = formParameters.getOrFail("mode").toInt()
                        val enum = GCodeSender.StepsMode.values().find { it.steps == mode }
                        if (enum != null) {
                            GCodeSender.setMotorStepMode(enum)
                            call.respond(HttpStatusCode.OK, "Success")
                        } else {
                            val rightArgs = GCodeSender.StepsMode.values().joinToString { "GCodeSender.$it-${it.steps}" }
                            call.respond(HttpStatusCode.BadRequest, "Bad argument, mode. Use one of $rightArgs")
                        }
                    }
                }
            }
            post("/max-speed"){
                checkUserPermission {
                    if (!webSocketHandler.isCurrentDrawing) {
                        println("Changed speed")
                        val formParameters = call.receiveParameters()
                        val speed = formParameters.getOrFail("speed").toDouble().toInt()
                        GCodeSender.setMaxSpeed(speed)
                        call.respond(HttpStatusCode.OK, "Success")
                    }
                }
            }
        }
    }
    route("/ports"){
        get{
            checkUserPermission {
                call.respond(SerialPort.getCommPorts().map { it.systemPortName })
            }
        }
        get("/last"){
            checkUserPermission {
                val port:String? = GCodeSender.getLastPortIfOpen()
                if(port==null)
                    call.respond(HttpStatusCode.NoContent)
                else{
                    call.respond(port)
                }
            }
        }
        post("/select"){
            checkUserPermission {
                if(!webSocketHandler.isCurrentDrawing){
                    val formParameters = call.receiveParameters()
                    val port = formParameters.getOrFail("port")
                    GCodeSender.setPort(port)
                    call.respond(HttpStatusCode.OK, "Success")
                }
            }
        }
        post("/close"){
            checkUserPermission {
                if(!webSocketHandler.isCurrentDrawing){
                    GCodeSender.endCommunication()
                    GCodeSender.closePort()
                    call.respond(HttpStatusCode.OK, "Success")
                }
            }
        }
    }
    get("/modes"){
        checkUserPermission {
            call.respond(GCodeSender.StepsMode.values().map { Pair(it.name, it.steps) })
        }
    }
}