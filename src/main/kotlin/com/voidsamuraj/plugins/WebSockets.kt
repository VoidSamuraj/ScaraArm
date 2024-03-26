package com.voidsamuraj.plugins
import com.voidsamuraj.gcode.GCodeSender
import com.voidsamuraj.routes.filesFolder
import io.ktor.server.application.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.*
import java.time.Duration
fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(60)
        timeout = Duration.ofMinutes(5)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
}

class WebSocketHandler {
    private val clients = mutableListOf<WebSocketSession>()
    var fileName:String?=null
    var isCurrentDrawing=false
    suspend fun handleWebSocket(session: WebSocketServerSession) {
        clients.add(session)
        for (frame in session.incoming) {
            if (frame is Frame.Text) {
                val json = Json.parseToJsonElement(frame.readText())
                fileName = json.jsonObject["fileName"]?.jsonPrimitive?.contentOrNull
            }else
                session.send("File not found")
        }
    }
    suspend fun addClient(session: WebSocketServerSession){
        clients.add(session)
        if(fileName!=null)
            session.send(Frame.Text(JsonObject(GCodeSender.getPosition().mapValues { JsonPrimitive(it.value) }
                .plus("fileName" to JsonPrimitive(fileName!!))).toString()))
    }
    suspend fun sendData(data: String) {
        val iterator= clients.iterator()
        while(iterator.hasNext()){
            val session = iterator.next()
            if(!session.isActive)
                iterator.remove()
            else
                session.send(Frame.Text(data))
        }
    }
}

class GCodeService(private val webSocketHandler: WebSocketHandler) {
    private val scope = CoroutineScope(Dispatchers.Default)
    fun  startSendingData() {
        var fName=webSocketHandler.fileName
        scope.launch {
            for(i in 0 .. 50){
                try{
                    fName=webSocketHandler.fileName
                    if(fName!=null)
                        break
                    delay(100)
                }catch(e:Exception){System.err.println(e.localizedMessage)}
            }
            if (isActive && fName!=null && !webSocketHandler.isCurrentDrawing) {
                webSocketHandler.isCurrentDrawing =true
                val ret = GCodeSender.sendGCode(fileToSend = "$filesFolder/$fName", scope = scope) { line ->
                    webSocketHandler.sendData(line)
                    delay(100)
                }
                webSocketHandler.isCurrentDrawing =false

                when(ret){
                    GCodeSender.StateReturn.SUCCESS->{
                        webSocketHandler.isCurrentDrawing=false
                        webSocketHandler.sendData("File processed")
                    }
                    GCodeSender.StateReturn.FAILURE,
                    GCodeSender.StateReturn.OUTSIDE_RANGE->{
                        webSocketHandler.isCurrentDrawing=false
                        webSocketHandler.sendData("Failed to draw file")
                    }
                    GCodeSender.StateReturn.PORT_DISCONNECTED->{
                        GCodeSender.closePort()
                        webSocketHandler.isCurrentDrawing=false
                        webSocketHandler.sendData("Connection lost")
                    }
                }
            }else if(!isActive && fName!=null){
                webSocketHandler.isCurrentDrawing=false
                webSocketHandler.sendData("File processed")
            }
            webSocketHandler.isCurrentDrawing=false
        }
    }

    fun stopService() {
        webSocketHandler.isCurrentDrawing=false
        scope.cancel()
    }
}
