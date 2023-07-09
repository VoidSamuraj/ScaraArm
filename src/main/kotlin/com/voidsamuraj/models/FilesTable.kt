package com.voidsamuraj.models

import io.ktor.server.auth.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table


@Serializable
data class FileRow(val id:Int,val fileName: String): Principal
object FilesTable : Table() {
    val id = integer("id").autoIncrement()
    val fileName = varchar("fileName", 255)
    override val primaryKey = PrimaryKey(id)
}