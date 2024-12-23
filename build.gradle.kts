val ktor_version: String by project
val kotlin_version: String by project
val logback_version: String by project
val codec_version:String by project
val exposed_version: String by project
val h2_version: String by project


plugins {
    kotlin("jvm") version "1.8.10"
    id("io.ktor.plugin") version "2.3.8"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.8.10"
    id("com.github.johnrengelman.shadow") version "6.0.0"
}

group = "com.voidsamuraj"
version = "0.0.1"
application {
    mainClass.set("io.ktor.server.netty.EngineMain")
    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
}
//for release
task("buildJar"){
    dependsOn("clean","shadowJar")
}

dependencies {
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-core-jvm:$ktor_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jwt-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-netty-jvm:$ktor_version")


    implementation("commons-codec:commons-codec:$codec_version")

    implementation("ch.qos.logback:logback-classic:$logback_version")
    testImplementation("io.ktor:ktor-server-tests-jvm:$ktor_version")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5:1.8.21")
    testImplementation(kotlin("test"))
    testImplementation("io.mockk:mockk:1.13.9")

    implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.1")
    implementation("io.ktor:ktor-client-serialization-jvm:1.6.4")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")
    implementation("io.ktor:ktor-freemarker:1.6.4")
    implementation("io.ktor:ktor-server-core:$2.2.4-eap-601")
    implementation("io.ktor:ktor-server-freemarker:2.1.2")

    implementation("io.ktor:ktor-server-sessions:$ktor_version")

    //database
    implementation("org.jetbrains.exposed:exposed-core:$exposed_version")
    implementation("org.jetbrains.exposed:exposed-dao:$exposed_version")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposed_version")
    implementation("com.h2database:h2:$h2_version")

    implementation("io.ktor:ktor-server-auth:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jwt:$ktor_version")
    implementation("io.ktor:ktor-server-cors:$ktor_version")
    implementation("org.mindrot:jbcrypt:0.4")

    //WebSockets
    implementation("io.ktor:ktor-server-websockets:$ktor_version")

    // https://mvnrepository.com/artifact/com.fazecast/jSerialComm
    implementation("com.fazecast:jSerialComm:2.10.2")

}
tasks.test {
    useJUnitPlatform()
}