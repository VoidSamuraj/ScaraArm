package com.voidsamuraj.gcode
import com.fazecast.jSerialComm.SerialPort
import com.fazecast.jSerialComm.SerialPortInvalidPortException
import io.ktor.util.*
import kotlinx.coroutines.*
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
    // GCodeSender.openPort()
    //val src = "/home/karol/Intelij/scaracp/scara-arm2/FILES/xyz.gcode"
    //val out = "/home/karol/Pobrane/output2.txt"
    // if false generated code is in degrees, else steps are calculated
    //val inSteps = false
    //GCodeSender.makeGCodeFile(src, out, inSteps, false)
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
        PORT_DISCONNECTED,
        OUTSIDE_RANGE,
        ENDSTOP_L_N,
        ENDSTOP_L_P,
        ENDSTOP_S_N,
        ENDSTOP_S_P,
        ENDSTOP_Z_N,
        ENDSTOP_Z_P
    }

    private var port: SerialPort? = null
    private var inputStream: InputStream? = null
    private var bufferedInputStream:BufferedInputStream? = null
    private var printWriter:PrintWriter? = null
    private var SERIAL_PORT = "ttyACM0" //"COM5";
    private const val MAX_ARM_MOVEMENT = 55.0
    private var armLCenterDistance = 0
    private var armSCenterDistance = 0

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
    private var isRightSide = true
    private var arm1Length: Long =200// 100 //long arm length in mm
    private var arm2Length: Long = 200//60 //short arm length in mm
    private var isRelative = false
    private var speedrate = 1.0 // speed multiply
    private var speedNow = 0.0
    private var R = arm2Length + arm1Length
    private val minRadius: Double = hypot(arm2Length*cos(-MAX_ARM_MOVEMENT*PI/180), arm2Length*sin(-MAX_ARM_MOVEMENT*PI/180)+arm1Length)

    private val position = doubleArrayOf( /*-R*/0.0, R.toDouble(), 0.0) //200,0,0 //R/
    private val angles = doubleArrayOf( /*DEGREE_BIG_ARM*/ /*-9*/90.0, 180.0 /*DEGREE_SMALL_ARM/2*/) //0,180
    private var maxMovement = 10 // all interpolation steps, divide one command to have linear movement
    private var maxMovementLine = 5
    private var MOTOR_STEPS_PRER_ROTATION = StepsMode.ONE.steps
    private var ARM_LONG_STEPS_PER_ROTATION = 1.0// 35.0 / 20.0 //1.75
    get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_DEGREES_BY_ROTATION = 1.0// 116.0 / 25.0  //116x30x25
    get() = field * MOTOR_STEPS_PRER_ROTATION
    private var ARM_SHORT_ADDITIONAL_ROTATION =  0.0//30 / 116.0  //116x30x25  /(30D/25D) (116D/30D)
    get() = field * MOTOR_STEPS_PRER_ROTATION

    //flag to set pause
    private var paused=false
    /**
     * Function returns boolean of paused flag. This flag is to stop executing next command.
     * */
    fun getIsPaused()= paused
    // to check if last line is executed and sendGCode paused
    private var isPrinting=false
    /**
     * Function returns if arm is now paused
     */
    fun getIsNowPrinting()= isPrinting

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
        maxMovement = 15 // all interpolation steps, divide one command to have linear movement
        MOTOR_STEPS_PRER_ROTATION = StepsMode.ONE.steps
        ARM_LONG_STEPS_PER_ROTATION =  10.0//35.0 / 20.0 //1.75
        ARM_SHORT_DEGREES_BY_ROTATION =  10.0//116.0 / 25.0  //116x30x25
        ARM_SHORT_ADDITIONAL_ROTATION =  0.0//30 / 116.0  //116x30x25  /(30D/25D) (116D/30D)
        paused=false
        isPrinting=false
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
    /**
     * Function to set arm direction
     * @param isRightSide:Boolean
     */
    fun setArmDirection(isRightSide: Boolean){
        this.isRightSide=isRightSide
    }
    /**
     * Function to pause sending file to arm and web page
     * @param isPaused:Boolean
     */
    fun setPaused(isPaused:Boolean){
        paused=isPaused
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
     * set Arm L distance to center from min angle
     * @param distance in steps
     */
    fun setArmLCenterDistance(distance:Int) {
        armLCenterDistance=distance
    }
    /**
     * set Arm S distance to center from min angle
     * @param distance in steps
     */
    fun setArmSCenterDistance(distance:Int) {
        armSCenterDistance=distance
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
     * function which return current position of tool
     * @return Map<String, String>, keys are named as CX, CY, CZ
     */
    fun getPosition():Map<String, String>{
        return  mapOf(
            Pair("CX", "${position[0]}"),
            Pair("CY", "${position[1]}"),
            Pair("CZ", "${position[2]}"),
        )

    }
    /**
     * Function sending file to scara arm by defined port
     * @param fileToSend path of file which need to be made by [makeGCodeFile]
     * @param scope scope of webService connected to function
     * @param onLineRead function for execution webServiceCode
     * @return [StateReturn]
     * @see makeGCodeFile
     * @see StateReturn
     *
     */
    suspend fun sendGCode(fileToSend: String,scope: CoroutineScope?=null, onLineRead:(suspend (line:String)->Unit)?=null):StateReturn {
        val tempIsRelative=isRelative
        try {
            if(!isRightSide){
                position[0] = 0.0
                position[1] = R.toDouble()
            }else{
                position[0] = R.toDouble()
                position[1] = 0.0
            }
            position[2] = 0.0

            if (!isPortOpen)
                if(openPort()==StateReturn.FAILURE){
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }
            val fin = File(fileToSend)
            var lineNumber=1
            var lastZ: Double
            var nowZ: Double
            //to prevent nozzle lift at start from changing line thickness
            var firstHeight=true
            var secondHeight=true
            var lineThickness=0.0
            var maxSpeed= speedNow

            withContext(Dispatchers.IO) {
                //check number of lines in file and send to arm
                var linesNumber = 0
                BufferedReader(FileReader(fin)).use { reader ->
                    reader.forEachLine { line ->
                        linesNumber++
                        val regex = Regex("\\bF(\\d+)\\b")
                        val matchResult = regex.find(line)
                        matchResult?.let { result ->
                            val speed = result.groupValues[1].toDouble()
                            if(speed>maxSpeed)
                                maxSpeed=speed
                        }
                    }
                }
                printWriter!!.write("commands $linesNumber\n")
                printWriter!!.flush()
                //waiting for arm response
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
                isPrinting=true
                FileReader(fin).use { fr ->
                    BufferedReader(fr).use { br ->
                        var line: String? = null
                        while (br.readLine().also { //filter out comments
                                if(it!=null) {
                                    val index = it.indexOf(';')
                                    line = if (index == -1)
                                        it
                                    else
                                        it.substring(0, index)
                                }
                            } != null && (scope == null || scope.isActive)) {
                            while(paused){
                                isPrinting=false
                                delay(1000)
                            }
                            isPrinting=true
                            line?.let {
                                if (line!!.trim().length > 1 && (line!!.contains("G1") || line!!.contains("G90") || line!!.contains("G91")) ) { //filter out commands
                                    val map: MutableMap<String, String> = mutableMapOf(
                                        Pair("line", "$lineNumber")
                                    )
                                    val parts = line!!.split(" ").filter { it != "G1" }
                                    parts.filter { it.isNotBlank() }.forEach {
                                        if (it.contains("G90")) {
                                            isRelative = false
                                        } else if (it.contains("G91")) {
                                            isRelative = true
                                        } else {
                                            val key = it.substring(0, 1)
                                            val value = it.substring(1)
                                            map[key] = value
                                        }
                                    }
                                    if (isRelative) {  //calculate current position of arm
                                        if (map.contains("X"))
                                            map["CX"] = (position[1] + map["X"]!!.toDouble()).toString()
                                        if (map.contains("Y"))
                                            map["CY"] = (position[0] + map["Y"]!!.toDouble()).toString()
                                        if (map.contains("Z")) {
                                            lastZ = position[2]
                                            nowZ=position[2] + map["Z"]!!.toDouble()
                                            map["CZ"] = nowZ.toString()
                                            if (firstHeight) {
                                                lineThickness = nowZ - lastZ
                                                firstHeight = false
                                            } else if (secondHeight) {
                                                lineThickness = if (nowZ < lastZ)
                                                    nowZ
                                                else
                                                    nowZ - lastZ
                                                secondHeight = false
                                            } else if (nowZ != lastZ)
                                                lineThickness = nowZ - lastZ
                                        }
                                    } else {
                                        if (map.contains("X"))
                                            map["CX"] = map["X"]!!
                                        if (map.contains("Y"))
                                            map["CY"] = map["Y"]!!
                                        if (map.contains("Z")) {
                                            lastZ = position[2]
                                            nowZ=map["Z"]!!.toDouble()
                                            map["CZ"] = map["Z"]!!
                                            if (firstHeight) {
                                                lineThickness = nowZ - lastZ
                                                firstHeight = false
                                            } else if (secondHeight) {
                                                lineThickness = if (nowZ < lastZ)
                                                    nowZ
                                                else
                                                    nowZ - lastZ
                                                secondHeight = false
                                            } else if (nowZ != lastZ)
                                                lineThickness = nowZ - lastZ
                                        }
                                    }
                                    val mapToWeb=map.toMutableMap().apply {
                                        if (!contains("CX")) put("CX", position[1].toString())
                                        if (!contains("CY")) put("CY", position[0].toString())
                                        if (!contains("CZ")) put("CZ", position[2].toString())
                                    }
                                    val isMoving = mapToWeb.contains("X") || mapToWeb.contains("Y") || mapToWeb.contains("Z")
                                    mapToWeb.remove("X")
                                    mapToWeb.remove("Y")
                                    mapToWeb.remove("Z")
                                    mapToWeb["LT"] = lineThickness.toString()
                                    mapToWeb["isRightSide"] = isRightSide.toString()
                                    val jsonObject = JsonObject(mapToWeb.mapValues { JsonPrimitive(it.value) })
                                    if(onLineRead!=null)
                                        onLineRead(jsonObject.toString()) // send data to websocket

                                    if(isMoving) {
                                        //sending data to arm
                                        val lines = transition(
                                            map["CX"]?.toDouble(),
                                            map["CY"]?.toDouble(),
                                            map["CZ"]?.toDouble(),
                                            speedNow,
                                            inSteps = true,
                                            isRightSide
                                        )
                                        lines.forEach { line ->

                                            printWriter!!.write(line)
                                            printWriter!!.flush()

                                            //waiting for arm response
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
                                    }


                                }
                                ++lineNumber
                            }

                        }
                        isPrinting=false
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
        }finally{
            position[0] = 0.0
            position[1] = R.toDouble()
            position[2] = 0.0
            isRelative=tempIsRelative
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
                        System.err.println("Exception Line: "+Thread.currentThread().stackTrace[1].lineNumber+"  "+ e.message)
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
                        System.err.println("Exception Line: "+Thread.currentThread().stackTrace[1].lineNumber+"  "+ e.message)
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
                var line: String? =null
                var maxSpeed = 0.0

                //loop for search max speed
                while (br.readLine()?.also {
                        val index = it.indexOf(';')
                        line = if (index == -1)
                            it
                        else
                            it.substring(0, index)
                    } != null) {
                    val nr = line!!.indexOf('F')
                    if (nr != -1) {
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
                while (br.readLine()?.also {
                        val index=it.indexOf(';')
                        line = if(index==-1)
                            it
                        else
                            it.substring(0,index)
                    } != null) {
                    if (line!!.contains("G90")) //absolute mode
                        isRelative = false
                    else if (line!!.contains("G91"))  //relative mode
                        isRelative = true
                    else if (line!!.contains("G1")) { // movement
                        val commands: List<String> = line!!
                            .split(";")[0].split(" "). filter { it!="" }
                        val newCommands=calculate(commands, inSteps, isRightSide).joinToString(separator = " ")
                        fw.write(newCommands)
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
     * Function which is checking 4 times if [isOKReturned] returns null on success, in other cases [StateReturn]
     * @return null on [StateReturn.SUCCESS] or [StateReturn.PORT_DISCONNECTED] when connection is lost. After 4 unsuccessfully attempts [StateReturn.FAILURE]
     */
    fun waitForOk():StateReturn?{
        for (i in 1..3) {
            when (isOKReturned(bufferedInputStream!!)) {
                StateReturn.SUCCESS -> {
                    print("WaitForOK Success")
                    break
                }
                StateReturn.PORT_DISCONNECTED -> {
                    System.err.println("Arm is disconnected")
                    return StateReturn.PORT_DISCONNECTED
                }

                else -> {}
            }
            if (i == 3) {
                System.err.println("Arm is not responding")
                return StateReturn.FAILURE
            }
        }
        return null
    }

    /**
     * Function to calculate angle between center and min position for arms and save it
     */
    fun calibrate():Triple<StateReturn,Int,Int> {
        val bigMove = 15.0
        var ret: StateReturn
        var counter = 0
        // send command to turn off intepolation
        if (!isPortOpen)
            if(openPort()==StateReturn.FAILURE){
                System.err.println("Port is not opened")
                return Triple(StateReturn.FAILURE,armLCenterDistance,armSCenterDistance)
            }
        printWriter!!.write("I0 O0")
        printWriter!!.flush()
        waitForOk()?.let { return Triple(it,armLCenterDistance,armSCenterDistance) }
        //move arm to 1 endstop
        while (true) {
            ret = moveBy(firstArmRelativeAngle = -100.0)
            when (ret) {
                StateReturn.ENDSTOP_L_P -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        //calculate bigger steps
        while (true) {
            ret = moveBy(firstArmRelativeAngle = bigMove)
            ++counter
            when (ret) {
                StateReturn.ENDSTOP_L_N -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        //move back and calculate precise steps
        --counter
        ret= moveBy(firstArmRelativeAngle = -(bigMove * counter))
        when (ret) {
            StateReturn.SUCCESS -> {}
            else -> {
                printWriter!!.write("I1 O1")
                printWriter!!.flush()
                return Triple(ret,armLCenterDistance,armSCenterDistance)
            }
        }
        armLCenterDistance = (counter*bigMove).toInt()
        counter=0

        //turn on interpolation for smooth end
        printWriter!!.write("I1 O1")
        printWriter!!.flush()
        waitForOk()?.let { println("Calibrating NO OK"+it); return Triple(it,armLCenterDistance,armSCenterDistance) }

        while (true) {
            ret = moveBy(firstArmRelativeAngle = -1.0)
            ++counter
            when (ret) {
                StateReturn.ENDSTOP_L_P -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }

        armLCenterDistance += counter
        armLCenterDistance/=2

        //turn off interpolation
        printWriter!!.write("I0 O0")
        printWriter!!.flush()

        waitForOk()?.let { return Triple(it,armLCenterDistance,armSCenterDistance) }

        //center L arm
        ret = moveBy(firstArmRelativeAngle = armLCenterDistance.toDouble())
        if (ret != StateReturn.SUCCESS) return Triple(ret,armLCenterDistance,armSCenterDistance)
        counter = 0
        //move arm to 1 endstop
        while (true) {
            ret = moveBy(secondArmRelativeAngle = -100.0)
            when (ret) {
                StateReturn.ENDSTOP_S_P -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }

        //calculate bigger steps
        while (true) {
            ret = moveBy(secondArmRelativeAngle = bigMove)
            ++counter
            when (ret) {
                StateReturn.ENDSTOP_S_N -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        //move back and calculate precise steps
        --counter
        moveBy(secondArmRelativeAngle = -(bigMove * counter))
        armSCenterDistance = (counter*bigMove).toInt()
        counter=0

        //turn on interpolation for smooth end
        printWriter!!.write("I1 O1")
        printWriter!!.flush()
        waitForOk()?.let { return Triple(it,armLCenterDistance,armSCenterDistance) }
        while (true) {
            ret = moveBy(secondArmRelativeAngle = -1.0)
            ++counter
            when (ret) {
                StateReturn.ENDSTOP_S_P -> break
                StateReturn.SUCCESS -> {}
                else -> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        armSCenterDistance += counter
        armSCenterDistance/=2

        //turn off interpolation
        printWriter!!.write("I0 O0")
        printWriter!!.flush()
        waitForOk()?.let { return Triple(it,armLCenterDistance,armSCenterDistance) }
        ret = moveBy(secondArmRelativeAngle = armSCenterDistance.toDouble())
        //turn on interpolation
        printWriter!!.write("I1 O1")
        printWriter!!.flush()

        return Triple(ret,armLCenterDistance,armSCenterDistance)
    }


    /**
     * Function for arm homing.Requires arm to be calibrated
     * @return [StateReturn] representing homing result
     */
    fun homeArm():Triple<StateReturn,Int,Int>{
        var ret:StateReturn
        var returnedCalib: Triple<StateReturn, Int, Int>?=null
        if(armLCenterDistance != 0 && armSCenterDistance !=0) {
            returnedCalib = calibrate()
            when (returnedCalib.first) {
                StateReturn.SUCCESS -> {}
                else -> {
                    return returnedCalib
                }
            }
        }
        printWriter!!.write("I0 O0")
        printWriter!!.flush()
        waitForOk()?.let { return Triple(it,armLCenterDistance,armSCenterDistance) }

        //move to 1 endstop
        while(true) {
            ret = moveBy(firstArmRelativeAngle = -100.0)
            when(ret){
                StateReturn.ENDSTOP_L_P->break
                StateReturn.SUCCESS->{}
                else-> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        //center arm 1
        ret=moveBy(firstArmRelativeAngle = armLCenterDistance.toDouble())
        if(ret != StateReturn.SUCCESS) return Triple(ret,armLCenterDistance,armSCenterDistance)

        //move to 1 endstop
        while(true) {
            ret = moveBy(secondArmRelativeAngle = -100.0)
            when(ret){
                StateReturn.ENDSTOP_S_P->break
                StateReturn.SUCCESS->{}
                else-> {
                    printWriter!!.write("I1 O1")
                    printWriter!!.flush()
                    return Triple(ret,armLCenterDistance,armSCenterDistance)
                }
            }
        }
        //center arm 2
        ret= moveBy(secondArmRelativeAngle = armSCenterDistance.toDouble())
        //turn on interpolation
        printWriter!!.write("I1 O1")
        printWriter!!.flush()
        if(returnedCalib != null)
            return Triple(ret,armLCenterDistance,armSCenterDistance)
        return Triple(ret,0,0)
    }

    /**
     * Reads params from array (whole line) and sends to [transition] to calculate movement
     * @param code array of commands
     * @param inSteps change degrees to motor steps
     * @param isRightSide changes direction of arm
     * @return calculated scara code for one command (line)
     */
    private fun calculate(code: List<String>, inSteps: Boolean, isRightSide: Boolean): List<String> {
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

                'F' -> {
                    speedNow = c.substring(1).toDouble()
                }
                else -> {}
            }
        }
        if (have)
            return transition(x, y, z, speedNow, inSteps, isRightSide)
        return emptyList()
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
     * TODO check if works with negative coordinates
     * TODO add Z move and integrate with arm code
     */
    private fun transition(
        xMove: Double?,
        yMove: Double?,
        zMove: Double?,
        speed: Double?,
        inSteps: Boolean,
        isRightSide: Boolean,
    ): List<String> {
        val commands = mutableListOf<String>()
        val tmpCommands= mutableListOf<String>()
        val xm = if (xMove != null) (if (isRelative) xMove + position[0] else xMove) else position[0]
        val ym = if (yMove != null) (if (isRelative) yMove + position[1] else yMove) else position[1]
        val zm = if (zMove != null) (if (isRelative) zMove + position[2] else zMove) else position[2]
        if (xm != position[0] || ym != position[1]) {
            val newRadius: Double = hypot(xm, ym)
            if (newRadius > R) {
                System.err.println("Object is outside workspace MAX_RADIUS($R)<$newRadius")
                commands.add(";outside")
            } else if(newRadius<minRadius){
                commands.add(";outside")
                System.err.println("Object is outside workspace $newRadius<MIN_RADIUS($minRadius)")
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
            val totalSteps = ceil(sqrt(deltaX * deltaX + deltaY * deltaY)/maxMovementLine).toInt()
            if (totalSteps>1)
                for (steps in 0 until totalSteps) {
                    if (inSteps) {
                        val lm=(alphaChange / totalSteps * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong()
                        val sm=((-betaChange / totalSteps * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange / totalSteps * ARM_SHORT_ADDITIONAL_ROTATION) / 360 * if (isRightSide) 1 else -1).toLong()
                        if(lm!=0L)
                            tmpCommands.add("$L$lm")
                        if(sm!=0L)
                            tmpCommands.add("$S$sm")
                        // -1 for direction
                        if (zm != position[2]) {
                            //need to check if works with relative and absolute mode
                            tmpCommands.add("Z${zm.toLong() / totalSteps * MOTOR_STEPS_PRER_ROTATION * -1}")
                        }
                    } else {
                        val lm=alphaChange / totalSteps
                        val sm=betaChange / totalSteps
                        if(lm!=0.0)
                            tmpCommands.add("$L$lm")
                        if(sm!=0.0)
                            tmpCommands.add("$S$sm")
                    }
                    if (speed != null && speed != -1.0 && speed != 0.0)
                        tmpCommands.add("F${(speed * speedrate).toLong()}")
                    commands.add(tmpCommands.joinToString(" "))
                    tmpCommands.clear()
                } else {
                if (inSteps) {
                    val lm=(alphaChange * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong()
                    val sm=((-betaChange * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange * ARM_SHORT_ADDITIONAL_ROTATION) / 360 * if (isRightSide) 1 else -1).toLong()
                    if(lm!=0L)
                        tmpCommands.add("$L$lm")
                    if(sm!=0L)
                        tmpCommands.add("$S$sm")
                    // -1 for direction
                    if (zm != position[2]) {
                        //need to check if works with relative and absolute mode
                        tmpCommands.add("Z${zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1}")
                    }
                } else {
                    if(alphaChange!=0.0)
                        tmpCommands.add("$L$alphaChange")
                    if(betaChange!=0.0)
                        tmpCommands.add("$S$betaChange")
                }
                if (speed != null && speed != -1.0 && speed != 0.0)
                    tmpCommands.add("F${(speed * speedrate).toLong()}")
                commands.add(tmpCommands.joinToString(" "))
                tmpCommands.clear()
            }
            if (!alphaAdd.isNaN()) angles[0] = alphaAdd
            if (!betaAdd.isNaN()) angles[1] = betaAdd
            // println("NEWPOS $xm $ym")
            if (xm != position[0]) position[0] = xm
            if (ym != position[1]) position[1] = ym
            if (zm != position[2]) position[2] = zm
        } else if (zm != position[2]) {
            commands.add("Z${zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1}")
            position[2] = zm
        }

        return commands
    }

    private fun transitionAngles(
        angleL: Double?=null,
        angleS: Double?=null,
        zMove: Double?,
        speed: Double?,
        inSteps: Boolean,
        isRightSide: Boolean,
    ): List<String> {
        val commands = mutableListOf<String>()
        val firstArmAngle: Double = (if (angleL != null) angleL + angles[0] else angles[0]) * Math.PI / 180
        val secondArmAngle: Double = ((if (angleS != null) angleS + angles[1] else angles[1]) - 180) * Math.PI / 180
        val xPos: Double = arm1Length * cos(firstArmAngle) + arm2Length * cos(secondArmAngle + firstArmAngle)
        val yPos: Double = arm1Length * sin(firstArmAngle) + arm2Length * sin(secondArmAngle + firstArmAngle)
        val zm = if (zMove != null) (if (isRelative) zMove + position[2] else zMove) else position[2]
        if (xPos != position[0] || yPos != position[1]) {

            //attempt to interpolate
            val deltaX = xPos - position[0]
            val deltaY = yPos - position[1]
            val totalSteps = if((angleS!=null && angleL != null && (angleS == 0.0 || angleL == 0.0 )) || (angleS != null && angleL == null) || (angleS == null && angleL != null))
                1
            else
                ceil(sqrt(deltaX * deltaX + deltaY * deltaY)/maxMovement).toInt()

            val alphaChange= angleL?:0.0
            val betaChange: Double = angleS?:0.0
            //println("TOTALSTEPS: $totalSteps")
            if (totalSteps>1)
                for (steps in 0 until totalSteps) {
                    if (inSteps) {
                        if (angleL != null && angleL != 0.0){
                            val lm = (alphaChange / totalSteps * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong()
                            if (lm != 0L)
                                commands.add("$L$lm")
                        }
                        if (angleS != null && angleS != 0.0) {
                            val sm = ((-betaChange / totalSteps * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange / totalSteps * ARM_SHORT_ADDITIONAL_ROTATION) / 360 * if (isRightSide) 1 else -1).toLong()
                            if (sm != 0L)
                                commands.add("$S$sm")
                        }
                        // -1 for direction
                        if (zm != position[2]) {
                            //need to check if works with relative and absolute mode
                            commands.add("Z${zm.toLong() / totalSteps * MOTOR_STEPS_PRER_ROTATION * -1}")
                        }
                    } else {
                        val lm=alphaChange / totalSteps
                        val sm=betaChange / totalSteps
                        if(lm!=0.0 && angleL != null && angleL != 0.0)
                            commands.add("$L$lm")
                        if(sm!=0.0 && angleS != null && angleS != 0.0)
                            commands.add("$S$sm")
                    }
                    if (speed != null && speed != -1.0 && speed != 0.0)
                        commands.add("F${(speed * speedrate).toLong()}")
                } else {
                if (inSteps) {
                    if (angleL != null && angleL != 0.0) {
                        val lm = (alphaChange * ARM_LONG_STEPS_PER_ROTATION / 360 * if (isRightSide) 1 else -1).toLong()
                        if (lm != 0L)
                            commands.add("$L$lm")
                    }
                    if (angleS != null && angleS != 0.0) {
                        val sm = ((-betaChange * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange * ARM_SHORT_ADDITIONAL_ROTATION) / 360 * if (isRightSide) 1 else -1).toLong()
                        if (sm != 0L)
                            commands.add("$S$sm")
                    }
                    // -1 for direction
                    if (zm != position[2]) {
                        //need to check if works with relative and absolute mode
                        commands.add("Z${zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1}")
                    }
                } else {
                    if(alphaChange!=0.0 && angleL != null && angleL != 0.0)
                        commands.add("$L$alphaChange")
                    if(betaChange!=0.0 && angleS != null && angleS != 0.0)
                        commands.add("$S$betaChange")
                }
                if (speed != null && speed != -1.0 && speed != 0.0)
                    commands.add("F${(speed * speedrate).toLong()}")
            }
            if (angleL!=null && angleL != 0.0)
                angles[0] +=angleL
            if (angleS != null && angleS != 0.0) angles[1] += angleS!!
            //println("NEWPOS $xm $ym")
            if (xPos != position[0]) position[0] = xPos
            if (yPos != position[1]) position[1] = yPos
            if (zm != position[2]) position[2] = zm
        } else if (zm != position[2]) {
            commands.add("Z${zm.toLong() * MOTOR_STEPS_PRER_ROTATION * -1}")
            position[2] = zm
        }
        return commands
    }
    /**
     * Function to send GCode, it verifies if it is in proper format like: "G1 X10 Y10 Z10 E10 F10"
     * , none of this params are necessary and it works with decimals.
     *  @param commandLine GCode command
     *  @return StateReturn
     */
    fun sendGCodeCommand(commandLine:String):StateReturn{
        val commands: List<String> = commandLine.split(" "). filter { it!="" }
        var ret=true
        commands.forEach { command ->
            when(command){
                "g90",
                "G90" -> isRelative=false
                "g91",
                "G91" -> isRelative=true
                else -> {
                    if(!(command == "G1" || command == "g1" || command =="")) {
                        val first = command[0].uppercaseChar()
                        val value = command.substring(1)
                        when(first){
                            'X',
                            'Y',
                            'Z',
                            'E',
                            'F'->{
                                val numberRegex = """^-?\d+(\.\d+)?$""".toRegex()
                                if (!numberRegex.matches(value))
                                    ret = false
                            }else->
                            ret=false
                        }
                    }
                }
            }

        }
        if(ret) {
            val newCommands = calculate(commands, true, isRightSide)
            if(!newCommands.contains(";outside")){
                newCommands.forEach{ newCommand ->
                    printWriter!!.write(newCommand)
                    printWriter!!.flush()

                    //waiting for arm response
                    for (i in 1..3) {
                        when (isOKReturned(bufferedInputStream!!)) {
                            StateReturn.SUCCESS -> return StateReturn.SUCCESS
                            StateReturn.PORT_DISCONNECTED -> {
                                System.err.println("Arm is disconnected")
                                return StateReturn.PORT_DISCONNECTED
                            }

                            else -> {}
                        }
                    }
                    System.err.println("Arm is not responding")
                    return StateReturn.FAILURE
                }
                return StateReturn.SUCCESS
            }
            return StateReturn.OUTSIDE_RANGE
        }else{
            return StateReturn.FAILURE
        }
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
    fun moveBy(xMove: Double?=null, yMove: Double?=null, zMove: Double?=null, rightSide: Boolean):StateReturn {
        isRightSide = rightSide
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        val lines: List<String> = transition(position[0]+(xMove?:0.0), position[1]+(yMove?:0.0), position[2]+(zMove?:0.0), null, true, isRightSide).filter { it!="" }
        try {
            if (!isPortOpen){
                if(openPort()==StateReturn.FAILURE){
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }else{
                    startCommunication(printWriter!!, bufferedInputStream!!)
                }
            }

            for (line in lines) {
                println(line)
                printWriter!!.write(line)
                printWriter!!.flush()
                waitForOk()?.let { return it }
            }
            //endCommunication(printWriter!!)
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
    fun moveBy(firstArmRelativeAngle: Double?=null, secondArmRelativeAngle: Double?=null):StateReturn {
        val anglesCp: DoubleArray = angles.clone()
        val positionCp: DoubleArray = position.clone()
        // println("MOVEBY START  $firstArmRelativeAngle + ${angles[0]}, $secondArmRelativeAngle + ${angles[1]}")
        // val firstArmAngle: Double = (if (firstArmRelativeAngle != null) firstArmRelativeAngle + angles[0] else angles[0]) * Math.PI / 180
        // val secondArmAngle: Double = ((if (secondArmRelativeAngle != null) secondArmRelativeAngle + angles[1] else angles[1]) - 180) * Math.PI / 180
        //   val xPos: Double = arm1Length * cos(firstArmAngle) + arm2Length * cos(secondArmAngle + firstArmAngle)
        //  val yPos: Double = arm1Length * sin(firstArmAngle) + arm2Length * sin(secondArmAngle + firstArmAngle)
        val isRelativeCp = isRelative
        isRelative = false
        //println("POSNOW ${positionCp[0]} ${positionCp[1]}")
        //println("AnglesNOw ${angles[0]}  ${angles[1]}")
        // println("POSF ${xPos} ${yPos}")
        //val lines: List<String> = transition2(firstArmAngle, secondArmAngle,xPos, yPos, position[2], null, true, isRightSide).filter { it!="" && it !=";outside" }
        val lines: List<String> = transitionAngles(firstArmRelativeAngle, secondArmRelativeAngle, null, null, true, isRightSide).filter { it!="" && it !=";outside" }
        isRelative = isRelativeCp
        try {
            if (!isPortOpen) {
                if (openPort() == StateReturn.FAILURE) {
                    System.err.println("Port is not opened")
                    return StateReturn.FAILURE
                }else
                    startCommunication(printWriter!!, bufferedInputStream!!)
            }
            for (line in lines) {
                //println("LINE $line")
                printWriter!!.write(line)
                printWriter!!.flush()
                for(i in 1..3){
                    val ret =isOKReturned(bufferedInputStream!!)
                    // println("CO MAM $ret")
                    when (ret){
                        StateReturn.SUCCESS -> break
                        StateReturn.PORT_DISCONNECTED->{
                            System.err.println("Arm is disconnected")
                            return StateReturn.PORT_DISCONNECTED
                        }
                        StateReturn.FAILURE -> {}
                        else->{
                            return ret
                        }
                    }
                    if (i == 3){
                        System.err.println("Arm is not responding")
                        return StateReturn.FAILURE
                    }
                }
            }
            //endCommunication(printWriter!!)
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
        //3000 ms limit
        for(i in 1 until 600) {
            val bf = ByteArray(1024)
            try {
                if (bins.available()>0) {
                    val bytesRead = bins.read(bf)
                    if(getPort()==null)
                        return StateReturn.PORT_DISCONNECTED
                    if(bytesRead!=-1){
                        val st = String(bytes = bf, offset = 0, length = min(bytesRead,bf.size), charset = Charsets.UTF_8).trim()
                        text += st
                        when {
                            text.contains("ENDSTOP_L_N", ignoreCase = true) -> return StateReturn.ENDSTOP_L_N
                            text.contains("ENDSTOP_L_P", ignoreCase = true) -> return StateReturn.ENDSTOP_L_P
                            text.contains("ENDSTOP_S_N", ignoreCase = true) -> return StateReturn.ENDSTOP_S_N
                            text.contains("ENDSTOP_S_P", ignoreCase = true) -> return StateReturn.ENDSTOP_S_P
                            text.contains("ENDSTOP_Z_N", ignoreCase = true) -> return StateReturn.ENDSTOP_Z_N
                            text.contains("ENDSTOP_Z_P", ignoreCase = true) -> return StateReturn.ENDSTOP_Z_P
                            text.contains("OK", ignoreCase = true) -> return StateReturn.SUCCESS
                        }
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
