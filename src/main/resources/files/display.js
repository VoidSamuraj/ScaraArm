import * as THREE from '/static/three/build/three.module.js'
import {loadSTL}from '/static/stl.js'
import {createCircle,createRing,updateRing,addGrid,addLight,drawLines,updateTextTexture}from '/static/elements.js'
import {setupHelpers}from '/static/sceneHelper.js'
import {rotateArm1,rotateArm2}from '/static/movement.js'
//import { TextBufferGeometry } from '/static/three/examples/jsm/geometries/TextGeometry.js';

var przesuwanie=false;
var isDragging=false;
const panelSize=20;
const lastMouseClicked = new THREE.Vector2();
const stlNames=['blok','ramie1','ramie2','tool'];
const arm2Movement=1.2;
const maxHeight=3.4;
const minHeight=0;
const MAX_ARM1_ANGLE=130;
const MAX_ARM2_ANGLE=160;
const armStep=1;
const armColor=0xffa31a;
const selectColor=0xff0000;

var currentHeight=0;
var currentToolX=9.55;
var currentToolY=0;//9.55

var baseMesh=new THREE.Object3D();
var arm1Mesh=new THREE.Object3D();
var arm2Mesh=new THREE.Object3D();
var toolMesh=new THREE.Object3D();

var lastSelectedMesh;

const axesHelper1 = new THREE.AxesHelper(3);
const axesHelper2 = new THREE.AxesHelper(3);
const raycaster = new THREE.Raycaster();

var arm1Pos= new THREE.Vector2();
var arm2Pos= new THREE.Vector2();

var editMode=false;
var toolEditMode=false;

var arm1Angle=0;
var arm2Angle=0;
var arm2AngleOnly=0;

const rotation1 = new THREE.Group();
const rotation2 = new THREE.Group();


const canvas= document.getElementById('myCanvas');
const canvasHelper= document.getElementById('pivot');

// Inicjalizacja sceny
const scene = new THREE.Scene();
const sceneHelper = new THREE.Scene();


const textGeometry1 = new THREE.PlaneGeometry(0.5, 0.5);
const textGeometry2 = new THREE.PlaneGeometry(0.5, 0.5);
const textMaterial1 = new THREE.MeshBasicMaterial({ transparent: true });
const textMaterial2 = new THREE.MeshBasicMaterial({ transparent: true });

// Stwórz Mesh z użyciem geometrii tekstu i materiału tekstu
const arm1Text = new THREE.Mesh(textGeometry1, textMaterial1);
scene.add(arm1Text);
const arm2Text = new THREE.Mesh(textGeometry2, textMaterial2);
scene.add(arm2Text);

const circleMesh1= createCircle(scene,5,0,4.26,0.4);

const circleMesh2= createCircle(scene,arm2Movement,0,6.06,0.4);

var ringMesh1= createRing(scene,5,0,4.26,0.4,0.5,0);
ringMesh1.rotateX(Math.PI);

var ringMesh2= createRing(scene,arm2Movement,0,6.06,0.4,0.5,0);


arm1Text.rotateX(-Math.PI/2);
arm2Text.rotateX(-Math.PI/2);

updateTextTexture("0",30,arm1Text,5,0,4.26);
updateTextTexture("0",30,arm2Text,arm2Movement,0,6.06);

// Kamera
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.OrthographicCamera(
  width / -2, // lewy kraniec
  width / 2, // prawy kraniec
  height / 2, // górny kraniec
  height / -2, // dolny kraniec
  1, // bliski plan
  1000 // daleki plan
);
camera.position.set(0, 5, 20);


const pivotPointHelper = new THREE.Object3D();
const cameraCanvasHelper = new THREE.PerspectiveCamera(75, canvasHelper.width / canvasHelper.height, 0.01, 1000);

// Punkt obrotu kamery
const pivotPoint = new THREE.Object3D();
pivotPoint.add(camera);
scene.add(pivotPoint);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x1b1b1b);

const rendererHelper = new THREE.WebGLRenderer({ canvas: canvasHelper });
rendererHelper.setSize( canvasHelper.width, canvasHelper.height );
rendererHelper.setClearColor(0x1b1b1b);

addLight(scene,panelSize);
addGrid(scene,panelSize,0, 0,-1);

// Rysowanie sceny
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  rendererHelper.render(sceneHelper, cameraCanvasHelper);
}
animate();

//obrot
rotateCamera(pivotPoint,pivotPointHelper, canvas);
//przesuwanie
move();
scroll(camera,canvas);


//stl
loadSTL(stlNames[0],panelSize/4, 0,-1, mesh => { baseMesh.add(mesh); });
loadSTL(stlNames[1],panelSize/4, 0,-1, mesh => { arm1Mesh.add(mesh); });
loadSTL(stlNames[2],panelSize/4, 0,-1, mesh => { arm2Mesh.add(mesh); });
loadSTL(stlNames[3],panelSize/4, 0,-1, mesh => { toolMesh.add(mesh);lastSelectedMesh=toolMesh; });

rotation2.add(arm2Mesh);
rotation2.add(toolMesh);
rotation2.add(arm2Text);
rotation2.add(circleMesh2);
rotation2.add(ringMesh2);

rotation1.add(arm1Mesh);
rotation1.add(rotation2);

setupHelpers(cameraCanvasHelper,sceneHelper,pivotPointHelper,rotation1,rotation2,axesHelper1,axesHelper2,panelSize,arm2Movement);

scene.add(rotation1);
scene.add(rotation2);
scene.add(baseMesh);

drawLines(scene, panelSize);

function rotateCamera(pivotPoint,pivotPointHelper,canvas) {
    const previousMousePosition = new THREE.Vector2();


    canvas.addEventListener('mousedown', (event) => {
        //zablokuj normalną obsługę
        event.preventDefault();
        isDragging=false;
        lastMouseClicked.x = (event.clientX / window.innerWidth) * 2 - 1;
        lastMouseClicked.y = -(event.clientY / window.innerHeight) * 2 + 1;

         if (event.button === 1) {
             if(przesuwanie){
                 previousMousePosition.set(event.clientX, event.clientY);

                 canvas.addEventListener('mousemove', mousemoveMovement);
                 canvas.addEventListener('mouseup', mouseupMovement);
            }else{
                previousMousePosition.set(event.clientX, event.clientY);

                canvas.addEventListener('mousemove', mousemoveRotation);
                canvas.addEventListener('mouseup', mouseupRotation);
            }
        }else if(event.button === 0){
               previousMousePosition.set(event.clientX, event.clientY);
               canvas.addEventListener('mouseup', STLUpEvent);
        }

    });

    function mousemoveRotation(event) {
        const sensitivity = 0.005;
        pivotPoint.rotation.y -= (event.clientX-previousMousePosition.x) * sensitivity;
        pivotPoint.rotation.x -= (event.clientY-previousMousePosition.y) * sensitivity;
        pivotPointHelper.rotation.y -= (event.clientX-previousMousePosition.x) * sensitivity;

        arm1Text.rotation.z -= (event.clientX-previousMousePosition.x) * sensitivity;
        arm2Text.rotation.z -= (event.clientX-previousMousePosition.x) * sensitivity;

        pivotPointHelper.rotation.x -= (event.clientY-previousMousePosition.y) * sensitivity;

        previousMousePosition.set(event.clientX, event.clientY);
    }
    function mousemoveMovement(event) {
        const sensitivity = 0.005;
        pivotPoint.translateX(-(event.clientX-previousMousePosition.x) * sensitivity);
        pivotPoint.translateY(-(previousMousePosition.y-event.clientY) * sensitivity);
        previousMousePosition.set(event.clientX, event.clientY);
    }

    function mouseupRotation() {
        canvas.removeEventListener('mousemove', mousemoveRotation);
        canvas.removeEventListener('mouseup', mouseupRotation);
    }
    function mouseupMovement() {
            canvas.removeEventListener('mousemove', mousemoveMovement);
            canvas.removeEventListener('mouseup', mousemoveMovement);
    }
    function STLUpEvent(event) {
        selectSTL();
        canvas.removeEventListener('mouseup', STLUpEvent);
    }

}

async function move(){
    document.addEventListener('keydown', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=true;
        }if(toolEditMode){
            if(event.code === 'ArrowUp'||event.code === 'Numpad8'){
                   currentToolX+=armStep;
                if(!canMove())
                    currentToolX-=armStep;
                else{
                     currentToolX-=armStep;
                        currentToolX+=armStep;///5;
                        moveToolToPosition();
                }

            }else if(event.code === 'ArrowDown'||event.code === 'Numpad2'){
                 currentToolX-=armStep;
                if(!canMove())
                    currentToolX+=armStep;
                else{
                     currentToolX+=armStep;
                        currentToolX-=armStep;///5;
                        moveToolToPosition();
                }
                /*currentToolX-=armStep;
                if(!moveToolToPosition())
                   currentToolX+=armStep;*/
            }else if(event.code === 'ArrowLeft'||event.code === 'Numpad4'){
                currentToolY+=armStep;
               if(!canMove())
                   currentToolY-=armStep;
               else{
                    currentToolY-=armStep;
                       currentToolY+=armStep;///5;
                       moveToolToPosition();
               }
                /*if(!moveToolToPosition())
                    currentToolY-=armStep;*/
            }else if(event.code === 'ArrowRight'||event.code === 'Numpad6'){
                currentToolY-=armStep;
                 if(!canMove())
                    currentToolY+=armStep;
                 else{
                     currentToolY+=armStep;
                        currentToolY-=armStep;///5;
                        moveToolToPosition();
               }
            }
        }
    });
    document.addEventListener('keyup', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=false;
        }
    });
}


function canMove(){
    const Lr = 3.8;
    const Sr = 5.75;
    const newRadius = Math.hypot(currentToolX, currentToolY);

    if (newRadius > 9.55) {
        console.error("Object is outside workspace R<${newRadius}");
        return false;
    }
    let gamma = Math.atan2(currentToolY, currentToolX);
    let toBeta = (Lr * Lr + Sr * Sr - currentToolX * currentToolX - currentToolY * currentToolY) / (2 * Lr * Sr);
    let beta = Math.acos(toBeta);

    let toAlpha = (currentToolX * currentToolX + currentToolY * currentToolY + Lr * Lr - Sr * Sr) / (2 * Lr * newRadius);
    let alpha = Math.acos(toAlpha);

    let angle = gamma + alpha;
    var arm1AngleNew = -(angle  * (180 / Math.PI));
    var arm2AngleNew = 180- (beta * (180 / Math.PI))-arm2AngleOnly;

    if (isNaN(arm1AngleNew))
        arm1AngleNew = 0;

    if (isNaN(arm2AngleNew))
        arm2AngleNew = 0;

    if(arm1AngleNew>MAX_ARM1_ANGLE || arm1AngleNew<-MAX_ARM1_ANGLE)
        return false;
    if(arm2AngleNew>MAX_ARM2_ANGLE || arm2AngleNew<-MAX_ARM2_ANGLE)
       return false;

    return true;
}

function moveToolToPosition(){

    const Lr = 3.8;
    const Sr = 5.75;
    let newRadius = Math.hypot(currentToolX, currentToolY);

    let gamma = Math.atan2(currentToolY, currentToolX);
    let toBeta = (Lr * Lr + Sr * Sr - currentToolX * currentToolX - currentToolY * currentToolY) / (2 * Lr * Sr);
    let beta = Math.acos(toBeta);

    let toAlpha = (currentToolX * currentToolX + currentToolY * currentToolY + Lr * Lr - Sr * Sr) / (2 * Lr * newRadius);
    let alpha = Math.acos(toAlpha);

    let angle = gamma + alpha;
    let arm1AngleNew = -(angle  * (180 / Math.PI));
    let arm2AngleNew = 180- (beta * (180 / Math.PI))-arm2AngleOnly;

    if (isNaN(arm1AngleNew)) {
    arm1AngleNew = 0;
    }

    if (isNaN(arm2AngleNew)) {
    arm2AngleNew = 0;
    }

    let arm1AngleNewCp=arm1AngleNew-arm1Angle;
    let arm2AngleNewCp=arm2AngleNew-arm2Angle;
    let arm1AngleNewRound=Math.floor(arm1AngleNewCp);
    let arm2AngleNewRound=Math.floor(arm2AngleNewCp);
    let canRotate=true;
    if(arm1AngleNew>MAX_ARM1_ANGLE || arm1AngleNew<-MAX_ARM1_ANGLE)
        canRotate=false;
    if(arm2AngleNew>MAX_ARM2_ANGLE || arm2AngleNew<-MAX_ARM2_ANGLE)
        canRotate=false;


    let loop=Math.abs(Math.floor(arm1AngleNewCp)*Math.floor(arm2AngleNewCp));
    if(loop==0)
        loop=Math.max(Math.ceil(Math.abs(arm1AngleNewCp)),Math.ceil(Math.abs(arm2AngleNewCp)));
    let steps=0;
    let arm1Add=Math.sign(arm1AngleNewCp);
    let arm2Add=Math.sign(arm2AngleNewCp);
    let arm1rot=0;
    let arm2rot=0;
    if(canRotate&&(arm1AngleNewCp!=0||arm2AngleNewCp!=0))
        for(let i=0; i<=loop;i++){
            let firstCheck=(arm1AngleNewCp>=1||arm1AngleNewCp<=-1)&&(i%arm1AngleNewRound==0);
            let secondCheck=(arm2AngleNewCp>=1||arm2AngleNewCp<=-1)&&(i%arm2AngleNewRound==0);

        if(firstCheck||secondCheck){
             setTimeout(function() {
               if(firstCheck){

                         arm1Angle+=arm1Add;
                         rotateArm1(arm1Add,rotation1,arm2Angle,rotation2,arm2Movement,panelSize);
                         updateTextTexture((Math.round(arm1Angle%360)).toString(),30,arm1Text,5,0,4.26);
                         updateRing(ringMesh1,0.4,0.5,arm1Angle%360);
                         arm2Text.rotation.z += arm1Add * Math.PI / 180;
                         arm1AngleNewCp-=arm1Add;

                }
                if(secondCheck){


                        arm2Angle+=arm2Add;
                        rotateArm2(rotation2,arm2Add,arm2Movement);
                        updateTextTexture((Math.round(arm2Angle%360)).toString(),26,arm2Text,arm2Movement,0,6.06);
                        updateRing(ringMesh2,0.4,0.5,arm2Angle%360);
                        arm2Text.rotation.z += arm2Add * Math.PI / 180;
                        arm2AngleNewCp-=arm2Add;

                }


                //for less than 1
                if(i==loop){
                    if(arm1AngleNewCp!=0){
                        arm1Angle+=arm1AngleNewCp;
                        rotateArm1(arm1AngleNewCp,rotation1,arm2Angle,rotation2,arm2Movement,panelSize);
                        updateTextTexture((Math.round(arm1Angle%360)).toString(),30,arm1Text,5,0,4.26);
                        updateRing(ringMesh1,0.4,0.5,arm1Angle%360);
                        arm2Text.rotation.z += arm1AngleNewCp * Math.PI / 180;
                        }
                    if(arm2AngleNewCp!=0){
                        arm2Angle+=arm2AngleNewCp;
                        rotateArm2(rotation2,arm2AngleNewCp,arm2Movement);
                        updateTextTexture((Math.round(arm2Angle%360)).toString(),26,arm2Text,arm2Movement,0,6.06);
                        updateRing(ringMesh2,0.4,0.5,arm2Angle%360);
                        arm2Text.rotation.z += arm2AngleNewCp * Math.PI / 180;
                        }
                }
                }, 5 * steps);
                console.log("steps");
                console.log(steps);

                ++steps;
            }else if(i==loop && ((arm1AngleNewCp!=0) || (arm2AngleNewCp!=0))){
                setTimeout(function() {
                    arm1Angle+=arm1AngleNewCp;
                    rotateArm1(arm1AngleNewCp,rotation1,arm2Angle,rotation2,arm2Movement,panelSize);
                    updateTextTexture((Math.round(arm1Angle%360)).toString(),30,arm1Text,5,0,4.26);
                    updateRing(ringMesh1,0.4,0.5,arm1Angle%360);
                    arm2Text.rotation.z += arm1AngleNewCp * Math.PI / 180;

                    arm2Angle+=arm2AngleNewCp;
                    rotateArm2(rotation2,arm2AngleNewCp,arm2Movement);
                    updateTextTexture((Math.round(arm2Angle%360)).toString(),26,arm2Text,arm2Movement,0,6.06);
                    updateRing(ringMesh2,0.4,0.5,arm2Angle%360);
                    arm2Text.rotation.z += arm2AngleNewCp * Math.PI / 180;

                }, 5 * steps);
            }
        }
}


function scroll(camera, canvas) {
  let zoomLevel = 80;
  camera.zoom = zoomLevel;
  camera.updateProjectionMatrix();

  canvas.addEventListener('wheel', (event) => {
    // zapobiegaj domyślnej akcji
    event.preventDefault();

    if(editMode){
        const zoomChange = event.deltaY > 0 ? 1 : -1;
        switch(lastSelectedMesh.children[0].name){

            case stlNames[1]:
                if((arm1Angle+zoomChange)>=-MAX_ARM1_ANGLE&&(arm1Angle+zoomChange)<=MAX_ARM1_ANGLE){
                    arm1Angle+=zoomChange;
                    rotateArm1(zoomChange,rotation1,arm2Angle,rotation2,arm2Movement,panelSize);
                    updateTextTexture((Math.round(arm1Angle%360)).toString(),30,arm1Text,5,0,4.26);
                    updateRing(ringMesh1,0.4,0.5,arm1Angle%360);
                    arm2Text.rotation.z += zoomChange * Math.PI / 180;
                    updateToolPos();
                }
                break;
            case stlNames[2]:
                if((arm2Angle+zoomChange)>=-MAX_ARM2_ANGLE&&(arm2Angle+zoomChange)<=MAX_ARM2_ANGLE){
                    arm2Angle+=zoomChange;
                    rotateArm2(rotation2,zoomChange,arm2Movement);
                    updateTextTexture((Math.round(arm2Angle%360)).toString(),26,arm2Text,arm2Movement,0,6.06);
                    updateRing(ringMesh2,0.4,0.5,arm2Angle%360);
                    arm2Text.rotation.z += zoomChange * Math.PI / 180;
                    updateToolPos();
                }
                break;
            case stlNames[3]:
                if((zoomChange>0&&currentHeight<maxHeight)||(zoomChange<0&&currentHeight>minHeight)){
                    const scale=0.1;
                    currentHeight+=zoomChange*scale;
                    toolMesh.translateY(zoomChange*scale);
                }
                break;
        }

    }else{

        const zoomChange = event.deltaY > 0 ? 5 : -5;
        zoomLevel += zoomChange;

        // ograniczenie zakresu przybliżenia
        zoomLevel = Math.max(zoomLevel, 50.0);
        zoomLevel = Math.min(zoomLevel, 250.0);

        // zmiana wartości przybliżenia kamery
        camera.zoom = zoomLevel;

        // odświeżenie kamery
        camera.updateProjectionMatrix();
    }
  });
}

function selectSTL(){
      // check if clicked on object
      raycaster.setFromCamera(lastMouseClicked, camera);
      const meshes = [baseMesh, arm1Mesh, arm2Mesh,toolMesh];

      const intersects = raycaster.intersectObjects(meshes);

      lastSelectedMesh.children[0].material.color.set(armColor);

      axesHelper1.visible=false;
      axesHelper2.visible=false;

      editMode=false;
      toolEditMode=false;

      if (intersects.length > 0) {
            //closest object
            const object = intersects[0].object;
            editMode=true;
            if(object.name!=stlNames[0]){
                switch(object.name){
                    case stlNames[1]:
                         lastSelectedMesh=meshes[1];
                           axesHelper1.visible=true;
                        break;
                    case stlNames[2]:
                         lastSelectedMesh=meshes[2];
                         axesHelper2.visible=true;
                        break;
                    case stlNames[3]:
                         lastSelectedMesh=meshes[3];
                         toolEditMode=true;
                        break;
                }
                lastSelectedMesh.children[0].material.color.set(selectColor);
            }
      }
}
