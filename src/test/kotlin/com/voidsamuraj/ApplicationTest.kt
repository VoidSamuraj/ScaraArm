package com.voidsamuraj

import com.voidsamuraj.dao.DAOMethods
import com.voidsamuraj.dao.DatabaseFactory
import io.ktor.server.testing.*
import kotlin.test.*
import com.voidsamuraj.plugins.*
import kotlinx.coroutines.runBlocking

class ApplicationTest {
    @Test
    fun testRoot() = testApplication {
        application {
            DatabaseFactory.init()

            configureRouting()

            DAOMethods().apply {
                runBlocking {
                    val user=addNewUser("Karol", "1234","1,2,3")
                    assertNotNull(user)
                    assertNotNull(user.id)
                    val newUser=getUser(user.id)
                    assertNotNull(newUser)
                    assertEquals(newUser.firstName, "Karol")
                }
            }

        }

    }
}
