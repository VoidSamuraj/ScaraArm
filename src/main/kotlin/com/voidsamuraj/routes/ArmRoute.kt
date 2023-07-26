package com.voidsamuraj.routes

import com.voidsamuraj.gcode.GCODE_Sender
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.server.util.*


fun Route.armRoute() {
    post("/startMove"){
        GCODE_Sender.openPort()
    }
    post("/endMove"){
        GCODE_Sender.endCommunication()
        GCODE_Sender.closePort()
    }
    post("/move"){
        if (!GCODE_Sender.isPortOpen())
            GCODE_Sender.openPort()
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
        GCODE_Sender.moveBy(x,y,z,isRightSide)
    }

}