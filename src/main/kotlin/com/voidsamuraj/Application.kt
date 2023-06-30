package com.voidsamuraj

import com.voidsamuraj.dao.DatabaseFactory
import com.voidsamuraj.models.UploadedFile
import io.ktor.server.application.*
import com.voidsamuraj.plugins.*
import java.io.File


val jwtExpirationSeconds=3600L
val file= File("/home/karol/Pobrane/schody.png")
val files= mutableListOf<UploadedFile>(
    UploadedFile("123","1234",   javax.sql.rowset.serial.SerialBlob(file.readBytes()))
)

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
    configureRouting()
}
