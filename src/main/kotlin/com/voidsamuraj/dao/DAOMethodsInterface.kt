package com.voidsamuraj.dao

import com.voidsamuraj.models.User

interface DAOMethodsInterface {
    suspend fun getUser(id: Int): User?
    suspend fun getUser(firstName: String,password: String): User?
    suspend fun addNewUser(firstName: String, password: String,filesId:String): User?
    suspend fun editUser(id: Int, firstName: String? = null, password: String?=null, filesId: String?=null): Boolean
    suspend fun deleteUser(id: Int): Boolean
}