package com.voidsamuraj.plugins

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureSerialization() {
    install(ContentNegotiation) {

        json()
        /*json(Json {
            serializersModule = SerializersModule {
                polymorphic(ContentConverter::class) {
                    subclass(FreeMarkerContent::class, FreeMarkerContent.serializer())
                }
            }
        })*/
    }

    routing {
        get("/json/kotlinx-serialization") {
                call.respond(mapOf("hello" to "world"))
            }
    }
}
