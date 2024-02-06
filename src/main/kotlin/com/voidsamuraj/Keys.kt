package com.voidsamuraj
import io.ktor.util.*

object Keys {
    val EncryptKey = hex("YOUR_ENCRYPTION_KEY")
    val SignKey = hex("YOUR_SIGN_KEY")
    val JWTSecret = "YOUR_JWT_SECRET"
}
