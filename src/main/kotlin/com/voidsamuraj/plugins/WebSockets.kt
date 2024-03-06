package com.voidsamuraj.plugins
import com.voidsamuraj.gcode.GCodeSender
import com.voidsamuraj.routes.filesFolder
import com.voidsamuraj.routes.isCurrentDrawing
import io.ktor.server.application.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
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
            if (isActive && fName!=null) {
                isCurrentDrawing =true
                val ret = GCodeSender.sendGCode(fileToSend = "$filesFolder/$fName", scope = scope) { line ->
                    webSocketHandler.sendData(line)
                }
                isCurrentDrawing =false

                when(ret){
                    GCodeSender.StateReturn.SUCCESS->{
                        webSocketHandler.sendData("File processed")
                    }
                    GCodeSender.StateReturn.FAILURE->{
                        webSocketHandler.sendData("Failed to draw file")
                    }
                    GCodeSender.StateReturn.PORT_DISCONNECTED->{
                        GCodeSender.closePort()
                        webSocketHandler.sendData("Connection lost")
                    }
                }
            }else if(isActive && fName==null){
                webSocketHandler.sendData("Failed to draw file")
            }else{
                webSocketHandler.sendData("File processed")
            }
        }
    }

    fun stop() {
        scope.cancel()
    }
}
