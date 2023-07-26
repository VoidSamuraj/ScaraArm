package com.voidsamuraj.plugins

import com.voidsamuraj.routes.*
import io.ktor.server.routing.*
import io.ktor.server.application.*

fun Application.configureRouting() {

    staticRoute()
    routing {
        authRoute()
        fileRoute()
        mainRoutes()
        armRoute()
    }
}


