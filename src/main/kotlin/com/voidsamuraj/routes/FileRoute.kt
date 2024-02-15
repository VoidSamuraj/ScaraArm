package com.voidsamuraj.routes

import com.voidsamuraj.dao.dao
import com.voidsamuraj.gcode.GCodeSender
import com.voidsamuraj.models.MyToken
import com.voidsamuraj.plugins.getUserId
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.attribute.BasicFileAttributes
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.text.SimpleDateFormat
import java.util.Locale

const val filesFolder="FILES"

fun Route.fileRoute(){
    route("/files"){
        get {
            checkUserPermission(){
                val dir= File(filesFolder)
                if(!dir.exists())
                    dir.mkdirs()

                val pattern = "yyyy/MM/dd HH:mm"
                val sdf = SimpleDateFormat(pattern)

                val token = call.sessions.get("TOKEN") as MyToken?
                val id = getUserId(token)
                var list:List<String> = emptyList()
                if (id!=null) {
                    list = dao.getUser(id)?.filesId?.split(";")?.map {fileId->
                        if(fileId.isNotEmpty())
                            dao.getFileName(fileId.toInt()) ?: ""
                        else
                            ""
                    }?: emptyList()
                }
                val files = dir.listFiles()?.filter {file->
                    var doUserHaveThisFile=false
                    list.forEach {name->
                        if(name.equals(file.name)) {
                            doUserHaveThisFile = true
                        }
                    }
                    doUserHaveThisFile

                }?.map {
                    val fileAttributes = Files.readAttributes(Paths.get(it.canonicalPath), BasicFileAttributes::class.java)
                    val creationTime = fileAttributes.creationTime().toMillis()

                    val formattedDate = sdf.format(creationTime)
                    it.name +";"+formatFileSize(it.length())+";"+formattedDate

                } ?: emptyList()
                println("ALLFILESS"+files)
                call.respond(files)
            }
        }
        route("/{fileName}"){
            get{
                checkUserPermission(){
                    val fileName = call.parameters["fileName"]
                    val file=File(filesFolder+"/"+fileName)
                    if(file.exists())
                        call.respondBytes(file.readBytes(), ContentType.Application.OctetStream)
                    else
                        call.respond(HttpStatusCode.NotFound,"File Not Found")
                }
            }
            post("/draw"){
                checkUserPermission(){
                    val fileName = call.parameters["fileName"]
                    if(fileName!=null){
                        GCodeSender.sendGCode(filesFolder+"/"+fileName)
                        call.respond(HttpStatusCode.OK, "File is processing")
                    }else
                        call.respond(HttpStatusCode.NotFound,"File not found")

                }
            }
            delete{
                checkUserPermission{
                    val fileName = call.parameters["fileName"]
                    val file=File(filesFolder+"/"+fileName)

                    val token = call.sessions.get("TOKEN") as MyToken?
                    val id = getUserId(token)
                    var list:List<String> = emptyList()
                    if (id!=null) {
                        list = dao.getUser(id)?.filesId?.split(";")?.map {fileId->
                            if(fileId.isNotEmpty())
                                dao.getFileName(fileId.toInt()) ?: ""
                            else
                                ""
                        }?: emptyList()
                    }

                    if(file.exists()&&list.contains(fileName))
                        if(file.delete()) {
                            val ml:MutableList<String> = dao.getUser(id!!)?.filesId?.split(";")?.toMutableList()?: mutableListOf()
                            val fileMap = ml.associate { key -> key to dao.getFileName(key.toInt()) }.toMutableMap()
                            fileMap.keys.filter { key -> fileMap[key] == fileName }
                                .forEach { key ->
                                    key+dao.deleteFile(key.toInt())
                                    fileMap.remove(key)
                                }
                            dao.editUser(
                                id = id,
                                filesId = fileMap.keys.joinToString(";")
                            )
                            call.respond(HttpStatusCode.OK, "File was deleted")
                        }
                    call.respond(HttpStatusCode.NoContent, "FILE not deleted")
                }
            }
        }


        post ("/upload"){
            checkUserPermission(){
                try {
                    val multipartData = call.receiveMultipart()
                    multipartData.forEachPart { part ->
                        if (part is PartData.FileItem) {
                            val fileName = part.originalFileName ?: "unknown"
                            val file = File(filesFolder + "/" + fileName)
                            if (!file.exists()) {
                                part.streamProvider().use { input ->
                                    file.outputStream().buffered().use { output ->
                                        input.copyTo(output)
                                    }
                                }

                                val token = call.sessions.get("TOKEN") as MyToken?
                                val id = getUserId(token)
                                if (id != null) {
                                    val files = dao.getUser(id)?.filesId
                                    val fileId = dao.addNewFile(fileName)?.id
                                    if (fileId != null)
                                        dao.editUser(
                                            id = id,
                                            filesId = files + (if (!files.isNullOrEmpty()) ";" else "") + fileId
                                        )
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
        }

    }
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