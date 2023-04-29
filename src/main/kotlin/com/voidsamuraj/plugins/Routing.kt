package com.voidsamuraj.plugins

import com.voidsamuraj.routes.mainRoutes
import com.voidsamuraj.routes.staticRoute
import io.ktor.server.routing.*
import io.ktor.server.application.*

fun Application.configureRouting() {

    staticRoute()
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


