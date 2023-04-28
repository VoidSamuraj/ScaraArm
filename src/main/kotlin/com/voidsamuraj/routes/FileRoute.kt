package com.voidsamuraj.routes

import com.voidsamuraj.files
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File



fun Route.fileRoute(){



    route("/file"){
        get {
            if (files.isNotEmpty()) {
                call.respond(files.map { it.id })
            } else {
                call.respondText("No customers found", status = HttpStatusCode.OK)
            }
        }


        get("{userId?}") {                                  // /file/123
            val userId = call.parameters["userId"] ?: return@get call.respondText(
                "Missing userId",
                status = HttpStatusCode.BadRequest
            )
            val file =
                files.find { it.userId == userId } ?: return@get call.respondText(
                    "No file with userId $userId",
                    status = HttpStatusCode.NotFound
                )
            val prefix="temp"
            val subfix=".png"
            val tfile=File.createTempFile(prefix,subfix)
            file.file.binaryStream.use { input ->
                tfile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }

            call.respondFile(tfile)
            //call.respond(file)
        }
    }

}