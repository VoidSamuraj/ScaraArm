package com.voidsamuraj.gcode

import com.fazecast.jSerialComm.SerialPort
import com.fazecast.jSerialComm.SerialPortTimeoutException
import java.io.BufferedInputStream
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import java.io.FileWriter
import java.io.IOException
import java.io.InputStream
import java.io.PrintWriter
import java.util.logging.Level
import java.util.logging.Logger
import kotlin.math.*

/**
 * Set of function to transform cartesian to scara and send to arduino
 * @author Karol Robak
 */
object GCodeSender {
    private var port: SerialPort? = null
    @Throws(InterruptedException::class, IOException::class)
    fun main() {
        val src = "/home/karol/Pobrane/t3.txt"
        val out = "/home/karol/Pobrane/output.txt"
        // if false generated code is in degrees, else steps are calculated
        val sendGCode = true
        makeGCodeFile(src, out, sendGCode, isRightSide)
        if (sendGCode) {
            sendGCode(out)
        }
    }

    private var SERIAL_PORT = "/dev/ttyACM0" //"COM5";

    /**
     * sets port and closes previous connections
     * @param port should look like: Linux - "/dev/ttyACM0", Windows - "COM5"
     */
    fun setPort(port:String){
        SERIAL_PORT=port
        if(isPortOpen)
            endCommunication()
    }
    enum class Platform{
        WINDOWS,
        LINUX
    }

    /**
     * needed to make connection, make sure you use right platform from [Platform]
     * @see Platform
     */
    private var serverPlatform:Platform=Platform.LINUX
    fun setPlatform(platform:Platform){
        this.serverPlatform=platform
    }

    private const val L = 'L' //long axis name
    private const val S = 'S' //short axis name
    private var isRightSide = false
    private var arm1Length: Long = 100 //long arm length in mm
    private var arm2Length: Long = 60 //short arm length in mm

    fun setArmDirection(isRightSide: Boolean){
        this.isRightSide=isRightSide
    }
    /**
     * Sets length of first arm (connected to base)
     * @param length length in mm
     */
    fun setArm1Length(length:Long){
        arm1Length=length
        R = arm2Length + arm1Length
    }
    /**
     * Sets length of second arm (connected to tool)
     * @param length length in mm
     */
    fun setArm2Length(length:Long){
        arm2Length=length
        R = arm2Length + arm1Length
    }

    enum class StepsMode(val steps:Int){
        ONE(200),
        HALF(400),
        ONE_QUARTER(800)
    }


    private var R = arm2Length + arm1Length
    private var MOTOR_STEPS_PRER_ROTATION = StepsMode.ONE_QUARTER.steps
    private var ARM_LONG_STEPS_PER_ROTATION =  35.0 / 20.0 //1.75
        get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_DEGREES_BY_ROTATION =  116.0 / 25.0  //116x30x25
        get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_ADDITIONAL_ROTATION =  30 / 116.0  //116x30x25  /(30D/25D) (116D/30D)
        get() = field * MOTOR_STEPS_PRER_ROTATION


    /**
     * Sets step mode, default is 1/4 - 800
     * @param mode mode of motor stepper, [StepsMode.ONE] have 200 steps per rotation, [StepsMode.HALF] - 400 ....
     * Use [StepsMode] as parameter
     */
    fun setMotorStepMode(mode:StepsMode){
        MOTOR_STEPS_PRER_ROTATION=mode.steps
    }

    /**
     * Sets ratio of first arm(how much motor needs to rotate to get full rotation in arm), default is 1.75.
     * You may also need use [setArmAdditionalGearRatio]
     * @see setArmAdditionalGearRatio
     */
    fun setArm1GearRatio(ratio:Double){
        ARM_LONG_STEPS_PER_ROTATION= ratio
    }
    /**
     * Sets ratio of second arm(how much motor needs to rotate to get full rotation in arm), default is 4.64.
     * You may also need use [setArmAdditionalGearRatio]
     * @see setArmAdditionalGearRatio
     */
    fun setArm2GearRatio(ratio:Double){
        ARM_SHORT_DEGREES_BY_ROTATION = ratio
    }

    /**
     * Sets additional ratio, this is needed if your motor is not fixed to arm, when rotating arm 1 changes angle of arm 2.
     * Default is 30/116.
     */
    fun setArmAdditionalGearRatio(ratio:Double){
        ARM_SHORT_ADDITIONAL_ROTATION = ratio
    }

    private var RAPID_SPEED = 300
    fun setMaxSpeed(maxSpeed:Int){
        RAPID_SPEED=maxSpeed
    }
    private var isRelative = false
    private var speedrate = 1.0 // speed multiply
    private var speedNow = 0.0
    private val position = doubleArrayOf( /*-R*/0.0, R.toDouble(), 0.0) //200,0,0 //R/
    private val angles = doubleArrayOf( /*DEGREE_BIG_ARM*/ /*-9*/90.0, 180.0 /*DEGREE_SMALL_ARM/2*/) //0,180
    private var totalSteps = 5 // all interpolation steps, divide one command to have linear movement

    /**
     * set totatSteps - the number of divisions of single command.
     * Instead, moving straight to point it creates [totalSteps] points to make movement smoother.
     */
    fun setTotalSteps(steps:Int){
        totalSteps = if(steps>1)
            steps
        else
            1
    }
    /**
     * Function sending file to scara arm by defined port
     * @param fileToSend path of file which need to be made by [makeGCodeFile]
     * @see makeGCodeFile
     */
    fun sendGCode(fileToSend: String) {
        try {
            if (!isPortOpen) openPort()
            val iStream: InputStream = port!!.inputStream
            println("OPEN")
            val bins = BufferedInputStream(iStream)
            val pw = PrintWriter(port!!.outputStream)
            val fin = File(fileToSend)
            Thread.sleep(500)
            startCommunication(pw, bins)
            println("KOMUNIKACJA ")
            try {
                FileReader(fin).use { fr ->
                    BufferedReader(fr).use { br ->
                        val t = Thread {
                            try {
                                var line: String?
                                while (br.readLine().also { line = it } != null) {
                                    line?.let { pw.write(it) }
                                    pw.flush()
                                    val buffer = ByteArray(1024)
                                    do {
                                        try {
                                            Thread.sleep(100)
                                            bins.read(buffer)
                                            break
                                        } catch (e: SerialPortTimeoutException) {
                                            println("Timeout exception occurred: " + e.message)
                                        }
                                    } while (true)
                                }
                                endCommunication(pw)
                            } catch (ex: IOException) {
                                Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
                            } catch (ex: InterruptedException) {
                                Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
                            }
                        }
                        t.start()
                        t.join()
                    }
                }
            } catch (ex: IOException) {
                Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
            } finally {
                bins.close()
                iStream.close()
                pw.close()
                port!!.closePort()
            }
        } catch (e: InterruptedException) {
            System.err.println("INTERRUPT sendGCodeError: " + e.localizedMessage)
        } catch (e: IOException) {
            System.err.println("IO sendGCodeError: " + e.localizedMessage)
        }
    }

    /**
     *  initializes communication, sends START flag and waits for response OK, then connection is established
     *  @param pw output to write commands to arm
     *  @param bins stream to read response from arm
     *  @throws IOException
     *  @throws InterruptedException
     */
    @Throws(IOException::class, InterruptedException::class)
    private fun startCommunication(pw: PrintWriter, bins: BufferedInputStream) {
        var st: String
        val bf = ByteArray(1024)
        do {
            try {
                pw.write("START")
                pw.flush()
                Thread.sleep(100)
                bins.read(bf)
                st = String(bf)
                if (st.trim().compareTo("OK",ignoreCase = true) == 0) {
                    break
                }
            } catch (e: SerialPortTimeoutException) {
                println("Timeout exception occurred: " + e.message)
            }
        } while (true)
    }

    /**
     * Creates scara format file from G-Code, L-alpha , S-beta
     * @param src source G-Code file
     * @param out path of generated file in scara format
     * @param inSteps true: returns calculated steps, false: returns degrees
     * @param isRightSide changes direction of arm
     */
    fun makeGCodeFile(src: String, out: String, inSteps: Boolean, isRightSide: Boolean) {
        try {
            val fin = File(src)
            val fout = File(out)
            var commandNumber = 0
            if (!fout.exists()) fout.createNewFile()
            FileWriter(fout).use { fw ->
                var fr= FileReader(fin)
                var br = BufferedReader(fr)
                var line: String
                var maxSpeed = 0.0

                //loop for search max speed
                while (br.readLine().also { line = it } != null) {
                    val nr = line.indexOf('F')
                    if (line.contains("F")) {
                        val end = line.indexOf(' ', nr)
                        val newSpeed: Double = if (end != -1)
                                line.substring(nr + 1, end).toDouble()
                            else
                                line.substring(nr + 1).toDouble()
                        if (newSpeed > maxSpeed) maxSpeed = newSpeed
                    }
                    if (line.contains("f") || line.contains("G1") || line.contains("G0")) commandNumber += totalSteps
                }
                //reduce speed multiplier based on max speed in file
                if (RAPID_SPEED < maxSpeed) speedrate = maxSpeed / RAPID_SPEED
                fr = FileReader(fin)
                br = BufferedReader(fr)
                fw.write("commands $commandNumber\n")
                while (br.readLine().also { line = it } != null) {
                    if (line.contains("G90")) //absolute mode
                        isRelative = false
                    else if (line.contains("G91"))  //relative mode
                        isRelative = true
                    else if (line.contains("G1")) { // movement
                        val commands: List<String> = line
                            .split(";")
                        for (one in commands) {
                            val command: List<String> = one.split(" ")
                            fw.write(calculate(command, inSteps, isRightSide))
                        }
                    }
                }
                br.close()
                fw.flush()
            }
        } catch (exception: IOException) {
            System.err.println("makeGcodeFileError: $exception")
        }
    }

    /**
     * Reads params from array (whole line) and sends to [transition] to calculate movement
     * @param code array of comands
     * @param inSteps change degrees to motor steps
     * @param isRightSide changes direction of arm
     * @return calculated scara code for one command (line)
     */
    private fun calculate(code: List<String>, inSteps: Boolean, isRightSide: Boolean): String {
        var ret = ""
        var x: Double? = null
        var y: Double? = null
        var z: Double? = null
        var have = false
        for (c in code) {
            when (c[0]) {
                'X' -> {
                    have = true
                    x = c.substring(1).toDouble()
                }

                'Y' -> {
                    have = true
                    y = c.substring(1).toDouble()
                }

                'Z' -> {
                    have = true
                    z = c.substring(1).toDouble()
                }

                'F' -> speedNow = c.substring(1).toDouble()
                else -> {}
            }
        }
        if (have) {
            ret += transition(x, y, z, speedNow, inSteps, isRightSide)
            return ret
        }
        return ""
    }

    /**
     * All magic happens here
     * calculates global transition and updates current location
     * It splits command to number of points specified in [totalSteps]
     * when totalSteps<=1 there will be one command. You can edit [totalSteps] by [setTotalSteps]
     * @see totalSteps
     * @param xMove
     * @param yMove
     * @param zMove movement in specific axis, null if no changes
     * @param speed speed of movement
     * @param inSteps change degrees to motor steps
     * @param isRightSide direction of arm
     */
    private fun transition(
        xMove: Double?,
        yMove: Double?,
        zMove: Double?,
        speed: Double?,
        inSteps: Boolean,
        isRightSide: Boolean,
    ): String {
        val comand = StringBuilder()
        val xm = if (yMove != null) (if (isRelative) yMove + position[0] else yMove) else position[0]
        val ym = if (xMove != null) (if (isRelative) xMove + position[1] else xMove) else position[1]

        val zm = if (zMove != null) (if (isRelative) zMove + position[2] else zMove) else position[2]
        if (xm != position[0] || ym != position[1]) {
            val newRaius: Double = hypot(xm, ym)
            return if (newRaius > R) {
                System.err.println("Object is outside workspace R<$newRaius")
                ""
            } else {
                val gamma: Double = atan2(ym, xm) //absolute degree angle to R
                val toBeta =
                    (arm1Length * arm1Length + arm2Length * arm2Length - xm * xm - ym * ym) / (2 * arm1Length * arm2Length)
                val beta: Double = acos(toBeta) //between  arms
                val toAlpha =
                    (xm * xm + ym * ym + arm1Length * arm1Length - arm2Length * arm2Length) / (2 * arm1Length * newRaius)
                val alpha: Double = acos(toAlpha) //between first arm and R
                val angle = gamma + alpha
                var alphaAdd: Double = Math.toDegrees(angle)
                var betaAdd: Double = Math.toDegrees(beta)
                if (alphaAdd.isNaN()) alphaAdd = 0.0
                if (betaAdd.isNaN()) betaAdd = 0.0
                val alphaChange: Double = if (alphaAdd == 0.0) 0.0 else angles[0] - alphaAdd
                val betaChange: Double = if (betaAdd == 0.0) 0.0 else angles[1] - betaAdd
                //attempt to interpolate
                if (totalSteps>1) for (steps in 0 until totalSteps) {
                    if (inSteps) {
                        comand.append(L)
                            .append((alphaChange / totalSteps * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong())
                            .append(" ").append(S)
                            .append((-betaChange / totalSteps * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange / totalSteps * ARM_SHORT_ADDITIONAL_ROTATION).toLong() / 360 * if (isRightSide) 1 else -1)
                        // -1 for direction
                        if (zm != position[2] && isRelative) {
                            //need to check if works with relative and absolute mode
                            comand.append(" Z")
                                .append(zm.toLong() / totalSteps * MOTOR_STEPS_PRER_ROTATION * -1)
                        }
                    } else {
                        comand.append("" + L).append(alphaChange / totalSteps).append(" ")
                            .append(S).append(betaChange / totalSteps)
                    }
                    if (speed != null && speed != -1.0) comand.append(" F").append((speed * speedrate).toLong())
                    comand.append("\n")
                } else {
                    if (inSteps) {
                        comand.append(L)
                            .append((alphaChange * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong())
                            .append(" ").append(S)
                            .append((-betaChange * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange * ARM_SHORT_ADDITIONAL_ROTATION).toLong() / 360 * if (isRightSide) 1 else -1)
                        // -1 for direction
                        if (zm != position[2] && isRelative) {
                            //need to check if works with relative and absolute mode
                            comand.append(" Z").append(zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1)
                        }
                    } else {
                        comand.append("" + L).append(alphaChange).append(" ").append(S)
                            .append(betaChange)
                    }
                    if (speed != null && speed != -1.0) comand.append(" F").append((speed * speedrate).toLong())
                    comand.append("\n")
                }
                if (!alphaAdd.isNaN()) angles[0] = alphaAdd
                if (!betaAdd.isNaN()) angles[1] = betaAdd
                if (xm != position[0]) position[0] = xm
                if (ym != position[1]) position[1] = ym
                if (zm != position[2]) position[2] = zm
                comand.toString()
            }
        } else if (zm != position[2] && isRelative) {
            comand.append(" Z").append(zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1)
            comand.append("\n")
            return comand.toString()
        }
        return ""
    }

    /**
     * function to move arm in cartesian space. Function creates connection to communicate
     * TODO change code to have established connection and connect only when necessary
     * TODO needed testing
     * @param xMove
     * @param yMove
     * @param zMove set null if no move
     * @param rightSide direction of arm
     */
    fun moveBy(xMove: Double?, yMove: Double?, zMove: Double?, rightSide: Boolean) {
        isRightSide = rightSide
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        val isRelativeCp = isRelative
        isRelative = true
        val lines: List<String> = transition(xMove, yMove, zMove, null, true, isRightSide).split("\n")
        isRelative = isRelativeCp
        try {
            if (!isPortOpen) openPort()
            val iStream: InputStream = port!!.inputStream
            val bins = BufferedInputStream(iStream)
            val pw = PrintWriter(port!!.outputStream)
            Thread.sleep(100)
            startCommunication(pw, bins)
            println("Communication ")
            for (line in lines) {
                println(line)
                pw.write(line)
                pw.flush()
                val buffer = ByteArray(1024)
                do {
                    try {
                        Thread.sleep(100)
                        bins.read(buffer)
                        break
                    } catch (e: SerialPortTimeoutException) {
                        System.err.println("Timeout exception occurred: " + e.message)
                    }
                } while (true)
            }
        } catch (ex: IOException) {
            angles[0] = anglesCp[0]
            angles[1] = anglesCp[1]
            position[0] = positionCp[0]
            position[1] = positionCp[1]
            position[2] = positionCp[2]
            Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
        } catch (ex: InterruptedException) {
            angles[0] = anglesCp[0]
            angles[1] = anglesCp[1]
            position[0] = positionCp[0]
            position[1] = positionCp[1]
            position[2] = positionCp[2]
            Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
        }
    }
    /**
     * function to move arm by rotation. Function creates connection to communicate
     * TODO change code to have established connection and connect only when necessary
     * TODO needed testing
     * @param firstArmRelativeAngle rotation in degrees relative to current position
     * @param secondArmRelativeAngle rotation in degrees relative to current position
     */
    fun moveBy(firstArmRelativeAngle: Double?, secondArmRelativeAngle: Double?) {
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        //System.out.println("PosBefore " + position[0] + " " + position[1] + "  angles " + angles[0] + " " + angles[1] + " " + L + " " + S)
        val firstArmAngle: Double = (if (firstArmRelativeAngle != null) firstArmRelativeAngle + angles[0] else angles[0]) * Math.PI / 180
        val secondArmAngle: Double = ((if (secondArmRelativeAngle != null) secondArmRelativeAngle + angles[1] else angles[1]) - 180) * Math.PI / 180
        val yPos: Double = arm1Length * cos(firstArmAngle) + arm2Length * cos(secondArmAngle + firstArmAngle)
        val xPos: Double = arm1Length * sin(firstArmAngle) + arm2Length * sin(secondArmAngle + firstArmAngle)
        val isRelativeCp = isRelative
        isRelative = false
        val lines: List<String> = transition(xPos, yPos, null, null, true, !isRightSide).split("\n")
        isRelative = isRelativeCp
        //println("PosAfter " + position[0] + " " + position[1] + "  angles " + angles[0] + " " + angles[1] + "  move " + xPos + " " + yPos)
        //println("PosAfter " + position[0] + " " + position[1] + "  angles " + firstArmAngle + " " + secondArmAngle)
        try {
            if (!isPortOpen) openPort()
            val iStream: InputStream = port!!.inputStream
            val bins = BufferedInputStream(iStream)
            val pw = PrintWriter(port!!.outputStream)
            Thread.sleep(100)
            startCommunication(pw, bins)
            println("Communication ")
            for (line in lines) {
                println(line)
                pw.write(line)
                pw.flush()
                val buffer = ByteArray(1024)
                do {
                    try {
                        Thread.sleep(100)
                        bins.read(buffer)
                        break
                    } catch (e: SerialPortTimeoutException) {
                        println("Timeout exception occurred: " + e.message)
                    }
                } while (true)
            }
        } catch (ex: IOException) {
            angles[0] = anglesCp[0]
            angles[1] = anglesCp[1]
            position[0] = positionCp[0]
            position[1] = positionCp[1]
            position[2] = positionCp[2]
            Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
        } catch (ex: InterruptedException) {
            angles[0] = anglesCp[0]
            angles[1] = anglesCp[1]
            position[0] = positionCp[0]
            position[1] = positionCp[1]
            position[2] = positionCp[2]
            Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
        }
    }

    /**
     * Function to establish communication with arm using port specified by[setPort] default is for Linux
     * It blocks current thread until connection is established
     * You also have to specify which system are you using [setPlatform] select one of [Platform]
     * @see setPort
     * @see setPlatform
     * @see Platform
     * @throws InterruptedException
     */
    @Throws(InterruptedException::class)
    fun openPort(){
        port = SerialPort.getCommPort(SERIAL_PORT)
        port!!.setComPortParameters(9600, 8, 1, 0)

        if(serverPlatform==Platform.WINDOWS)
            port!!.setComPortTimeouts(SerialPort.TIMEOUT_NONBLOCKING, 0, 0)
        else if(serverPlatform==Platform.LINUX)
            port!!.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0)

        Thread.sleep(100)
        while (!port!!.openPort()) {
            Thread.sleep(500)
        }
        Thread.sleep(4000)
    }

    /**
     * function to send END flag to arm to stop communication, it is no closing connection, just sending flag
     */
    fun endCommunication(pw: PrintWriter) {
        pw.write("END")
        pw.flush()
    }
    /**
     * function to send END flag to arm to stop communication, it is no closing connection, just sending flag
     */
    fun endCommunication() {
        if (isPortOpen) {
            val pw = PrintWriter(port!!.outputStream)
            pw.write("END")
            pw.flush()
            pw.close()
        }
    }
    fun closePort() {
         port?.closePort()
    }
    val isPortOpen: Boolean
        get() = port != null && port!!.isOpen
}
