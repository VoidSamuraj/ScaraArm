package com.voidsamuraj.plugins

import com.voidsamuraj.Keys
import com.voidsamuraj.models.User
import io.ktor.server.application.*
import io.ktor.server.sessions.*
import java.io.File

// ...
fun Application.configureSession() {

    val secretEncryptKey = Keys.EncryptKey
    val secretSignKey = Keys.SignKey

    install(Sessions){
        header<User>("SCARA_ARM", directorySessionStorage(File("build/.sessions"))) {
            transform(SessionTransportTransformerEncrypt(secretEncryptKey, secretSignKey))
        }
    }
}