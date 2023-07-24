package com.voidsamuraj.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.voidsamuraj.Keys
import com.voidsamuraj.dao.dao
import com.voidsamuraj.jwtExpirationSeconds
import com.voidsamuraj.models.MyToken
import com.voidsamuraj.security.HashPassword
import com.voidsamuraj.models.User
import com.voidsamuraj.plugins.checkPermission
import com.voidsamuraj.plugins.decodeToken
import com.voidsamuraj.plugins.getTokenExpirationDate
import com.voidsamuraj.plugins.getUserId
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.freemarker.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.server.util.*
import io.ktor.util.*
import io.ktor.util.pipeline.*
import java.io.File
import java.util.Date

var errorMessage:String=""
suspend fun PipelineContext<Unit,ApplicationCall>.onAuthenticate(user:User){
    generateToken(user)
    call.respondRedirect("/index")

}
fun PipelineContext<Unit,ApplicationCall>.generateToken(user:User):MyToken{
    val token = JWT.create()
        .withClaim("id", user.id)
        .withClaim("login", user.login)
        .withClaim("password", user.password)
        .withClaim("filesId", user.filesId)
        .withExpiresAt(Date(System.currentTimeMillis() + jwtExpirationSeconds* 1000))
        .sign(Algorithm.HMAC256(Keys.JWTSecret))
    val myToken=MyToken(token)
    call.sessions.set(myToken)
    return myToken
}

suspend fun PipelineContext<Unit,ApplicationCall>.onAuthError(){
    call.respondRedirect("/login")

}
fun Route.authRoute(){
    get("/login"){
        if(errorMessage!=""){
            call.respondTemplate(template="login.ftl", model = mapOf("message" to errorMessage))
            errorMessage=""
        }else{
            val token=call.sessions.get("TOKEN")as MyToken?
            checkPermission(token = token,
                onSuccess = {
                    call.respondRedirect("/index")},
                onFailure = {
                    call.respondTemplate(template="login.ftl",model = mapOf("message" to ""))
                })
        }
    }

    post("/auth") {
        val formParameters = call.receiveParameters()
        val login = formParameters.getOrFail("login")
        val password = formParameters.getOrFail("password")
        val dbPassword=dao.getUserPassword(login=login)
        if(dbPassword!=null&&HashPassword.comparePasswords(password,dbPassword))
            dao.getUserId(login)?.let {id -> dao.getUser(id)?.let{user ->  onAuthenticate(user)}}
        else {
            errorMessage="Login error"
            onAuthError()
        }
    }
        post("/extend"){
            val token=call.sessions.get("TOKEN")as MyToken?
            checkPermission(token = token,
                onSuccess = {
                    val decodedToken= decodeToken(token?.token)
                    val user=User(
                        decodedToken.claims["id"]!!.asInt(),
                        decodedToken.claims["login"]!!.asString(),
                        decodedToken.claims["password"]!!.asString(),
                        decodedToken.claims["filesId"]!!.asString())

                    getTokenExpirationDate(generateToken(user))?.time?.let { it1 -> call.attributes.put(AttributeKey("expiration"), it1.toString()) }

                    call.respond(HttpStatusCode.OK, "Success")
                },
                onFailure = { call.respondRedirect("/login")}
            )
        }
    post("/logout") {
        call.sessions.clear("TOKEN")
        call.respondText("Logged out successfully")
    }

    post("/register") {
        val formParameters = call.receiveParameters()
        val login = formParameters.getOrFail("login")
        val password = HashPassword.hashPassword(formParameters.getOrFail("password"))
        val newUser=dao.addNewUser(login = login, password =  password, filesId = "")
        if(newUser!=null)
            onAuthenticate(newUser)
        else {
            errorMessage="Register error"
            onAuthError()
        }
    }
    post("/delete") {
        val token=call.sessions.get("TOKEN")as MyToken?
        call.sessions.clear("TOKEN")
        getUserId(token)?.let{userId->
            dao.getUser(userId)?.filesId?.split(";")?.forEach { fileId->
                File(filesFolder+"/"+dao.getFileName(fileId.toInt())).delete()
                dao.deleteFile(fileId.toInt())
            }
            dao.deleteUser(userId)
            call.respondText("Account deleted successfully")
        }


    }
}