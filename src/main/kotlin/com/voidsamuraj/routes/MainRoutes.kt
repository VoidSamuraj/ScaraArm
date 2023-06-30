package com.voidsamuraj.routes

import com.voidsamuraj.jwtExpirationSeconds
import com.voidsamuraj.models.MyToken
import com.voidsamuraj.plugins.checkPermission
import com.voidsamuraj.plugins.getTokenExpirationDate
import io.ktor.server.application.*
import io.ktor.server.freemarker.respondTemplate
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*


fun Route.mainRoutes(){
    route("/index"){
        get {

            checkPermission(token = call.sessions.get("TOKEN")as MyToken?,
                onSuccess = {

                    call.respondTemplate(template = "index.ftl", model= mapOf("expiration" to getTokenExpirationDate(call.sessions.get("TOKEN")as MyToken?)?.time,"lifeTime" to jwtExpirationSeconds))
                },
                onFailure = { call.respondRedirect("/login")}
            )

        }
    }



}