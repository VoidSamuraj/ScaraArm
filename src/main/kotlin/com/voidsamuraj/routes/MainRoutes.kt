package com.voidsamuraj.routes

import com.voidsamuraj.files
import io.ktor.server.application.*
import io.ktor.server.freemarker.*
import io.ktor.server.routing.*


fun Route.mainRoutes(){
    route("/klienci"){
        get {
            call.respondTemplate(template="index.ftl", model=mapOf("files" to files))
        }
    }

}