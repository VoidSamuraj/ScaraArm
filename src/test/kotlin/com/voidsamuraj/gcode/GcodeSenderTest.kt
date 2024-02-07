package com.voidsamuraj.gcode

import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import java.io.File
import kotlin.reflect.full.declaredMemberFunctions
import kotlin.reflect.jvm.isAccessible
import kotlin.test.assertTrue


class GcodeSenderTest {
    @Before
    fun setUp() {
        mockkObject(GCodeSender)
    }

    @After
    fun tearDown() {
        unmockkAll()
    }
    @Test
    fun testMakeGCodeFile(){
        val path="src/test/kotlin/com/voidsamuraj/gcode/"
        val src="G-Code_Input1.txt"
        val out="G-Code_output1.txt"

        GCodeSender.makeGCodeFile(path+src, path+out, true, true)
        val file = File(path+out)
        assertTrue(file.exists(), "No created file")
    }
    @Test
    fun testCalculate(){
        every { GCodeSender::class.declaredMemberFunctions.find { it.name == "transition" }!!.call(any(), any(), any(), any(), any(), any()) } returns "L-0.9429035964498524 S67.3562597371149 F150"
        val method = GCodeSender::class.declaredMemberFunctions
            .firstOrNull { it.name == "calculate" }
            ?: throw IllegalStateException("Private method not found")
        method.isAccessible = true

    }
    @Test
    fun transition_resultEquals_pass(){
        GCodeSender.setTotalSteps(1)
        val method = GCodeSender::class.declaredMemberFunctions
            .firstOrNull { it.name == "transition" }
            ?: throw IllegalStateException("Private method not found")

        method.isAccessible = true

        val xMove = 280.0
        val yMove = 180.0
        val zMove = 2.0
        val speed = 150.0
        val inSteps = false
        val isRightSide = true
        val result:String = method.call(GCodeSender, xMove, yMove, zMove, speed, inSteps, isRightSide).toString()
        assertEquals("L-0.9429035964498524 S67.3562597371149 F150",result.trim())
    }
    
}
