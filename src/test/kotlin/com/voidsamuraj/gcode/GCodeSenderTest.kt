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
    fun testEndStops() {
        var ret:GCodeSender.StateReturn
        var i=0

        // MOTOR L
        while( i <= 360){
            ret =GCodeSender.moveBy(10.0,0.0)
            if(ret == GCodeSender.StateReturn.ENDSTOP_L_N) {
                assertTrue(true)
                break
            }
            ++i
            Thread.sleep(500)
        }
        if(i>360)
            fail<String>("No signal from EndStop_L_N")
        i=0
        while( i <= 360){
            ret =GCodeSender.moveBy(-10.0,0.0)
            if(ret == GCodeSender.StateReturn.ENDSTOP_L_P) {
                assertTrue(true)
                break
            }
            ++i
            Thread.sleep(500)
        }

        if(i>360)
            fail<String>("No signal from EndStop_L_P")
        i=0


        //MOTOR S
        while( i <= 360){
            ret =GCodeSender.moveBy(0.0,10.0)
            if(ret == GCodeSender.StateReturn.ENDSTOP_S_N) {
                assertTrue(true)
                break
            }
            ++i
            Thread.sleep(500)
        }


        if(i>360)
            fail<String>("No signal from EndStop_S_N")
        i=0
        while( i <= 360){
            ret =GCodeSender.moveBy(0.0,-10.0)
            if(ret == GCodeSender.StateReturn.ENDSTOP_S_P) {
                assertTrue(true)
                break
            }
            ++i
            Thread.sleep(500)
        }
        if(i>360)
            fail<String>("No signal from EndStop_S_P")


    }

}