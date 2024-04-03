package com.voidsamuraj.gcode

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll

class GCodeSenderTest {
    companion object {
        @JvmStatic
        @BeforeAll
        fun setUp(){
            GCodeSender.setPort("ttyACM0")
            GCodeSender.setArm1GearRatio(10.0)
            GCodeSender.setArm2GearRatio(10.0)
            GCodeSender.setArmAdditionalGearRatio(0.0)
            GCodeSender.openPort()
        }
    }
    @Test
    fun testEndStop() {
        var ret:GCodeSender.StateReturn
        for( i in 0..360){
            ret =GCodeSender.moveBy(10.0,0.0)
            println("RETURNED $ret")

            if(ret == GCodeSender.StateReturn.ENDSTOP_L_N) {
                assertTrue(true)
                return
            }
            Thread.sleep(500)
        }
        fail<String>("No signal from EndStop")
    }

}