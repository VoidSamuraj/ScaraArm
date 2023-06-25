package com.voidsamuraj.plugins

import com.voidsamuraj.routes.fileRoute
import com.voidsamuraj.routes.mainRoutes
import com.voidsamuraj.routes.staticRoute
import com.voidsamuraj.routes.authRoute
import io.ktor.server.routing.*
import io.ktor.server.application.*

fun Application.configureRouting() {

    staticRoute()
    routing {
        authRoute()
        fileRoute()
        mainRoutes()
    }
}


