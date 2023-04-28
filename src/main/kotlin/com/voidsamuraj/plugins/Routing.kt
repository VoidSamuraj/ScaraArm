package com.voidsamuraj.plugins

import com.voidsamuraj.routes.fileRoute
import com.voidsamuraj.routes.mainRoutes
import com.voidsamuraj.routes.userRoute
import io.ktor.server.routing.*
import io.ktor.server.application.*

fun Application.configureRouting() {
    routing {
        /*get("/") {
            call.respondText("Hello World!")
        }*/
            userRoute()
            fileRoute()

        //static("/static") {
            //resources("templates")
        //}
        mainRoutes()
    }
}


