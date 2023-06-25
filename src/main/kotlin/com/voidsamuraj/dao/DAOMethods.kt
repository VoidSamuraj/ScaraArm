package com.voidsamuraj.dao

import com.voidsamuraj.dao.DatabaseFactory.dbQuery
import com.voidsamuraj.models.User
import com.voidsamuraj.models.Users
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

class DAOMethods:DAOMethodsInterface {
    private fun resultRowToUser(row: ResultRow) = User(
        id = row[Users.id],
        firstName = row[Users.firstName],
        password = row[Users.password],
        filesId = row[Users.filesId]
    )
    override suspend fun getUser(id: Int): User? = dbQuery {
        Users.select { Users.id eq id }
            .map(::resultRowToUser)
            .singleOrNull()
    }

    override suspend fun getUser(firstName: String, password: String): User? = dbQuery {
        Users.select { (Users.firstName eq firstName).and(Users.password eq password)  }
            .map(::resultRowToUser)
            .singleOrNull()
    }


    override suspend fun addNewUser(firstName: String, password: String, filesId:String): User? = dbQuery  {
        val insertStatement = Users.insert {
            it[Users.firstName] = firstName
            it[Users.password] = password
            it[Users.filesId] = filesId
        }
        insertStatement.resultedValues?.singleOrNull()?.let(::resultRowToUser)
    }

    override suspend fun editUser(id: Int, firstName: String?, password: String?, filesId: String?): Boolean = dbQuery {
        Users.update ({ Users.id eq id }) {
            firstName?.let{firstName->  it[Users.firstName] = firstName}
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