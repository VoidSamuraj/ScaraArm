package com.voidsamuraj.gcode
import com.fazecast.jSerialComm.SerialPort
import com.fazecast.jSerialComm.SerialPortInvalidPortException
import io.ktor.util.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*
import java.io.*
import java.util.*
import java.util.logging.Level
import java.util.logging.Logger
import kotlin.math.*

/**
 * Set of function to transform cartesian to scara and send to arduino
 * @author Karol Robak
 */

@Throws(InterruptedException::class, IOException::class)
fun main() {
    GCodeSender.openPort()
    /*val src = "/home/karol/Pobrane/t3.txt"
    val out = "/home/karol/Pobrane/output.txt"
    // if false generated code is in degrees, else steps are calculated
    val sendGCode = false
    GCodeSender.makeGCodeFile(src, out, sendGCode, false)
    if (sendGCode) {
        GCodeSender.sendGCode(out)
    }*/
}
object GCodeSender {

    enum class Platform{
        WINDOWS,
        LINUX
    }
    enum class StepsMode(val steps:Int){
        ONE(200),
        HALF(400),
        ONE_QUARTER(800)
    }
    enum class StateReturn{
        SUCCESS,
        FAILURE,
        PORT_DISCONNECTED
    }

    private var port: SerialPort? = null
    private var inputStream: InputStream? = null
    private var bufferedInputStream:BufferedInputStream? = null
    private var printWriter:PrintWriter? = null
    private var SERIAL_PORT = "ttyACM0" //"COM5";
    /**
     * sets port and closes previous connections
     * @param port should look like: Linux - "/dev/ttyACM0", Windows - "COM5"
     */
    fun setPort(port:String){
        endCommunication()
        closePort()
        SERIAL_PORT=port
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
    private var arm1Length: Long =200// 100 //long arm length in mm
    private var arm2Length: Long = 200//60 //short arm length in mm
    private var isRelative = false
    private var speedrate = 1.0 // speed multiply
    private var speedNow = 0.0
    private var R = arm2Length + arm1Length
    private val position = doubleArrayOf( /*-R*/0.0, R.toDouble(), 0.0) //200,0,0 //R/
    private val angles = doubleArrayOf( /*DEGREE_BIG_ARM*/ /*-9*/90.0, 180.0 /*DEGREE_SMALL_ARM/2*/) //0,180
    private var maxMovement = 10 // all interpolation steps, divide one command to have linear movement
    private var MOTOR_STEPS_PRER_ROTATION = StepsMode.ONE_QUARTER.steps
    private var ARM_LONG_STEPS_PER_ROTATION =  35.0 / 20.0 //1.75
        get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_DEGREES_BY_ROTATION =  116.0 / 25.0  //116x30x25
        get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_ADDITIONAL_ROTATION =  30 / 116.0  //116x30x25  /(30D/25D) (116D/30D)
        get() = field * MOTOR_STEPS_PRER_ROTATION

    /**
     * Function to reset state to unmodified, it not moves arm
     */
    fun resetState(){
        isRightSide = false
        arm1Length =200// 100 //long arm length in mm
        arm2Length = 200//60 //short arm length in mm
        isRelative = false
        speedrate = 1.0 // speed multiply
        speedNow = 0.0
        R = arm2Length + arm1Length
        resetPosition()
        maxMovement = 10 // all interpolation steps, divide one command to have linear movement
        MOTOR_STEPS_PRER_ROTATION = StepsMode.ONE_QUARTER.steps
        ARM_LONG_STEPS_PER_ROTATION =  35.0 / 20.0 //1.75
        ARM_SHORT_DEGREES_BY_ROTATION =  116.0 / 25.0  //116x30x25
        ARM_SHORT_ADDITIONAL_ROTATION =  30 / 116.0  //116x30x25  /(30D/25D) (116D/30D)
    }

    /**
     * Function to reset position to init, it not moves arm
     */
    fun resetPosition(){
        position[0]=0.0
        position[1]=R.toDouble()
        position[2]=0.0
        angles[0] = 90.0
        angles[1] =180.0
    }
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

    /**
     * set maxMovement - the max length of oce command movement to make it smother.
     * Instead, moving straight to point it creates distance/[maxMovement] points to make movement smoother.
     */
    fun setMaxMovement(movement:Int){
        maxMovement = if(movement>1)
            movement
        else
            1
    }


    /**
     * Get connected port name or null
     * @return port name if port is open, in other case null
     */
    fun getLastPortIfOpen():String?{
        if(isPortOpen)
            return SERIAL_PORT
        return null
    }

    /**
     * Function sending file to scara arm by defined port
     * @param fileToSend path of file which need to be made by [makeGCodeFile]
     * @return [StateReturn]
     * @see makeGCodeFile
     * @see StateReturn
     *
     */
     suspend fun sendGCode(fileToSend: String, onLineRead:suspend (line:String)->Unit):StateReturn {
        try {
            if (!isPortOpen)
                if(openPort()==StateReturn.FAILURE){
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }
            val fin = File(fileToSend)
            resetPosition()
            var lineNumber=1
            withContext(Dispatchers.IO) {
                FileReader(fin).use { fr ->
                    BufferedReader(fr).use { br ->
                        var line: String?
                        while (br.readLine().also { line = it } != null) {
                            line?.let {
                                printWriter!!.write(it)
                                var map:Map<String,String> = mapOf(Pair("line","$lineNumber"), Pair("CX","${position[0]}"), Pair("CY","${position[1]}"))
                                val parts = it.split(" ").filter {it!="G1"}
                                map=map.plus (parts.associate {
                                    val key = it.substring(0, 1)
                                    val value = it.substring(1)
                                    key to value
                                })
                                val jsonObject= JsonObject(map.mapValues { JsonPrimitive(it.value) });
                                onLineRead(jsonObject.toString())
                                ++lineNumber
                            }
                            printWriter!!.flush()
                            for (i in 1..3) {
                                when (isOKReturned(bufferedInputStream!!)) {
                                    StateReturn.SUCCESS -> break
                                    StateReturn.PORT_DISCONNECTED -> {
                                        System.err.println("Arm is disconnected")
                                        return@withContext StateReturn.PORT_DISCONNECTED
                                    }

                                    else -> {}
                                }
                                if (i == 3) {
                                    System.err.println("Arm is not responding")
                                    return@withContext StateReturn.FAILURE
                                }
                            }
                        }
                        endCommunication(printWriter!!)
                        return@withContext StateReturn.SUCCESS
                    }
                }
            }
        }catch (e: Exception) {
            when(e){
                is IOException,
                is InterruptedException -> {
                    System.err.println("sendGCodeError: " + e.localizedMessage)
                    return StateReturn.FAILURE
                }
                else -> throw e
            }
        }
        return StateReturn.SUCCESS
    }

    /**
     *  initializes communication, sends START flag and waits for response OK, then connection is established
     *  @param pw output to write commands to arm
     *  @param bins stream to read response from arm
     * @return [StateReturn.SUCCESS] or [StateReturn.FAILURE]
     * @see StateReturn
     */
    private fun startCommunication(pw: PrintWriter, bins: BufferedInputStream):StateReturn {
        val maxAttempts=10
        for(i in 1 until maxAttempts) {
            try {
                pw.write("START")
                pw.flush()
                Thread.sleep(200)
                if (isOKReturned(bins)==StateReturn.SUCCESS)
                    break
                if(i==maxAttempts-1)
                    return StateReturn.FAILURE
            }catch (e: Exception) {
                when(e){
                    is IOException,
                    is InterruptedException -> {
                        println("Exception Line: "+Thread.currentThread().stackTrace[1].lineNumber+"  "+ e.message)
                    }
                    else -> throw e
                }
            }
        }
        do {
            try {
                bins.read()
            }catch (e: Exception) {
                when(e){
                    is IOException,
                    is InterruptedException -> {
                        println("Exception Line: "+Thread.currentThread().stackTrace[1].lineNumber+"  "+ e.message)
                    }
                    else -> throw e
                }
            }
        } while (bins.available() > 0)
        return StateReturn.SUCCESS
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
            //represents amount of commands which come in
            var commandNumber = 0
            if (!fout.exists()) fout.createNewFile()
            FileWriter(fout).use { fw ->
                var fr= FileReader(fin)
                var br = BufferedReader(fr)
                var line: String?
                var maxSpeed = 0.0

                //loop for search max speed
                while (br.readLine().also { line = it } != null) {
                    val nr = line!!.indexOf('F')
                    val comment = line!!.indexOf(';')
                    if (nr != -1 && nr < comment) {
                        val end = line!!.indexOf(' ', nr)
                        val newSpeed: Double = if (end != -1)
                            line!!.substring(nr + 1, end).toDouble()
                        else
                            line!!.substring(nr + 1).toDouble()
                        if (newSpeed > maxSpeed) maxSpeed = newSpeed
                    }
                    if (line!!.contains("X") || line!!.contains("Y") || line!!.contains("Z")) ++commandNumber
                }
                //reduce speed multiplier based on max speed in file
                if (RAPID_SPEED < maxSpeed) speedrate = maxSpeed / RAPID_SPEED
                fr = FileReader(fin)
                br = BufferedReader(fr)
                fw.write("commands $commandNumber\n")
                while (br.readLine().also { line = it } != null) {
                    if (line!!.contains("G90")) //absolute mode
                        isRelative = false
                    else if (line!!.contains("G91"))  //relative mode
                        isRelative = true
                    else if (line!!.contains("G1")) { // movement
                        val commands: List<String> = line!!
                            .split(";")[0].split(" "). filter { it!="" }
                        fw.write(calculate(commands, inSteps, isRightSide))
                    }
                }
                br.close()
                fw.flush()
            }
        } catch (exception: IOException) {
            System.err.println("makeGcodeFileError:${exception.stackTrace[0].lineNumber}  $exception")
        }
    }

    /**
     * Reads params from array (whole line) and sends to [transition] to calculate movement
     * @param code array of commands
     * @param inSteps change degrees to motor steps
     * @param isRightSide changes direction of arm
     * @return calculated scara code for one command (line)
     */
    private fun calculate(code: List<String>, inSteps: Boolean, isRightSide: Boolean): String {
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
        if (have)
            return transition(x, y, z, speedNow, inSteps, isRightSide)
        return ""
    }

    /**
     * All magic happens here
     * calculates global transition and updates current location and angles
     * It splits command to for max movement  [maxMovement]
     * when totalSteps<=1 there will be one command. You can edit [maxMovement] by [setMaxMovement]
     * @see setMaxMovement
     * @param xMove
     * @param yMove
     * @param zMove movement in specific axis, null if no changes
     * @param speed speed of movement
     * @param inSteps change degrees to motor steps
     * @param isRightSide direction of arm
     * @return calculated global transition
     * TODO throw exception or perform http request to inform user about object outside workspace
     * TODO add Z move and integrate with arm code
     */
    private fun transition(
        xMove: Double?,
        yMove: Double?,
        zMove: Double?,
        speed: Double?,
        inSteps: Boolean,
        isRightSide: Boolean,
    ): String {
        val command = StringBuilder()
        val xm = if (yMove != null) (if (isRelative) yMove + position[0] else yMove) else position[0]
        val ym = if (xMove != null) (if (isRelative) xMove + position[1] else xMove) else position[1]
        val zm = if (zMove != null) (if (isRelative) zMove + position[2] else zMove) else position[2]
        if (xm != position[0] || ym != position[1]) {
            val newRadius: Double = hypot(xm, ym)
            val minRadius: Double = hypot(arm2Length*cos(-55.0*PI/180), arm2Length*sin(-55.0*PI/180)+ arm1Length)

            if (newRadius > R) {
                System.err.println("Object is outside workspace MAX_RADIUS<$newRadius")

            } else if(newRadius<minRadius){
                System.err.println("Object is outside workspace MIN_RADIUS<$newRadius")
            }
            val gamma: Double = atan2(ym, xm) //absolute degree angle to R
            val toBeta =
                (arm1Length * arm1Length + arm2Length * arm2Length - xm * xm - ym * ym) / (2 * arm1Length * arm2Length)
            val beta: Double = acos(toBeta) //between  arms
            val toAlpha =
                (xm * xm + ym * ym + arm1Length * arm1Length - arm2Length * arm2Length) / (2 * arm1Length * newRadius)
            val alpha: Double = acos(toAlpha) //between first arm and R
            val angle = gamma + alpha
            var alphaAdd: Double = Math.toDegrees(angle)
            var betaAdd: Double = Math.toDegrees(beta)
            if (alphaAdd.isNaN()) alphaAdd = 0.0
            if (betaAdd.isNaN()) betaAdd = 0.0
            val alphaChange: Double = if (alphaAdd == 0.0) 0.0 else angles[0] - alphaAdd
            val betaChange: Double = if (betaAdd == 0.0) 0.0 else angles[1] - betaAdd
            //attempt to interpolate
            val deltaX = xm - position[0]
            val deltaY = ym - position[1]
            val totalSteps = ceil(sqrt(deltaX * deltaX + deltaY * deltaY)/maxMovement).toInt()
            if (totalSteps>1) for (steps in 0 until totalSteps) {
                if (inSteps) {
                    command.append(L)
                        .append((alphaChange / totalSteps * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong())
                        .append(" ").append(S)
                        .append((-betaChange / totalSteps * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange / totalSteps * ARM_SHORT_ADDITIONAL_ROTATION).toLong() / 360 * if (isRightSide) 1 else -1)
                    // -1 for direction
                    if (zm != position[2] && isRelative) {
                        //need to check if works with relative and absolute mode
                        command.append(" Z")
                            .append(zm.toLong() / totalSteps * MOTOR_STEPS_PRER_ROTATION * -1)
                    }
                } else {
                    command.append("" + L).append(alphaChange / totalSteps).append(" ")
                        .append(S).append(betaChange / totalSteps)
                }
                if (speed != null && speed != -1.0)
                    command.append(" F").append((speed * speedrate).toLong())
                command.append("\n")
            } else {
                if (inSteps) {
                    command.append(L)
                        .append((alphaChange * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong())
                        .append(" ").append(S)
                        .append((-betaChange * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange * ARM_SHORT_ADDITIONAL_ROTATION).toLong() / 360 * if (isRightSide) 1 else -1)
                    // -1 for direction
                    if (zm != position[2] && isRelative) {
                        //need to check if works with relative and absolute mode
                        command.append(" Z").append(zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1)
                    }
                } else {
                    command.append("" + L).append(alphaChange).append(" ").append(S)
                        .append(betaChange)
                }
                if (speed != null && speed != -1.0) command.append(" F").append((speed * speedrate).toLong())
                command.append("\n")
            }
            if (!alphaAdd.isNaN()) angles[0] = alphaAdd
            if (!betaAdd.isNaN()) angles[1] = betaAdd
            if (xm != position[0]) position[0] = xm
            if (ym != position[1]) position[1] = ym
            if (zm != position[2]) position[2] = zm
            return command.toString()
        } else if (zm != position[2] && isRelative) {
            command.append(" Z").append(zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1)
            command.append("\n")
            return command.toString()
        }
        return ""
    }

    /**
     * function to move arm in cartesian space. Function creates connection to communicate
     * TODO needed testing
     * @param xMove
     * @param yMove
     * @param zMove set null if no move
     * @param rightSide direction of arm
     * @return [StateReturn]
     * @see StateReturn
     */
    fun moveBy(xMove: Double?, yMove: Double?, zMove: Double?, rightSide: Boolean):StateReturn {
        isRightSide = rightSide
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        val isRelativeCp = isRelative
        isRelative = true
        val lines: List<String> = transition(xMove, yMove, zMove, null, true, isRightSide).split("\n").filter { it!="" }
        isRelative = isRelativeCp
        try {
            if (!isPortOpen)
                if(openPort()==StateReturn.FAILURE){
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }
            for (line in lines) {
                println(line)
                printWriter!!.write(line)
                printWriter!!.flush()

                for (i in 1..3) {
                    when (isOKReturned(bufferedInputStream!!)){
                        StateReturn.SUCCESS -> break
                        StateReturn.PORT_DISCONNECTED->{
                            port=null
                            System.err.println("Arm is disconnected")
                            return StateReturn.PORT_DISCONNECTED
                        }
                        else->{}
                    }
                    if (i == 3){
                        System.err.println("Arm is not responding")
                        return StateReturn.FAILURE
                    }
                }
            }
            endCommunication(printWriter!!)
        } catch (ex: Exception) {
            when(ex){
                is IOException,
                is InterruptedException->{
                    angles[0] = anglesCp[0]
                    angles[1] = anglesCp[1]
                    position[0] = positionCp[0]
                    position[1] = positionCp[1]
                    position[2] = positionCp[2]
                    Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
                    return StateReturn.FAILURE
                }
                else -> throw ex
            }
        }
        return StateReturn.SUCCESS
    }
    /**
     * function to move arm by rotation. Function creates connection to communicate
     * TODO needed testing
     * @param firstArmRelativeAngle rotation in degrees relative to current position
     * @param secondArmRelativeAngle rotation in degrees relative to current position
     * @return [StateReturn]
     * @see StateReturn
     */
    fun moveBy(firstArmRelativeAngle: Double?, secondArmRelativeAngle: Double?):StateReturn {
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        val firstArmAngle: Double = (if (firstArmRelativeAngle != null) firstArmRelativeAngle + angles[0] else angles[0]) * Math.PI / 180
        val secondArmAngle: Double = ((if (secondArmRelativeAngle != null) secondArmRelativeAngle + angles[1] else angles[1]) - 180) * Math.PI / 180
        val yPos: Double = arm1Length * cos(firstArmAngle) + arm2Length * cos(secondArmAngle + firstArmAngle)
        val xPos: Double = arm1Length * sin(firstArmAngle) + arm2Length * sin(secondArmAngle + firstArmAngle)
        val isRelativeCp = isRelative
        isRelative = false
        val lines: List<String> = transition(xPos, yPos, null, null, true, !isRightSide).split("\n").filter { it!="" }
        isRelative = isRelativeCp
        try {
            if (!isPortOpen)
                if(openPort()==StateReturn.FAILURE){
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }
            for (line in lines) {
                printWriter!!.write(line)
                printWriter!!.flush()
                for(i in 1..3){
                    when (isOKReturned(bufferedInputStream!!)){
                        StateReturn.SUCCESS -> break
                        StateReturn.PORT_DISCONNECTED->{
                            System.err.println("Arm is disconnected")
                            return StateReturn.PORT_DISCONNECTED
                        }
                        else->{}
                    }
                    if (i == 3){
                        System.err.println("Arm is not responding")
                        return StateReturn.FAILURE
                    }
                }
            }
            endCommunication(printWriter!!)
        } catch (ex: Exception) {
            when(ex){
                is IOException,
                is InterruptedException->{
                    angles[0] = anglesCp[0]
                    angles[1] = anglesCp[1]
                    position[0] = positionCp[0]
                    position[1] = positionCp[1]
                    position[2] = positionCp[2]
                    Logger.getLogger(GCodeSender::class.java.getName()).log(Level.SEVERE, null, ex)
                    return StateReturn.FAILURE
                }
                else -> throw ex
            }
        }
        return StateReturn.SUCCESS
    }

    /**
     * The function tries to read from the stream up to five times. Readed data is added to previous and whole read data are searched for "OK" strings.
     *  @return [StateReturn]
     *  @see StateReturn
     */
    private fun isOKReturned(bins:BufferedInputStream):StateReturn{
        var text=""
        //2000 ms limit
        for(i in 1 until 200) {
            val bf = ByteArray(1024)
            try {
                if (bins.available()>0) {
                    val bytesRead = bins.read(bf)
                    if(getPort()==null)
                        return StateReturn.PORT_DISCONNECTED
                    if(bytesRead!=-1){
                        val st = String(bytes = bf, offset = 0, length = min(bytesRead,bf.size), charset = Charsets.UTF_8).trim()
                        text += st
                        if (text.contains("OK", ignoreCase = true))
                            return StateReturn.SUCCESS
                    }
                }

                Thread.sleep(50)
            }catch (e: Exception) {
                when(e){
                    is IOException,
                    is InterruptedException -> {
                        System.err.println("isOKReturned: " + e.localizedMessage)
                    }
                    else -> throw e
                }
            }
        }
        return StateReturn.FAILURE
    }

    /**
     * Function to establish communication with arm using port specified by[setPort] default is for Linux
     * It blocks current thread until connection is established
     * You also have to specify which system are you using [setPlatform] select one of [Platform]
     * @return [StateReturn.SUCCESS] or [StateReturn.FAILURE]
     * @see setPort
     * @see setPlatform
     * @see Platform
     * @see StateReturn
     * @throws InterruptedException
     */
    @Throws(InterruptedException::class)
    fun openPort():StateReturn{
        port = getPort()
        if(port!=null) {
            port!!.setComPortParameters(115200, 8, 1, 0)
            val platform = System.getProperty("os.name").lowercase(Locale.getDefault())
            if (platform == "windows")
                setPlatform(Platform.WINDOWS)
            else
                setPlatform(Platform.LINUX)

            if (serverPlatform == Platform.WINDOWS)
                port!!.setComPortTimeouts(SerialPort.TIMEOUT_NONBLOCKING, 50, 0)
            else if (serverPlatform == Platform.LINUX)
                port!!.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 50, 0)

            Thread.sleep(100)

            //max 5000 ms
            for (i in 1 until 50) {
                if (port!!.openPort())
                    break
                Thread.sleep(100)
            }
            if (port?.isOpen == true) {
                inputStream = port!!.inputStream
                bufferedInputStream = BufferedInputStream(inputStream!!)
                printWriter = PrintWriter(port!!.outputStream)
                return startCommunication(printWriter!!, bufferedInputStream!!)
            }
        }
        return StateReturn.FAILURE
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

    private fun getPort():SerialPort?{
        try{
            return  SerialPort.getCommPort(SERIAL_PORT)
        }catch(ex: SerialPortInvalidPortException){
            System.err.println("openPort: " + ex.localizedMessage)
            return null
        }

    }
    fun closePort() {
        port?.closePort()
    }
    val isPortOpen: Boolean
        get() = port != null && port!!.isOpen
}
