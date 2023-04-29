package com.voidsamuraj

import com.voidsamuraj.models.UploadedFile
import com.voidsamuraj.models.User
import io.ktor.server.application.*
import com.voidsamuraj.plugins.*
import java.io.File


val customerStorage= mutableListOf<User>(
    User("123","Mojrzesz","123","1"),
    User("1234","Ja","123","2"),
    User("131","Janusz","123","3")
)
val file= File("/home/karol/Pobrane/schody.png")
val files= mutableListOf<UploadedFile>(
    UploadedFile("123","1234",   javax.sql.rowset.serial.SerialBlob(file.readBytes()))
)

fun main(args: Array<String>): Unit =
    io.ktor.server.netty.EngineMain.main(args)

@Suppress("unused") // application.conf references the main function. This annotation prevents the IDE from marking it as unused.
fun Application.module() {


    configureTemplating()
    configureSerialization()
    configureMonitoring()
    configureSecurity()
    configureRouting()

    /*routing {
        route("/klienci") {
            get {
                call.respondTemplate(template = "index.ftl", model = mapOf("files" to "pliki"))
            }
        }
    }*/


}
