import * as THREE from '/static/three/build/three.module.js'
import {loadSTL}from '/static/stl.js'
import {createCircle,createRing,updateRing,addGrid,addLight,drawLines,updateTextTexture,getArmRange,getMinDistance,drawFile}from '/static/elements.js'
import {setupHelpers}from '/static/sceneHelper.js'
import {rotateArm1,rotateArm2}from '/static/movement.js'
import { OrbitControls } from '/static/three/examples/jsm/controls/OrbitControls.js';
import {getCanMoveArm} from '/static/navigation.js'

var przesuwanie=false;
var isDragging=false;
const panelSize=20;
const lastMouseClicked = new THREE.Vector2();
const stlNames=['blok','ramie1','ramie2','tool'];
const arm2Movement=1.2;
const maxHeight=3.4;
const minHeight=-1;
const MAX_ARM1_ANGLE=130;
const MAX_ARM2_ANGLE=160;
const armStep=1;
const armColor=0xffa31a;
const selectColor=0xff0000;
var rightSide = localStorage.getItem('rightSide');//direction of arm(movement area)
if (rightSide === null)
    rightSide = false;
else
    rightSide = JSON.parse(rightSide);

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

const rotation1 = new THREE.Group();
const rotation2 = new THREE.Group();


const canvas= document.getElementById('myCanvas');
const canvasHelper= document.getElementById('pivot');
const positionText= document.getElementById('positionText');
positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
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
rendererHelper.setClearColor(0x1b1b1b,0);
let zoomLevel = 80;
camera.zoom = zoomLevel;
camera.updateProjectionMatrix();
cameraCanvasHelper.zoom = zoomLevel/2;
rendererHelper.render(sceneHelper, cameraCanvasHelper);

var controls = new OrbitControls(camera, renderer.domElement);
var controlsHelper = new OrbitControls(cameraCanvasHelper, rendererHelper.domElement);

var previousRotation = null;
var previousPosition = null;
var toUndo = new THREE.Vector3();
var temp = new THREE.Vector3();
var nowRounded;
controls.addEventListener('change', updateHelper);

function updateHelper(){
    if(previousPosition===null){
        previousPosition= new THREE.Vector3();
        previousPosition.copy(controls.object.position);
    }
    if(previousRotation==null){
        //compare don't work always with high precision
        previousRotation= new THREE.Vector3(controls.object.rotation.x.toFixed(3),controls.object.rotation.y.toFixed(3),controls.object.rotation.z.toFixed(3));
    }
    
    nowRounded= new THREE.Vector3(controls.object.rotation.x.toFixed(3),controls.object.rotation.y.toFixed(3),controls.object.rotation.z.toFixed(3));
    if (!previousRotation.equals(nowRounded)) {
        arm1Text.rotation.z +=nowRounded.z-previousRotation.z;
        arm2Text.rotation.z +=nowRounded.z-previousRotation.z;
        controlsHelper.target = sceneHelper.position;
        controlsHelper.object.rotation.copy(controls.object.rotation);
        previousRotation=new THREE.Vector3(controls.object.rotation.x.toFixed(3),controls.object.rotation.y.toFixed(3),controls.object.rotation.z.toFixed(3));
    }else{
        
        previousPosition.sub(controls.object.position);
        toUndo.add(previousPosition);
    }
    temp.addVectors(controls.object.position,toUndo);
    controlsHelper.object.position.copy(temp);
    
    rendererHelper.render(sceneHelper, cameraCanvasHelper);
    previousPosition.copy(controls.object.position);
}

renderer.domElement.addEventListener('click', selectSTL);


renderer.domElement.addEventListener('wheel', function(event) {
    if (editMode && getCanMoveArm()) {
        controls.enableZoom=false;
        const zoomChange = event.deltaY > 0 ? 1 : -1;
        switch(lastSelectedMesh.children[0].name){

            case stlNames[1]:
                if((arm1Angle+zoomChange)>=-MAX_ARM1_ANGLE&&(arm1Angle+zoomChange)<=MAX_ARM1_ANGLE){
                    arm1Angle+=zoomChange;
                    rotateArm1(zoomChange,rotation1,arm2Angle,rotation2,arm2Movement,panelSize,rightSide);
                    updateTextTexture((Math.round(arm1Angle%360)).toString(),30,arm1Text,5,0,4.26);
                    updateRing(ringMesh1,0.4,0.5,rightSide?(arm1Angle%360):(-arm1Angle%360));
                    if(rightSide)
                        arm2Text.rotation.z += zoomChange * Math.PI / 180;
                    else
                        arm2Text.rotation.z -= zoomChange * Math.PI / 180;

                    updateToolPos();
                }
                break;
            case stlNames[2]:
                if((arm2Angle+zoomChange)>=0&&(arm2Angle+zoomChange)<=MAX_ARM2_ANGLE){
                    arm2Angle+=zoomChange;
                    rotateArm2(rotation2,zoomChange,arm2Movement,rightSide);
                    updateTextTexture((Math.round(arm2Angle%360)).toString(),26,arm2Text,arm2Movement,0,6.06);
                    updateRing(ringMesh2,0.4,0.5,rightSide?(arm2Angle%360):(-arm2Angle%360));
                    if(rightSide)
                        arm2Text.rotation.z += zoomChange * Math.PI / 180;
                    else
                        arm2Text.rotation.z -= zoomChange * Math.PI / 180;

                    updateToolPos();
                }
                break;
            case stlNames[3]:
                const scale=0.1;
                if((zoomChange>0&&(currentHeight+zoomChange*scale)<maxHeight)||(zoomChange<0&&(currentHeight+zoomChange*scale)>minHeight)){
                    currentHeight+=zoomChange*scale;
                    moveArmBy(null,null,zoomChange*scale,rightSide);
                    toolMesh.translateY(zoomChange*scale);
                }
                break;
        }
    } else {
        controls.enableZoom=true;
        lastSelectedMesh.children[0].material.color.set(armColor);

    }
}, {passive: false});

addLight(scene,panelSize);
addGrid(scene,panelSize,0, 0,-1);
// rysowanie obszaru zasięgu


var armRange= getArmRange(scene,panelSize,3.8,5.75,MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,rightSide);
scene.add(armRange);
// Rysowanie sceny
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    rendererHelper.render(sceneHelper, cameraCanvasHelper);
}
animate();

move();

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
const toggle=document.getElementById("toggle");
toggle.checked=rightSide;
toggle.addEventListener("change",function() {
    //update direction
    rightSide=toggle.checked;
    localStorage.setItem('rightSide', rightSide);
    location.reload();
});

async function move(){
    document.addEventListener('keydown', (event) => {
        if(toolEditMode){
            if(event.code === 'ArrowUp'||event.code === 'Numpad8'){
                currentToolX+=armStep;
                if(!canMove())
                    currentToolX-=armStep;
                else{
                    moveToolToPosition();
                    moveArmBy(armStep,null,null,rightSide);
                }
                positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
                
            }else if(event.code === 'ArrowDown'||event.code === 'Numpad2'){
                currentToolX-=armStep;
                if(!canMove())
                    currentToolX+=armStep;
                else{
                    moveToolToPosition();
                    moveArmBy(-armStep,null,null,rightSide);
                }
                positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
            }else if(event.code === 'ArrowLeft'||event.code === 'Numpad4'){
                currentToolY+=armStep;
                if(!canMove())
                    currentToolY-=armStep;
                else{
                    moveToolToPosition();
                    moveArmBy(null,armStep,null,rightSide);
                }
                positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
            }else if(event.code === 'ArrowRight'||event.code === 'Numpad6'){
                currentToolY-=armStep;
                if(!canMove())
                    currentToolY+=armStep;
                else{
                    moveToolToPosition();
                    moveArmBy(null,-armStep,null,rightSide);
                }
                positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
            }
        }
    });
}


function canMove(){
    const Lr = 3.8;
    const Sr = 5.75;
    const newRadius = Math.hypot(currentToolX, currentToolY);
    
    if (newRadius > Lr+Sr ||newRadius < getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,Lr,Sr)) {
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
    var arm2AngleNew = 180- (beta * (180 / Math.PI));
    
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
function moveArmBy(x,y,z,isRightSide){
    const data = {
      x: ''+x,
      y: ''+y,
      z: ''+z,
      isRightSide: ''+(!isRightSide)
    };
    const params = new URLSearchParams();

    for (const key in data) {
      params.append(key, data[key]);
    }
    fetch('/move', {
      method: 'POST',
      body: params
    })
    .catch(error => {
      console.error('Error:', error);
    });

}
function moveToolToPosition(checkRotation=true) {
    const Lr = 3.8; // arm 1 length
    const Sr = 5.75; // arm 2 length
    let newRadius = Math.hypot(currentToolX, currentToolY);
    
    let gamma = Math.atan2(currentToolY, currentToolX);
    let toBeta = (Lr * Lr + Sr * Sr - currentToolX * currentToolX - currentToolY * currentToolY) / (2 * Lr * Sr);
    let beta = Math.acos(toBeta);
    
    let toAlpha = (currentToolX * currentToolX + currentToolY * currentToolY + Lr * Lr - Sr * Sr) / (2 * Lr * newRadius);
    let alpha = Math.acos(toAlpha);
    
    let angle = gamma + alpha;
    let arm1AngleNew = -(angle * (180 / Math.PI));
    let arm2AngleNew = 180 - (beta * (180 / Math.PI));
    
    if (isNaN(arm1AngleNew)) {
        arm1AngleNew = 0;
    }
    
    if (isNaN(arm2AngleNew)) {
        arm2AngleNew = 0;
    }
    
    let arm1AngleNewCp = arm1AngleNew - arm1Angle; // newAngle - oldAngle
    let arm2AngleNewCp = arm2AngleNew - arm2Angle;
    let arm1AngleNewRound = Math.floor(arm1AngleNewCp);
    let arm2AngleNewRound = Math.floor(arm2AngleNewCp);
    let canRotate = true;
    
    if(checkRotation){
        if (arm1AngleNew > MAX_ARM1_ANGLE || arm1AngleNew < -MAX_ARM1_ANGLE)
            canRotate = false;
        if (arm2AngleNew > MAX_ARM2_ANGLE || arm2AngleNew < -MAX_ARM2_ANGLE)
            canRotate = false;
    }
    let steps = 0; // interpolation steps

    if (canRotate && (arm1AngleNewCp != 0 || arm2AngleNewCp != 0)) {
        const totalSteps = 20; // all interpolation steps
        
        function interpolateStep() {
            if (steps < totalSteps) {
                arm1Angle += arm1AngleNewCp / totalSteps; // update rotation
                rotateArm1(arm1AngleNewCp / totalSteps, rotation1, arm2Angle, rotation2, arm2Movement, panelSize,rightSide);
                updateTextTexture((Math.round(arm1Angle % 360)).toString(), 30, arm1Text, 5, 0, 4.26);
                updateRing(ringMesh1, 0.4, 0.5, rightSide?(arm1Angle % 360):(-arm1Angle % 360));
                if(rightSide)
                    arm2Text.rotation.z += arm1AngleNewCp / totalSteps * Math.PI / 180;
                else
                    arm2Text.rotation.z -= arm1AngleNewCp / totalSteps * Math.PI / 180;
                arm2Angle += arm2AngleNewCp / totalSteps;
                rotateArm2(rotation2, arm2AngleNewCp / totalSteps, arm2Movement,rightSide);
                updateTextTexture((Math.round(arm2Angle % 360)).toString(), 26, arm2Text, arm2Movement, 0, 6.06);
                updateRing(ringMesh2, 0.4, 0.5, rightSide?(arm2Angle % 360):(-arm2Angle % 360));
                if(rightSide)
                    arm2Text.rotation.z += arm2AngleNewCp / totalSteps * Math.PI / 180;
                else
                    arm2Text.rotation.z -= arm2AngleNewCp / totalSteps * Math.PI / 180;
                renderer.render(scene, camera);
                steps++;
                setTimeout(interpolateStep, 15);
            }
        }
        
        interpolateStep();
    }
}
function setToolPosition(vector,isRightSide){
    currentToolX=vector.x;
    currentToolY=-vector.y;
    if(isRightSide){
        currentToolX=vector.y;
        currentToolY=-vector.x;
    }
    
    toolMesh.translateY(vector.z-currentHeight);
    currentHeight=vector.z;
    moveToolToPosition(false);
    positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
}

function updateToolPos(){
    let L1=3.8;
    let L2=5.75;
    
    let a1=-arm1Angle* (Math.PI / 180);
    let a2=-arm2Angle* (Math.PI / 180);
    
    let x = L1 * Math.cos(a1) + L2 * Math.cos(a1 + a2);
    let y = L1 * Math.sin(a1) + L2 * Math.sin(a1 + a2);
    
    currentToolX=x;
    currentToolY=y;
    positionText.textContent="X="+currentToolX.toFixed(2)+" Y="+currentToolY.toFixed(2);
    
}

function selectSTL(){
    if(getCanMoveArm()){
        const meshes = [baseMesh, arm1Mesh, arm2Mesh,toolMesh];

        lastSelectedMesh.children[0].material.color.set(armColor);

        axesHelper1.visible=false;
        axesHelper2.visible=false;

        editMode=false;
        toolEditMode=false;

        var mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
                );

        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0 && intersects[0].object.name.trim()!="") {
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
}
function drawFileOnScene(fileName){
    drawFile(scene,fileName,setToolPosition,panelSize/4,rightSide);
}
window.drawFileOnScene=drawFileOnScene;