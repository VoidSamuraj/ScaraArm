package com.voidsamuraj.gcode;



import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortTimeoutException;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *Set of function to transform cartesian to scara and send to arduino
 *
 * @author Karol Robak
 */


public class GCODE_Sender {

    private static SerialPort port=null;
    public static void main(String[] args) throws InterruptedException, IOException  {
        final String src="/home/karol/Pobrane/t3.txt"; //12//C:\\Users\\Karol\\Desktop\\test3.txt
        final String out="/home/karol/Pobrane/output.txt";
        // if false generated code is in degrees, else in steps
        Boolean sendGcode=true;
        makeGCodeFile(src, out,sendGcode,isRightSide);
        if(sendGcode) {
            sendGcode(out);
        }
    }

    private static final String SERIAL_PORT="/dev/ttyACM0";//"COM5";
    /**
     *  max amount of mm per one command, if smaller then more precise
     */
    private static final char L='L';//long axis name
    private static final char S='S';//short axis name

    public static boolean isRightSide=false;
    private static final long Lr=100; //long arm length
    private static final long Sr=60;//short arm length
    //just to make sure everything in area
    private static final long R=Sr+Lr;

    private static final int MOTOR_STEPS_PRER_ROTATION=800;    //200 steps in 1 step mode, 400 in 1/2 step mode...

    private static final double ARM_LONG_STEPS_PER_ROTATION=/*MOTOR_STEPS_PRER_ROTATION;*/35D/20D*MOTOR_STEPS_PRER_ROTATION;              //1.75
    private static final double ARM_SHORT_DEGREES_BY_ROTATION=/*MOTOR_STEPS_PRER_ROTATION;*/(116D/25D)*MOTOR_STEPS_PRER_ROTATION;         //116x30x25
    private static final double ARM_SHORT_ADDITIONAL_ROTATION=/*MOTOR_STEPS_PRER_ROTATION;*/(30/116D)*MOTOR_STEPS_PRER_ROTATION;         //116x30x25  /(30D/25D) (116D/30D)

    private static final int RAPID_SPEED=300;
    private static boolean isRelative=false;

    private static double speedrate=1.0;
    private static double speedNow;
    private static final double [] position = {/*-R*/0,R,0};//200,0,0 //R/
    private static final double [] angles = {/*DEGREE_BIG_ARM*//*-9*/90,180/*DEGREE_SMALL_ARM/2*/};//0,180
    private static final int totalSteps = 5; // all interpolation steps


    /**
     * Function sending file to scara arm
     * @param out - file to send
     */
    public static void sendGcode(String out){

        try {
            if (!isPortOpen())
                openPort();
            InputStream is = port.getInputStream();
            System.out.println("OPEN");
            BufferedInputStream bins = new BufferedInputStream(is);

            PrintWriter pw = new PrintWriter(port.getOutputStream());
            File fin = new File(out);

            Thread.sleep(500);
            startCommunication(pw,bins);
            System.out.println("KOMUNIKACJA ");

            try (FileReader fr = new FileReader(fin); BufferedReader br = new BufferedReader(fr)) {


                Thread t = new Thread(() -> {
                    try {
                        String line;

                        while ((line = br.readLine()) != null) {

                            pw.write(line);
                            pw.flush();
                            byte[] buffer = new byte[1024];
                            do {
                                try {
                                    Thread.sleep(100);
                                    bins.read(buffer);
                                    break;
                                } catch (SerialPortTimeoutException e) {
                                    System.out.println("Timeout exception occurred: " + e.getMessage());
                                }
                            } while (true);

                        }
                        endCommunication(pw);

                    } catch (IOException | InterruptedException ex) {
                        Logger.getLogger(GCODE_Sender.class.getName()).log(Level.SEVERE, null, ex);
                    }
                });
                t.start();
                t.join();

            } catch (IOException ex) {
                Logger.getLogger(GCODE_Sender.class.getName()).log(Level.SEVERE, null, ex);
            } finally {
                bins.close();
                is.close();
                pw.close();
                port.closePort();
            }
        } catch (InterruptedException  e) {
            System.err.println("INTERRUPT sendGcodeError: "+e.getLocalizedMessage());
        }catch ( IOException e) {
            System.err.println("IO sendGcodeError: "+e.getLocalizedMessage());
        }
    }
    private static void startCommunication(PrintWriter pw,BufferedInputStream bins) throws IOException, InterruptedException {
        String st;
        byte[] bf = new byte[1024];
        do{
            try{
                pw.write("START");
                pw.flush();
                Thread.sleep(100);
                bins.read(bf);
                st = new String(bf);
                if(st.trim().compareToIgnoreCase("OK") == 0){
                    break;
                }
            }catch(SerialPortTimeoutException e){
                System.out.println("Timeout exception occurred: " + e.getMessage());
            }
        } while (true);
    }

    /**
     * Creates scara format file from G-Code, L-alpha , S-beta
     * @param src- source G-Code file
     * @param out- generated file in scara format
     * @param inSteps- true-returns calculated steps, false- returns degrees
     * @param isRightSide- changes direction of arm
     */
    public static void makeGCodeFile(String src,String out,Boolean inSteps, Boolean isRightSide){
        try {
            File fin = new File(src);
            File fout = new File(out);
            int commandNumber=0;
            if (!fout.exists())
                fout.createNewFile();

            try (FileWriter fw = new FileWriter(fout)) {
                FileReader fr = new FileReader(fin);
                BufferedReader br = new BufferedReader(fr);

                String line;
                double maxSpeed = 0.0;

                //loop for search max speed
                while ((line = br.readLine()) != null) {
                    int nr = line.indexOf('F');
                    if (line.contains("F")) {
                        int end = line.indexOf(' ', nr);
                        double newSpeed;
                        if (end != -1)
                            newSpeed = Double.parseDouble(line.substring(nr + 1, end));
                        else
                            newSpeed = Double.parseDouble(line.substring(nr + 1));
                        if (newSpeed > maxSpeed)
                            maxSpeed = newSpeed;
                    }
                    if(line.contains("f")||line.contains("G1")||line.contains("G0"))
                        commandNumber+=totalSteps;
                }

                if (RAPID_SPEED < maxSpeed)
                    speedrate = maxSpeed/RAPID_SPEED; //RAPID_SPEED / maxSpeed;

                fr = new FileReader(fin);
                br = new BufferedReader(fr);
                fw.write("commands "+commandNumber+"\n");
                while ((line = br.readLine()) != null) {
                    if(line.contains("G90"))
                        isRelative=false;
                    else if(line.contains("G91"))
                        isRelative=true;
                    else if(line.contains("G1")){
                        String[] comands = line
                                .split(";");
                        for (String one : comands) {
                            String[] comand = one.split(" ");
                            fw.write(calculate(comand, inSteps, isRightSide));
                        }
                    }
                }
                br.close();
                fw.flush();
            }
        }catch (IOException exception){
            System.err.println("makeGcodeFileError: "+exception);
        }
    }


    /**
     * Reads params from array and sends to Transition
     * @param code array of comands
     * @return calculated scara
     */
    private static String calculate(String[] code, Boolean inSteps, Boolean isRightSide){
        String ret="";
        Double x=null;
        Double y=null;
        Double z=null;

        boolean have=false;
        for(String c : code){
            switch(c.charAt(0)){
                case 'X':
                    have=true;
                    x=Double.parseDouble(c.substring(1));
                    break;
                case 'Y':
                    have=true;
                    y=Double.parseDouble(c.substring(1));
                    break;
                case 'Z':
                    have=true;
                    z=Double.parseDouble(c.substring(1));
                    break;
                case 'F':
                    speedNow=Double.parseDouble(c.substring(1));
                    break;
                default:
            }

        }
        if(have){
            ret+=Transition(x, y, z, speedNow,inSteps, isRightSide,false);
            return ret;
        }
        return "";
    }
    /**
     * All magic happens here
     * calculates global transition and updates current location
     * @param inSteps - if change degrees to steps
     * @param isRightSide - direction of arm
     */
    private static String Transition(Double xMove,Double yMove,Double zMove,Double speed,Boolean inSteps,Boolean isRightSide,boolean oneStep) {
        StringBuilder comand = new StringBuilder();
        double xm=(yMove!=null)?(isRelative?yMove+position[0]:yMove):position[0];
        double ym=(xMove!=null)?(isRelative?xMove+position[1]:xMove):position[1];

        //double xm = (xMove != null) ? (isRelative ? xMove + position[0] : xMove) : position[0];
        //double ym = (yMove != null) ? (isRelative ? yMove + position[1] : yMove) : position[1];
        double zm = (zMove != null) ? (isRelative ? zMove + position[2] : zMove) : position[2];


        if(xm!=position[0]||ym!=position[1]){

            double newRaius = Math.hypot(xm, ym);

            if (newRaius > R) {
                System.err.println("Object is outside workspace R<" + newRaius);
                return "";
            }else{
                double gamma = Math.atan2(ym, xm);//absolute degree angle to R
                double toBeta = ((Lr * Lr) + (Sr * Sr) - (xm * xm) - (ym * ym)) / (2 * Lr * Sr);
                double beta = Math.acos(toBeta);//between  arms

                double toAlpha = (xm * xm + ym * ym + Lr * Lr - Sr * Sr) / (2 * Lr * newRaius);
                double alpha = Math.acos(toAlpha);   //between first arm and R

                double angle = gamma + alpha;
                double alphaAdd = Math.toDegrees(angle);
                double betaAdd = Math.toDegrees(beta);
                System.out.println("KATY USTAWIONE OBLICZONE "+alphaAdd+" "+betaAdd);
                if (Double.isNaN(alphaAdd))
                    alphaAdd = 0;
                if (Double.isNaN(betaAdd))
                    betaAdd = 0;

                double alphaChange = alphaAdd == 0 ? 0 : (angles[0] - alphaAdd);
                double betaChange = betaAdd == 0 ? 0 : (angles[1] - betaAdd);
                //attempt to interpolate
                if(!oneStep)
                for (int steps=0;steps<totalSteps;steps++) {
                        if (inSteps) {
                            comand.append(L).append((long) ((alphaChange  / totalSteps* ARM_LONG_STEPS_PER_ROTATION) / 360 * (isRightSide ? 1 : -1))).append(" ").append(S).append(((long) (-betaChange / totalSteps * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange / totalSteps * ARM_SHORT_ADDITIONAL_ROTATION )/ 360) * (isRightSide ? 1 : -1));
                            // -1 for direction
                            if (zm != position[2]&&isRelative) {
                                //need to check if works with relative and absolute mode
                                comand.append(" Z").append((long) zm / totalSteps * MOTOR_STEPS_PRER_ROTATION*-1);
                            }
                        } else {
                            comand.append("" + L).append(alphaChange / totalSteps).append(" ").append(S).append(betaChange / totalSteps);
                        }

                        if (speed != null && speed != -1)
                            comand.append(" F").append((long) (speed * speedrate));
                        comand.append("\n");

                }
                else{
                    if (inSteps) {
                        comand.append(L).append((long) ((alphaChange * ARM_LONG_STEPS_PER_ROTATION) / 360 * (isRightSide ? 1 : -1))).append(" ").append(S).append(((long) (-betaChange * ARM_SHORT_DEGREES_BY_ROTATION + alphaChange * ARM_SHORT_ADDITIONAL_ROTATION )/ 360) * (isRightSide ? 1 : -1));
                        // -1 for direction
                        if (zm != position[2]&&isRelative) {
                            //need to check if works with relative and absolute mode
                            comand.append(" Z").append((long) zm * MOTOR_STEPS_PRER_ROTATION*-1);
                        }
                    } else {
                        comand.append("" + L).append(alphaChange).append(" ").append(S).append(betaChange);
                    }

                    if (speed != null && speed != -1)
                        comand.append(" F").append((long) (speed * speedrate));

                    comand.append("\n");
                }

                if (!Double.isNaN(alphaAdd))
                    angles[0] = alphaAdd;
                if (!Double.isNaN(betaAdd))
                    angles[1] = betaAdd;
                if (xm != position[0])
                    position[0] = xm;
                if (ym != position[1])
                    position[1] = ym;
                if (zm != position[2])
                    position[2] = zm;

                return comand.toString();
            }
        }else if (zm != position[2]&&isRelative) {
            comand.append(" Z").append((long) zm * MOTOR_STEPS_PRER_ROTATION*-1);
            comand.append("\n");
            return comand.toString();

        }
        return "";
    }
    public static void moveBy(Double xMove,Double yMove,Double zMove,Boolean rightSide){
        if(rightSide!=null)
            isRightSide=rightSide;

        double []anglesCp=angles.clone();
        double []positionCp=position.clone();
        boolean isRelativeCp=isRelative;
        isRelative=true;
        String[] lines=Transition(xMove, yMove, zMove, null, true, isRightSide,false).split("\n");
        isRelative=isRelativeCp;
        try {
            if (!isPortOpen())
                openPort();
            InputStream is = port.getInputStream();
            BufferedInputStream bins = new BufferedInputStream(is);
            PrintWriter pw = new PrintWriter(port.getOutputStream());

            Thread.sleep(100);
            startCommunication(pw,bins);
            System.out.println("KOMUNIKACJA ");

            for(String line : lines){
                System.out.println(line+" xddd");
                pw.write(line);
                pw.flush();
                byte[] buffer = new byte[1024];
                do {
                    try {
                        Thread.sleep(100);
                        bins.read(buffer);
                        break;
                    } catch (SerialPortTimeoutException e) {
                        System.out.println("Timeout exception occurred: " + e.getMessage());
                    }
                } while (true);
            }

        } catch (IOException | InterruptedException ex) {
            angles[0]=anglesCp[0];
            angles[1]=anglesCp[1];
            position[0]=positionCp[0];
            position[1]=positionCp[1];
            position[2]=positionCp[2];
            Logger.getLogger(GCODE_Sender.class.getName()).log(Level.SEVERE, null, ex);
        }




    }
    public static void moveBy(Double L,Double S){
        double []anglesCp=angles.clone();
        double []positionCp=position.clone();
        System.out.println("PosBefore "+position[0]+" "+position[1]+"  angles "+angles[0]+" "+angles[1]+" "+L+" "+S);

        double Ln=((L!=null)?(L+angles[0]):angles[0])* Math.PI / 180;
        double Sn=(((S!=null)?(S+angles[1]):angles[1])-180)* Math.PI / 180;
        double yPos=(Lr * Math.cos(Ln) +Sr * Math.cos(Sn+Ln));
        double xPos=(Lr * Math.sin(Ln) +Sr * Math.sin(Sn+Ln));

        boolean isRelativeCp=isRelative;
        isRelative=false;
        String[] lines=Transition(xPos, yPos, null, null, true, !isRightSide,true).split("\n");
        isRelative=isRelativeCp;
        System.out.println("PosAfter "+position[0]+" "+position[1]+"  angles "+angles[0]+" "+angles[1]+"  move "+xPos+" "+yPos);
        System.out.println("PosAfter "+position[0]+" "+position[1]+"  angles "+Ln+" "+Sn);

        try {
            if (!isPortOpen())
                openPort();
            InputStream is = port.getInputStream();
            BufferedInputStream bins = new BufferedInputStream(is);
            PrintWriter pw = new PrintWriter(port.getOutputStream());

            Thread.sleep(100);
            startCommunication(pw,bins);
            System.out.println("KOMUNIKACJA ");

            for(String line : lines){
                System.out.println(line+" xddd");
                pw.write(line);
                pw.flush();
                byte[] buffer = new byte[1024];
                do {
                    try {
                        Thread.sleep(100);
                        bins.read(buffer);
                        break;
                    } catch (SerialPortTimeoutException e) {
                        System.out.println("Timeout exception occurred: " + e.getMessage());
                    }
                } while (true);
            }

        } catch (IOException | InterruptedException ex) {
            angles[0]=anglesCp[0];
            angles[1]=anglesCp[1];
            position[0]=positionCp[0];
            position[1]=positionCp[1];
            position[2]=positionCp[2];
            Logger.getLogger(GCODE_Sender.class.getName()).log(Level.SEVERE, null, ex);
        }

    }
    public static void openPort() throws InterruptedException {
        port = SerialPort.getCommPort(SERIAL_PORT);
        port.setComPortParameters(9600, 8, 1, 0);
        //windows
        port.setComPortTimeouts(SerialPort.TIMEOUT_NONBLOCKING, 0, 0);
        //linux
        port.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0);

        System.out.println("Opened: " + port.openPort());
        Thread.sleep(100);

        while (!port.openPort()) {
            Thread.sleep(500);
        }
        Thread.sleep(4000);
    }

    public static void endCommunication(PrintWriter pw){
        pw.write("END");
        pw.flush();
    }
    public static void endCommunication(){
        if(isPortOpen()) {
            PrintWriter pw = new PrintWriter(port.getOutputStream());
            pw.write("END");
            pw.flush();
            pw.close();
        }
    }
    public static void closePort(){
        if(port!=null)
            port.closePort();
    }
    public static boolean isPortOpen(){
        return port!=null&&port.isOpen();
    }

}

/*
//14
G90
G1 X40 Y0
G91
G1 X60
G1 X-100 Y100

//15
G90
G1 X100 Y0
G1 Y100
//test

L90 S0
L-30 S60
L30 S30
L60 S-30
L-60 S-60

*/

//there is needed more precise arm to confirm proper angles calculations
// to change axis beta-alpha or alpha-beta instead of alpha+beta and try change second arm direction also start angle need to be adjusted