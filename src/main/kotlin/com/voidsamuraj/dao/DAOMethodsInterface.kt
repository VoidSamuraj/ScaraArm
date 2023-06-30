package com.voidsamuraj.dao

import com.voidsamuraj.models.User

interface DAOMethodsInterface {
    suspend fun getUser(id: Int): User?
    suspend fun getUserId(login: String): Int?
    suspend fun getUserPassword(login: String): String?
    suspend fun addNewUser(login: String, password: String,filesId:String): User?
    suspend fun editUser(id: Int, login: String? = null, password: String?=null, filesId: String?=null): Boolean
    suspend fun deleteUser(id: Int): Boolean
}