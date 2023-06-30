package com.voidsamuraj.plugins

import com.voidsamuraj.Keys
import com.voidsamuraj.jwtExpirationSeconds
import com.voidsamuraj.models.MyToken
import io.ktor.server.application.*
import io.ktor.server.sessions.*
import java.io.File

fun Application.configureSession() {
    install(Sessions) {
        cookie<MyToken>("TOKEN", directorySessionStorage(File("build/.sessions"))) {
            transform(SessionTransportTransformerEncrypt(Keys.EncryptKey, Keys.SignKey))
            cookie.maxAgeInSeconds =jwtExpirationSeconds
        }
    }

}


