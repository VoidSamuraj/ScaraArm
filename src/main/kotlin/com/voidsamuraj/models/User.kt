package com.voidsamuraj.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table

@Serializable
data class User(val id:Int,val firstName: String, val password:String, val filesId:String)

object Users : Table() {
    val id = integer("id").autoIncrement()
    val firstName = varchar("firstName", 30)
    val password = varchar("password", 30)
    val filesId = varchar("filesId", 255)

    override val primaryKey = PrimaryKey(id)
}