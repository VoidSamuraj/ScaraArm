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
![Screenshot 1](assets/images/screenshot1.png)
![Screenshot 2](assets/images/screenshot2.png)
## Installation

- Insert your keys in: src/main/kotlin/com/voidsamuraj/Keys.kt.
- The Project uses Kotlin and requires JVM.
- There is an included Three.js library; if you want to change the version, you have to change the import paths in the used lib files, as I did, e.g., "/static/three/build/three.module.js." Lib is under: src/main/resources/files/three.
- Build jar and Run.

## License
  This project is under GNU <a href="https://github.com/VoidSamuraj/ScaraArm/blob/master/LICENSE.txt">License</a>.

