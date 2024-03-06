package com.voidsamuraj

import com.voidsamuraj.dao.DatabaseFactory
import io.ktor.server.application.*
import com.voidsamuraj.plugins.*

val jwtExpirationSeconds=3600L

val webSocketHandler = WebSocketHandler()
val gCodeService = GCodeService(webSocketHandler)

fun main(args: Array<String>): Unit =
    io.ktor.server.netty.EngineMain.main(args)

@Suppress("unused") // application.conf references the main function. This annotation prevents the IDE from marking it as unused.
fun Application.module() {
    DatabaseFactory.init()
    configureTemplating()
    configureSerialization()
    configureMonitoring()
    configureAuthentication()
    configureSession()
    configureWebSockets()
    configureRouting()
}
