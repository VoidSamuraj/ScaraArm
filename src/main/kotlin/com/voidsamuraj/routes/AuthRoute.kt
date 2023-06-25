package com.voidsamuraj.routes

import com.voidsamuraj.dao.dao
import com.voidsamuraj.models.User
import io.ktor.server.application.*
import io.ktor.server.freemarker.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.server.util.*
import io.ktor.util.pipeline.*

var errorMessage:String=""
suspend fun PipelineContext<Unit,ApplicationCall>.onAuthenticate(user:User){
    call.sessions.set(user)
    call.respondRedirect("/index")

}
suspend fun PipelineContext<Unit,ApplicationCall>.onAuthError(){
    call.respondRedirect("/login")

}
fun Route.authRoute(){
    route("/login"){
        post {
            val formParameters = call.receiveParameters()
            val username = formParameters.getOrFail("username")
            val password = formParameters.getOrFail("password")
            val user=dao.getUser(firstName=username,password= password)
            if(user!=null)
                onAuthenticate(user)
            else {
                errorMessage="Login error"
                onAuthError()
            }
        }
        get {
            if(errorMessage!=""){
                call.respondTemplate(template="login.ftl", model = mapOf("message" to errorMessage))
                errorMessage=""

            }else{
                call.respondTemplate(template="login.ftl",model = mapOf("message" to ""))
            }
        }
    }



    route("/register"){
        post {
            val formParameters = call.receiveParameters()
            val username = formParameters.getOrFail("username")
            val password = formParameters.getOrFail("password")
            val newUser=dao.addNewUser(firstName = username, password =  password, filesId = "")
            if(newUser!=null)
                onAuthenticate(newUser)
            else {
                errorMessage="Register error"
                onAuthError()
            }
        }
    }

}