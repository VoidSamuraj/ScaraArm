package com.voidsamuraj.models

import kotlinx.serialization.Serializable
import java.sql.Blob
import java.util.*

@Serializable
data class UploadedFile(val id:String, val userId:String, val file: Blob){

    fun blobToBase64():String{
        val bytes = file.binaryStream.readBytes()
        return Base64.getEncoder().encodeToString(bytes)
    }
}
/*
fun SerialBlob.blobToBase64(): String {
    val bytes = this.binaryStream.readBytes()
    return Base64.getEncoder().encodeToString(bytes)
}*/