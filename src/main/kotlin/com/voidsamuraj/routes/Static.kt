package com.voidsamuraj.routes

import io.ktor.server.routing.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
fun Application.staticRoute(){
    routing {
        staticResources("/static","files")
    }
}