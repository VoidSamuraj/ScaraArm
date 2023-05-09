import * as THREE from '/static/three/build/three.module.js'
import { STLLoader } from '/static/three/examples/jsm/loaders/STLLoader.js';
//import { TextBufferGeometry } from '/static/three/examples/jsm/geometries/TextGeometry.js';

var przesuwanie=false;
var isDragging=false;
const panelSize=20;
const lastMouseClicked = new THREE.Vector2();
const stlNames=['blok','ramie1','ramie2','tool'];
const arm2Movement=1.2;
const armColor=0xffa31a;
const selectColor=0xff0000;
const maxHeight=3.4;
const MAX_ARM1_ANGLE=120;
const MAX_ARM2_ANGLE=160;

var currentHeight=0;
var currentToolX=0;
var currentToolY=9.55;

var baseMesh=new THREE.Object3D();
var arm1Mesh=new THREE.Object3D();
var arm2Mesh=new THREE.Object3D();
var toolMesh=new THREE.Object3D();
var lastSelectedMesh;

const axesHelper = new THREE.AxesHelper(3);
const axesHelper2 = new THREE.AxesHelper(3);

var arm1Pos= new THREE.Vector2();
var arm2Pos= new THREE.Vector2();

var editMode=false;
var toolEditMode=false;

var arm1Angle=0;
var arm2Angle=0;

const rotation1 = new THREE.Group();
const rotation2 = new THREE.Group();

const raycaster = new THREE.Raycaster();

const canvas= document.getElementById('myCanvas');
const canvasHelper= document.getElementById('pivot');

// Inicjalizacja sceny
const scene = new THREE.Scene();
const sceneHelper = new THREE.Scene();

const loader = new STLLoader();

const textGeometry1 = new THREE.PlaneGeometry(0.5, 0.5);
const textGeometry2 = new THREE.PlaneGeometry(0.5, 0.5);
const textMaterial1 = new THREE.MeshBasicMaterial({ transparent: true });
const textMaterial2 = new THREE.MeshBasicMaterial({ transparent: true });

// Stwórz Mesh z użyciem geometrii tekstu i materiału tekstu
const arm1Text = new THREE.Mesh(textGeometry1, textMaterial1);
scene.add(arm1Text);
const arm2Text = new THREE.Mesh(textGeometry2, textMaterial2);
scene.add(arm2Text);

const circleMesh1= createCircle(5,0,4.26,0.4);

const circleMesh2= createCircle(arm2Movement,0,6.06,0.4);

var ringMesh1= createRing(5,0,4.26,0.4,0.5,0);
ringMesh1.rotateX(Math.PI);

var ringMesh2= createRing(arm2Movement,0,6.06,0.4,0.5,0);


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

const cameraCanvasHelper = new THREE.PerspectiveCamera(75, canvasHelper.width / canvasHelper.height, 0.01, 1000);

const pivotPointHelper = new THREE.Object3D();

function setupCanvasHelper(){

    cameraCanvasHelper.updateProjectionMatrix();

    const geoR = new THREE.CapsuleGeometry( 0.02, 0.8, 4, 8 );
    const geoG = new THREE.CapsuleGeometry( 0.02, 0.8, 4, 8 );
    const geoB = new THREE.CapsuleGeometry( 0.02, 0.8, 4, 8 );

    const red = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    const green = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    const blue = new THREE.MeshBasicMaterial( {color: 0x0000ff} );

    const redC = new THREE.Mesh( geoR, red );
    const greenC = new THREE.Mesh( geoG, green );
    const blueC = new THREE.Mesh( geoB, blue );

    redC.rotateX(Math.PI/2);
    redC.rotateY(Math.PI/2);
    redC.position.set(0,0,-0.41);

    greenC.rotateY(Math.PI/2);
    greenC.rotateX(Math.PI/2);
    greenC.position.set(-0.41,0,0);

    blueC.position.set(0,0.41,0);
    sceneHelper.add(redC);
    sceneHelper.add(greenC);
    sceneHelper.add(blueC);

    cameraCanvasHelper.position.set(0, 0, 2);
    sceneHelper.add(cameraCanvasHelper);
    pivotPointHelper.add(cameraCanvasHelper);
    sceneHelper.add(pivotPointHelper);
}

function createCircle(x,y,z,size){
var circleMesh = new THREE.Mesh(new THREE.CircleGeometry(size, 30), new THREE.MeshBasicMaterial({ color: 0x454545 }));
circleMesh.rotateX(-Math.PI/2);
circleMesh.position.set(x, z, y);
scene.add(circleMesh);
return circleMesh;
}

function createRing(x,y,z,min,max,degree){
var ringMesh = new THREE.Mesh(new THREE.RingGeometry(min, max, 30, 1, 0, degree * Math.PI / 180), new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide }));
ringMesh.rotateX(-Math.PI/2);
ringMesh.rotateZ(-Math.PI);
ringMesh.position.set(x, z, y);
scene.add(ringMesh);
return ringMesh;
}

function updateRing(ringMesh,min,max,degree){
    ringMesh.geometry.dispose();
    ringMesh.geometry = new THREE.RingGeometry(min, max, 30, 1, 0, degree * Math.PI / 180)
    ringMesh.material = new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide })
}

function updateTextTexture(text, size, mesh,x,y,z) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  var fontSize=size;
  if(text.length==3)
    fontSize=parseInt(fontSize*2/3);
  else if(text.length==1)
    fontSize=parseInt(fontSize*3/2);

  ctx.font = fontSize + 'px Arial';
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth;
  canvas.height = fontSize;

  ctx.font = fontSize + 'px Arial';
  ctx.fillStyle = "#bfbfbf";
  ctx.fillText(text, 0, fontSize);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const halfWidth = textWidth / 2;

  mesh.position.set(x,z+0.01,y/*-0.1*/);
  mesh.material.map = texture;
}


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

addLight();
addGrid();

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
loadSTL(stlNames[0],mesh => { baseMesh.add(mesh); });
loadSTL(stlNames[1],mesh => { arm1Mesh.add(mesh); });
loadSTL(stlNames[2],mesh => { arm2Mesh.add(mesh); });
loadSTL(stlNames[3],mesh => { toolMesh.add(mesh);lastSelectedMesh=toolMesh; });

rotation2.add(arm2Mesh);
rotation2.add(toolMesh);
rotation2.add(arm2Text);
rotation2.add(circleMesh2);
rotation2.add(ringMesh2);

rotation1.add(arm1Mesh);
rotation1.add(rotation2);

setupHelpers();

function setupHelpers(){

    setupCanvasHelper();

    axesHelper.rotateX(-Math.PI/2);
    axesHelper.rotateZ(Math.PI/2);
    axesHelper.translateY(-panelSize/4);
    axesHelper.translateZ(4.3);

    axesHelper2.rotateX(-Math.PI/2);
    axesHelper2.rotateZ(Math.PI/2);
    axesHelper2.translateY(-arm2Movement);
    axesHelper2.translateZ(6.1);

    axesHelper.visible=false;
    axesHelper2.visible=false;

    rotation1.add(axesHelper);
    rotation2.add(axesHelper2);
}

scene.add(rotation1);
scene.add(rotation2);
scene.add(baseMesh);

drawLines();

function rotateArm1(angle){

    rotateArm2(-arm2Angle);
    rotation1.translateX(panelSize/4);
    rotation2.translateX(panelSize/4);
    const stopnie=-angle * Math.PI / 180;
    rotation1.rotateY(stopnie);
    rotation2.rotateY(stopnie);

    rotation1.translateX(-panelSize/4);
    rotation2.translateX(-panelSize/4);
    rotateArm2(arm2Angle);
}

function rotateArm2(angle){
    rotation2.translateX(arm2Movement);

    const stopnie=-angle * Math.PI / 180;
    rotation2.rotateY(stopnie);

    rotation2.translateX(-arm2Movement);
}



// Światło
function addLight(){
    const light1 = new THREE.PointLight(0xffffff, 1, 1000);
    light1.position.set(panelSize/2, 50, panelSize/2);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 1, 1000);
    light2.position.set(panelSize/2, 50, -panelSize/2);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xffffff, 1, 1000);
    light3.position.set(-panelSize/2, 50, -panelSize/2);
    scene.add(light3);

    const light4 = new THREE.PointLight(0xffffff, 1, 1000);
    light4.position.set(-panelSize/2, 50, panelSize/2);
    scene.add(light4);
}

// Siatka

function addGrid(){
    const grid = new THREE.GridHelper(panelSize, panelSize, 0xffffff, 0xffffff);
    grid.position.set(0, -1, 0);
    scene.add(grid);

    //panel pod siatką
    const backgroundPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(panelSize, panelSize),
      new THREE.MeshBasicMaterial({ color: 0x454545, side: THREE.DoubleSide})
    );
    backgroundPlane.position.set(0, -1.01, 0);
    backgroundPlane.rotation.x=90 * Math.PI / 180;
    scene.add(backgroundPlane);
}


function loadSTL(nazwa,callback){

    loader.load(`/static/stl/${nazwa}.stl`, (geometry) => {

          const shadowMaterial = new THREE.MeshStandardMaterial({
                                       color: armColor,
                                       roughness: 0.8, // zmniejszenie roughness
                                       lightMapIntensity: 0.8, // zwiększenie lightMapIntensity
                                     });

          shadowMaterial.castShadow = true;


          // mesh z geometry
          const mesh = new THREE.Mesh(geometry, shadowMaterial);
          mesh.position.set(panelSize/4, -1, 0)
          mesh.receiveShadow = true;

          mesh.rotation.x=-90 * Math.PI / 180;

          mesh.name=nazwa;
          callback(mesh);

    });
}


function drawLines(){
    const redGeometry = new THREE.BufferGeometry();
    const greenGeometry = new THREE.BufferGeometry();

    const greenArray = new Float32Array([
      panelSize/4, -1, 0,
      -panelSize/2, -1, 0,
    ]);
    const redArray = new Float32Array([
       panelSize/4, -1, -panelSize/2,
       panelSize/4, -1, panelSize/2,
    ]);

    redGeometry.setAttribute('position', new THREE.BufferAttribute(redArray, 3));
    greenGeometry.setAttribute('position', new THREE.BufferAttribute(greenArray, 3));


    const redMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000
    });
    const greenMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00
    });
    const redLine = new THREE.Line(redGeometry, redMaterial);
    const greenLine = new THREE.Line(greenGeometry, greenMaterial);
    scene.add(redLine);
    scene.add(greenLine);


}

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

function move(){
    document.addEventListener('keydown', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=true;
        }if(toolEditMode){
            if(event.code === 'ArrowUp'||event.code === 'Numpad8'){
                currentToolY-=0.05;
                updateToolPos();
            }else if(event.code === 'ArrowDown'||event.code === 'Numpad2'){
                currentToolY+=0.05;
                updateToolPos();
            }else if(event.code === 'ArrowLeft'||event.code === 'Numpad4'){
                currentToolX-=0.05;
                updateToolPos();
            }else if(event.code === 'ArrowRight'||event.code === 'Numpad6'){
                currentToolX+=0.05;
                updateToolPos();
            }
        }
    });
    document.addEventListener('keyup', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=false;
        }/*else if(event.code === 'ArrowUp'||event.code === 'Numpad8'){

        }else if(event.code === 'ArrowDown'||event.code === 'Numpad2'){

        }else if(event.code === 'ArrowLeft'||event.code === 'Numpad4'){

        }else if(event.code === 'ArrowRight'||event.code === 'Numpad6'){

        }*/

    });
}

function selectSTL(){
      // check if clicked on object
      raycaster.setFromCamera(lastMouseClicked, camera);
      const meshes = [baseMesh, arm1Mesh, arm2Mesh,toolMesh];

      const intersects = raycaster.intersectObjects(meshes);

      lastSelectedMesh.children[0].material.color.set(armColor);

      axesHelper.visible=false;
      axesHelper2.visible=false;

      editMode=false;
      toolEditMode=false;

      if (intersects.length > 0) {
            //closest object
            const object = intersects[0].object;
            editMode=true;
            switch(object.name){
                case stlNames[0]:
                    lastSelectedMesh=meshes[0];
                    break;
                case stlNames[1]:
                     lastSelectedMesh=meshes[1];
                       axesHelper.visible=true;
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

function updateToolPos(){
    // Wyznacz położenie i orientację narzędzia
    const arm1Length=3.8;
    const arm2Length=5.75;

    // Wykorzystaj trygonometrię, aby wyznaczyć kąty
    const newArm2Angle = Math.atan2(currentToolY - 0,  - panelSize/4) - Math.atan2(arm2Length, arm1Length);
    const newArm1Angle = Math.atan2(currentToolY - 0, currentToolX - panelSize/4) - Math.atan2(arm2Length * Math.sin(newArm2Angle), arm1Length);

    console.log( "BEF");
    console.log( newArm1Angle);
    console.log( newArm2Angle);
    console.log( "NOW");
    console.log( rotation1.rotation.y);
    console.log( rotation2.rotation.y);
    arm1Angle=(newArm1Angle+rotation1.rotation.y) *180/Math.PI;
    arm2Angle=(newArm2Angle+rotation2.rotation.y)*180/Math.PI;
    rotateArm1(arm1Angle);
    rotateArm2(arm2Angle);


    // Ustaw wartości kątów dla przegubów
   // arm1.rotation.z = arm1Angle;
//    arm2.rotation.z = arm2Angle;




    // Zaktualizuj rotacje elementów
//    rotation1.rotation.z = -Math.PI / 2;
  //  rotation2.rotation.z = -Math.PI / 2;


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
                    rotateArm1(zoomChange);
                    updateTextTexture((arm1Angle%360).toString(),30,arm1Text,5,0,4.26);
                    updateRing(ringMesh1,0.4,0.5,arm1Angle%360);
                    arm2Text.rotation.z += zoomChange * Math.PI / 180;

                }
                break;
            case stlNames[2]:
                if((arm2Angle+zoomChange)>=-MAX_ARM2_ANGLE&&(arm2Angle+zoomChange)<=MAX_ARM2_ANGLE){
                    arm2Angle+=zoomChange;
                    rotateArm2(zoomChange);
                    updateTextTexture((arm2Angle%360).toString(),26,arm2Text,arm2Movement,0,6.06);
                    updateRing(ringMesh2,0.4,0.5,arm2Angle%360);

                    arm2Text.rotation.z += zoomChange * Math.PI / 180;
                }
                break;
            case stlNames[3]:
                if((zoomChange>0&&currentHeight<maxHeight)||(zoomChange<0&&currentHeight>0)){
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
