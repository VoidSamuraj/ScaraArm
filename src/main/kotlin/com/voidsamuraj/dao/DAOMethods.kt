package com.voidsamuraj.dao

import com.voidsamuraj.dao.DatabaseFactory.dbQuery
import com.voidsamuraj.models.User
import com.voidsamuraj.models.Users
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

class DAOMethods:DAOMethodsInterface {
    private fun resultRowToUser(row: ResultRow) = User(
        id = row[Users.id],
        login = row[Users.login],
        password = row[Users.password],
        filesId = row[Users.filesId]
    )
    override suspend fun getUser(id: Int): User? = dbQuery {
        Users.select { Users.id eq id }
            .map(::resultRowToUser)
            .singleOrNull()
    }
    override suspend fun getUserId(login: String): Int? = dbQuery {
        Users.select { (Users.login eq login)}
            .map(::resultRowToUser)
            .singleOrNull()?.id
    }
    override suspend fun getUserPassword(login: String): String? = dbQuery {
        Users.select { (Users.login eq login)}
            .map(::resultRowToUser)
            .singleOrNull()?.password
    }


    override suspend fun addNewUser(login: String, password: String, filesId:String): User? = dbQuery  {
        val insertStatement = Users.insert {
            it[Users.login] = login
            it[Users.password] = password
            it[Users.filesId] = filesId
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToUser)
    }

    override suspend fun editUser(id: Int, login: String?, password: String?, filesId: String?): Boolean = dbQuery {
        Users.update ({ Users.id eq id }) {
            login?.let{firstName->  it[Users.login] = firstName}
            password?.let{password-> it[Users.password] = password}
            filesId?.let {filesId->  it[Users.filesId] = filesId}
        } > 0
    }

    override suspend fun deleteUser(id: Int): Boolean = dbQuery {
        Users.deleteWhere { Users.id eq id } > 0
    }

    suspend fun allUsers(): List<User> = dbQuery {
        Users.selectAll().map(::resultRowToUser)
    }
}
val dao: DAOMethods = DAOMethods()