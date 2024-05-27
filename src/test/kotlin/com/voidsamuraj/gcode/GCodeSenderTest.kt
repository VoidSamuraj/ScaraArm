package com.voidsamuraj.gcode

import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach

class GCodeSenderTest {

    @BeforeEach
    fun setUp(){
        GCodeSender.setPort("ttyACM0")
        GCodeSender.setArm1GearRatio(10.0)
        GCodeSender.setArm2GearRatio(10.0)
        GCodeSender.setArmAdditionalGearRatio(0.0)
        GCodeSender.openPort()
    }

  //  @Test
    fun testEndStops() {
        var ret:GCodeSender.StateReturn
        var i=0
        val move = 100.0

        // MOTOR L
        while( i <= 360){
            ret =GCodeSender.moveBy(move,0.0)
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
            ret =GCodeSender.moveBy(-move,0.0)
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
            ret =GCodeSender.moveBy(0.0,move)
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
            ret =GCodeSender.moveBy(0.0,-move)
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


    @Test
    fun testMove(){
        //BACK
        var ret = GCodeSender.moveBy(yMove = -100.0, rightSide =  true)
        assertEquals( GCodeSender.StateReturn.SUCCESS, ret)
        assertEquals(GCodeSender.getPosition()["CY"], 300.0)

        //LEFT
        ret = GCodeSender.moveBy(xMove = -50.0, rightSide =  true)
        assertEquals( GCodeSender.StateReturn.SUCCESS, ret)
        assertEquals(GCodeSender.getPosition()["CX"], -50.0)

        //RIGHT
        ret = GCodeSender.moveBy(xMove = 50.0, rightSide =  true)
        assertEquals( GCodeSender.StateReturn.SUCCESS, ret)
        assertEquals(GCodeSender.getPosition()["CX"], 0.0)

        //FORWARD
        ret = GCodeSender.moveBy(yMove = 50.0, rightSide =  true)
        assertEquals( GCodeSender.StateReturn.SUCCESS, ret)
        assertEquals(GCodeSender.getPosition()["CY"], 350.0)
    }

    @Test
    fun testZAxis(){
        val ret = GCodeSender.moveBy(zMove = 1.0, rightSide =  true)
        assertEquals(GCodeSender.StateReturn.SUCCESS, ret)
    }

    @Test
    fun testFile() = runBlocking {
            val ret = GCodeSender.sendGCode("/home/karol/Intelij/scara-arm2/FILES/t1.txt", this)
            assertEquals(GCodeSender.StateReturn.SUCCESS, ret)
    }

    @Test
    fun testHoming(){
        val ret =GCodeSender.homeArm()
        assertEquals(GCodeSender.StateReturn.SUCCESS,ret)
    }

}