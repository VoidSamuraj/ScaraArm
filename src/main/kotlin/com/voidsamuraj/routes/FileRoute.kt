package com.voidsamuraj.routes

import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale

val filesFolder="FILES"

fun Route.fileRoute(){
    route("/files"){
        get {

            val dir= File(filesFolder)
            if(!dir.exists())
                dir.mkdirs()

            val files = dir.listFiles()?.map { it.name+";"+formatFileSize(it.length()) } ?: emptyList()
            call.respond(files)
        }
        post ("/upload"){
            try {
                val multipartData = call.receiveMultipart()
                multipartData.forEachPart { part ->
                    if (part is PartData.FileItem) {
                        val fileName = part.originalFileName ?: "unknown"
                        val file = File(filesFolder+"/"+fileName)
                        part.streamProvider().use { input ->
                            file.outputStream().buffered().use { output ->
                                input.copyTo(output)
                            }
                        }
                    }
                    part.dispose()
                }
                call.respond(HttpStatusCode.OK,"File uploaded successfully.")
            } catch (ex: ContentTransformationException) {
                call.respond("Error uploading file.")
            }
        }
        delete("/delete/{fileName}"){
            val fileName = call.parameters["fileName"]
            val file=File(filesFolder+"/"+fileName)
            if(file.exists())
                if(file.delete())
                    call.respond(HttpStatusCode.OK, "File was deleted")


            call.respond(HttpStatusCode.NoContent, "FILE not deleted")
        }

        /*
                post("/delete"){
            val fileName = (call.request.queryParameters.getAll("fileName") ?: emptyList())[0]
            val file=File("$filesFolder/$fileName")
            if(file.exists())
                if(file.delete())
                    call.respond(HttpStatusCode.OK, "File was deleted")


            call.respond(HttpStatusCode.NoContent, "FILE not deleted")
        }

        * */
    }



    /*
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
            }
        }
    */
}

fun formatFileSize(fileSize:Long):String {

    val units = listOf("B", "KB", "MB", "GB", "TB")
    var size:Double=fileSize.toDouble()
    var index = 0

    while (size >= 500 && index < units.size - 1) {
        size /= 1024
        ++index
    }
    val decimalFormat = DecimalFormat("#.##")
    decimalFormat.decimalFormatSymbols = DecimalFormatSymbols(Locale.US)
    return  decimalFormat.format(size)+" "+units[index]
}