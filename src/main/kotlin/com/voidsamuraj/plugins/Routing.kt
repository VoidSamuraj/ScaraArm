package com.voidsamuraj.plugins

import com.voidsamuraj.routes.mainRoutes
import io.ktor.server.routing.*
import io.ktor.server.application.*

fun Application.configureRouting() {
    routing {


        /*get("/") {
            call.respondText("Hello World!")
        }*/
         //   userRoute()
          //  fileRoute()

        //static("/static") {
            //resources("templates")
        //}
        mainRoutes()
    }
}


