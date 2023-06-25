package com.voidsamuraj.dao



import com.voidsamuraj.models.*
import kotlinx.coroutines.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.*
import org.jetbrains.exposed.sql.transactions.experimental.*


/*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import io.ktor.server.application.*
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.select
*/
/*
object Users : IntIdTable() {

    val username = varchar("username", 50)
    val password = varchar("password", 50)
    val fileIds = varchar("fileIds", 255)
}

fun Application.configureDatabase(){
    // Połączenie do bazy danych SQLite
    Database.connect("jdbc:sqlite:mydatabase.db", driver = "org.sqlite.JDBC")

    // Tworzenie tabeli użytkowników
    transaction {
        SchemaUtils.create(Users)
    }

}
fun registerUser(username: String, password: String) {
    transaction {
        // Wstawianie nowego rekordu do tabeli Users
        Users.insert {
            it[Users.username] = username
            it[Users.password] = password
        }
    }
}
fun updateUser(userId:Int, newUsername: String?=null,newPassword: String?=null,newFileIds:String?=null) {
    transaction {
        Users.update({ Users.id eq userId }) {
            newUsername?.let {newUsername->  it[Users.username] = newUsername}
            newPassword?.let {newUsername->  it[Users.password] = newPassword}
            newFileIds?.let {newFileIds->  it[Users.fileIds] = newFileIds}
        }
    }
}

fun deleteUser(userId: Int) {
    transaction {
        // Sprawdź, czy użytkownik istnieje w bazie danych
        val existingUser = Users.select { Users.id eq userId }.singleOrNull()
        if (existingUser == null) {
            // Użytkownik nie istnieje, można zakończyć operację usuwania
            return
        }
        // Usuń użytkownika z bazy danych
        existingUser?.remove()
    }
}

fun getUserIdByUsernameAndPassword(username: String, password: String): Int? {
    return transaction {
        // Sprawdzenie, czy istnieje rekord w tabeli Users o podanym użytkowniku i haśle
        val result = Users.select { Users.username eq username and (Users.password eq password) }
            .limit(1)
            .toList()

        if (result.isNotEmpty()) {
            // Zwróć identyfikator użytkownika, gdy rekord istnieje
            result[0][Users.id].value
        } else {
            // Zwróć null, gdy rekord nie istnieje
            null
        }
    }
}

fun authenticateUser(username: String, password: String): Boolean {
    return transaction {
        // Sprawdzenie, czy istnieje rekord w tabeli Users o podanym użytkowniku i haśle
        Users.select { Users.username eq username and (Users.password eq password) }
            .count() > 0
    }
}
*/


object DatabaseFactory {
    fun init() {
        val driverClassName = "org.h2.Driver"
        val jdbcURL = "jdbc:h2:file:./build/db"
        val database = Database.connect(jdbcURL, driverClassName)
        transaction(database) {
            SchemaUtils.create(Users)
        }
    }
    suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}

