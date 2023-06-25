package com.voidsamuraj.routes

import com.voidsamuraj.models.User
import io.ktor.server.application.*
import io.ktor.server.freemarker.respondTemplate
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*


fun Route.mainRoutes(){
    route("/index"){
        get {
            val user=call.sessions.get<User>()
            if(user!=null) {
                call.respondTemplate(template = "index.ftl",model = mapOf("userFiles" to user.filesId))
            }else{
                call.respondRedirect("/login")
            }
        }
    }



}