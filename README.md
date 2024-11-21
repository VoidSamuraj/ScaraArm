# Scara Arm

![Static Badge](https://img.shields.io/badge/JVM-11.0.21-blue)
![Static Badge](https://img.shields.io/badge/Kotlin-1.8.21-purple)
![Static Badge](https://img.shields.io/badge/Ktor-2.3.1-purple?color=5300EB)
![Static Badge](https://img.shields.io/badge/Three.js-r152-yellow?color=ffc107)
![Static Badge](https://img.shields.io/badge/H2-2.1.214-green)
![Static Badge](https://img.shields.io/badge/exposed-0.41.1-green?color=008B02)

## Description
Ktor server to control Scara arm

- I built this project to experiment with robotic arms to be able to create more advanced robotic arms in the future.
- There are many possible applications for this, especially those related to G-Code.
- To create this project, I had to learn about the Ktor server, Three.js, and some mathematics in kinematics.

## Features
- moving the robotic arm manually (only on a computer).
- moving robotic arm by G-Code file.
- visualization of the G-Code file, arm movement.
- accounts and private files.


## Usage

<p align="center">
    
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot1.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot2.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot3.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot4.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot5.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot6.jpg?raw=true"  width="48%"/> 
  <img src="https://github.com/VoidSamuraj/ScaraArm/blob/master/assets/images/screenshot7.jpg?raw=true"  width="48%"/> 
    
</p>

## Installation

- server works with robotic arm based on <a href="https://github.com/VoidSamuraj/Arduino-Scara-Arm">Arduino-Scara-Arm</a>
- Insert your keys in: src/main/kotlin/com/voidsamuraj/Keys.kt:
```
package com.voidsamuraj
import io.ktor.util.*

object Keys {
    val EncryptKey = hex("YOUR_ENCRYPTION_KEY")
    val SignKey = hex("YOUR_SIGN_KEY")
    val JWTSecret = "YOUR_JWT_SECRET"
}
  ```
- The Project uses Kotlin and requires JVM.
- There is an included Three.js library; if you want to change the version, you have to change the import paths in the used lib files, as I did, e.g., "/static/three/build/three.module.js." Lib is under: src/main/resources/files/three.
- Build jar and Run.

## License
  This project is under GNU <a href="https://github.com/VoidSamuraj/ScaraArm/blob/master/LICENSE.txt">License</a>.

