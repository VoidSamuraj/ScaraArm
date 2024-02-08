package com.voidsamuraj.gcode

import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File
import kotlin.reflect.full.declaredMemberFunctions
import kotlin.reflect.jvm.isAccessible
import kotlin.test.assertTrue


class GcodeSenderTest {
    private val path="src/test/kotlin/com/voidsamuraj/gcode/gcodes/"

    @Before
    fun setUp() {
        mockkObject(GCodeSender)
    }

    @After
    fun tearDown() {
        unmockkAll()
    }
    @Test
    fun testCalculate(){
        val input:List<String> = listOf("G1","X160","Y160")
        val inSteps=true
        val isRightSide=true
        val output="L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0"
        GCodeSender.resetState()
        val method = GCodeSender::class.declaredMemberFunctions
            .firstOrNull { it.name == "calculate" }
            ?: throw IllegalStateException("Private method not found")
        method.isAccessible = true
        val result:String=method.call(GCodeSender,input,inSteps,isRightSide).toString()
        assertEquals(output,result.trim())
    }
    @Test
    fun transition_resultEquals_pass(){
        GCodeSender.resetState()
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

    //changed implementatation now is needed to update transition method
   /* @Test
    fun testMakeGCodeFile_Outside_Range(){
        val src="in/out_of_range.txt"
        val out="out/out_of_range.txt"
        GCodeSender.resetState()

        GCodeSender.makeGCodeFile(path+src, path+out, true, true)
        val file = File(path+out)
        assertTrue(file.exists(), "No created file")
        val content = file.readText().trim()
        val expectedContent = "commands 10"
        assertEquals("File content is not equal",expectedContent, content)

    }
    */
    @Test
    fun testMakeGCodeFile_In_Range(){
        val src="in/in_range.txt"
        val out="out/in_range.txt"
        GCodeSender.resetState()
        GCodeSender.makeGCodeFile(path+src, path+out, true, true)
        val file = File(path+out)
        assertTrue("No created file",file.exists())
        val content = file.readText().trim()
        val expectedContent = "commands 10\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L-8 S-230 F0\n" +
                "L9 S23 F0\n" +
                "L9 S23 F0\n" +
                "L9 S23 F0\n" +
                "L9 S23 F0\n" +
                "L9 S23 F0"
        assertEquals("File content is not equal",expectedContent, content)

    }
    @Test
    fun testMakeGCodeFile_In_slic3r_part(){
        val src="in/part_generated_by_slic3r.txt"
        val out="out/part_generated_by_slic3r.txt"
        GCodeSender.resetState()

        GCodeSender.makeGCodeFile(path+src, path+out, false, true)
        val file = File(path+out)
        assertTrue(file.exists(), "No created file")
        val content = file.readText().trim()
        //NOTICE content will change after adding z axis but rest should stay the same
        val expectedContent = "commands 35\n" +
                "L-11.414744156966673 S25.723493352355973 F60000\n" +
                "L-11.414744156966673 S25.723493352355973 F60000\n" +
                "L-11.414744156966673 S25.723493352355973 F60000\n" +
                "L-11.414744156966673 S25.723493352355973 F60000\n" +
                "L-11.414744156966673 S25.723493352355973 F60000\n" +
                "L0.6691639385659471 S-1.7250671418241992 F25000\n" +
                "L0.6691639385659471 S-1.7250671418241992 F25000\n" +
                "L0.6691639385659471 S-1.7250671418241992 F25000\n" +
                "L0.6691639385659471 S-1.7250671418241992 F25000\n" +
                "L0.6691639385659471 S-1.7250671418241992 F25000\n" +
                "L1.650673328298757 S-0.310015616798961 F25000\n" +
                "L1.650673328298757 S-0.310015616798961 F25000\n" +
                "L1.650673328298757 S-0.310015616798961 F25000\n" +
                "L1.650673328298757 S-0.310015616798961 F25000\n" +
                "L1.650673328298757 S-0.310015616798961 F25000\n" +
                "L-0.4381175475216253 S1.6928253102782294 F25000\n" +
                "L-0.4381175475216253 S1.6928253102782294 F25000\n" +
                "L-0.4381175475216253 S1.6928253102782294 F25000\n" +
                "L-0.4381175475216253 S1.6928253102782294 F25000\n" +
                "L-0.4381175475216253 S1.6928253102782294 F25000\n" +
                "L-1.873371982774654 S0.34129395449466104 F25000\n" +
                "L-1.873371982774654 S0.34129395449466104 F25000\n" +
                "L-1.873371982774654 S0.34129395449466104 F25000\n" +
                "L-1.873371982774654 S0.34129395449466104 F25000\n" +
                "L-1.873371982774654 S0.34129395449466104 F25000\n" +
                "L-0.06643913318320642 S0.045315420664994124 F60000\n" +
                "L-0.06643913318320642 S0.045315420664994124 F60000\n" +
                "L-0.06643913318320642 S0.045315420664994124 F60000\n" +
                "L-0.06643913318320642 S0.045315420664994124 F60000\n" +
                "L-0.06643913318320642 S0.045315420664994124 F60000"
        assertEquals("File content is not equal",expectedContent, content)

    }

}
