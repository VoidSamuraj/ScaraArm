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
import io.ktor.server.util.*
import java.io.File
import java.io.IOException
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
                        val ret=GCodeSender.sendGCode(filesFolder+"/"+fileName)
                        when(ret){
                            GCodeSender.StateReturn.SUCCESS->call.respond(HttpStatusCode.OK, "Success")
                            GCodeSender.StateReturn.FAILURE->call.respond(HttpStatusCode.InternalServerError, "Failed to draw file")
                            GCodeSender.StateReturn.PORT_DISCONNECTED->{
                                GCodeSender.closePort()
                                call.respond(HttpStatusCode.ServiceUnavailable, "Connection lost")
                            }
                        }
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
        route("/options"){
            get("/read"){
                val token=call.sessions.get("TOKEN")as MyToken?
                val name=call.parameters["name"]
                val id=call.parameters["id"]
                if(name==null || id == null)
                    call.respond(HttpStatusCode.NoContent, "Name not specified")
                val fileName = "${getUserId(token)}_${id}_${name}.txt"
                val file = File(filesFolder + "/settings/" + fileName)
                try {
                    if (!file.exists())
                        call.respond(HttpStatusCode.NoContent, "file not found")
                    else {
                        val bufferedReader = file.bufferedReader()
                        var arm2Length = 0.0
                        bufferedReader.useLines { lines ->
                            lines.forEach { line ->
                                val param= line.split(": ")
                                if(param.size>1){
                                    when(param[0]){
                                        "right" ->param[1].toBooleanStrict().let{GCodeSender.setArmDirection(it)}
                                        "speed" ->param[1].toInt().let{GCodeSender.setMaxSpeed(it)}
                                        "arm1Length" ->param[1].toDouble().let{GCodeSender.setArm1Length((it * 10).toLong())}
                                        "arm2Length" ->param[1].toDouble().let{arm2Length+=it}
                                        "toolDistance" ->param[1].toDouble().let{arm2Length+=it}
                                        "arm1Ratio" ->param[1].toDouble().let{GCodeSender.setArm1GearRatio(it)}
                                        "arm2Ratio" ->param[1].toDouble().let{GCodeSender.setArm2GearRatio(it)}
                                        "extraRatio" ->param[1].toDouble().let{GCodeSender.setArmAdditionalGearRatio(it)}
                                    }
                                }
                            }
                            if(arm2Length>0)
                                GCodeSender.setArm2Length((arm2Length * 10).toLong())
                        }
                        bufferedReader.close()
                        call.respondBytes(file.readBytes(), ContentType.Application.OctetStream)
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "file reading error")
                }
            }
            get("/file-list"){
                checkUserPermission {
                    val folder = File(filesFolder + "/settings")
                    if (folder.exists() && folder.isDirectory) {
                        val token=call.sessions.get("TOKEN")as MyToken?
                        val files = folder.listFiles()?.filter {it.name.startsWith("${getUserId(token)}")}?.map{it.nameWithoutExtension.replaceFirst("^[0-9]+_".toRegex(), "")}
                        if(!files.isNullOrEmpty()){
                            call.respond(files)
                        }else{
                            call.respond(HttpStatusCode.NoContent, "There is no files for this user")
                        }
                    } else {
                        call.respond(HttpStatusCode.NoContent, "There is no files for this user")
                    }
                }
            }
            post("/set"){
                val formParameters = call.receiveParameters()
                formParameters.getOrFail("right").toBooleanStrict().let{ GCodeSender.setArmDirection(it) }
                formParameters.getOrFail("speed").toInt().let {GCodeSender.setMaxSpeed(it)}
                formParameters.getOrFail("arm1Length").toDouble().let {GCodeSender.setArm1Length((it * 10).toLong())}
                formParameters.getOrFail("arm2Length").toDouble().let {GCodeSender.setArm2Length((it * 10).toLong())}
                formParameters.getOrFail("arm1Ratio").toDouble().let {GCodeSender.setArm1GearRatio(it)}
                formParameters.getOrFail("arm2Ratio").toDouble().let {GCodeSender.setArm2GearRatio(it)}
                formParameters.getOrFail("extraRatio").toDouble().let {GCodeSender.setArmAdditionalGearRatio(it) }
                call.respond(HttpStatusCode.OK,"Settings saved.")
            }
            post("/save"){
                checkUserPermission{
                    try {
                        val formParameters = call.receiveParameters()
                        val token=call.sessions.get("TOKEN")as MyToken?
                        val name= formParameters.getOrFail("name")
                        val id= formParameters.getOrFail("id")
                        val fileName = "${getUserId(token)}_${id}_${name}.txt"
                        val file = File(filesFolder + "/settings/" + fileName)
                        file.getParentFile().mkdirs()
                        if(!file.exists())
                            file.createNewFile()

                        val sb = StringBuilder()

                        formParameters.getOrFail("right").toBooleanStrict().let { sb.append("right: $it\n") }
                        formParameters.getOrFail("speed").toInt().let { sb.append("speed: $it\n") }
                        formParameters.getOrFail("arm1Length").toDouble().let { sb.append("arm1Length: $it\n") }
                        formParameters.getOrFail("arm2Length").toDouble().let { sb.append("arm2Length: $it\n") }
                        formParameters.getOrFail("toolDistance").toDouble().let { sb.append("toolDistance: $it\n") }
                        formParameters.getOrFail("arm1Ratio").toDouble().let { sb.append("arm1Ratio: $it\n") }
                        formParameters.getOrFail("arm2Ratio").toDouble().let { sb.append("arm2Ratio: $it\n") }
                        formParameters.getOrFail("extraRatio").toDouble().let { sb.append("extraRatio: $it\n") }

                        val writer = file.bufferedWriter()
                        writer.write(sb.toString())
                        writer.flush()
                        writer.close()

                        call.respond(HttpStatusCode.OK,"Settings saved.")
                    }catch (ex:IOException){
                        System.err.println(ex)
                        call.respond(HttpStatusCode.InternalServerError,"Error saving file.")
                    }
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