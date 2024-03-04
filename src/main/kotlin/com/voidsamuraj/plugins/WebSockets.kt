package com.voidsamuraj.plugins
import io.ktor.server.application.*
import io.ktor.server.websocket.*
import java.time.Duration
fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(60)
        timeout = Duration.ofMinutes(5)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
}
