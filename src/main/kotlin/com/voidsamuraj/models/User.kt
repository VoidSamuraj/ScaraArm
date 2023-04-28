package com.voidsamuraj.models

import kotlinx.serialization.Serializable

@Serializable
data class User(val id:String,val firstName: String, val password:String, val filesId:String)

