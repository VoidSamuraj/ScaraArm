package com.voidsamuraj.models

import io.ktor.server.auth.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table

@Serializable
data class User(val id:Int,val login: String,val password:String, val filesId:String):Principal
object Users : Table() {
    val id = integer("id").autoIncrement()
    val login = varchar("login", 30)
    val password = varchar("password", 72)
    val filesId = varchar("filesId", 255)

    override val primaryKey = PrimaryKey(id)
}