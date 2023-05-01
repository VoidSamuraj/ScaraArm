import * as THREE from '/static/three/build/three.module.js'
import { STLLoader } from '/static/three/examples/jsm/loaders/STLLoader.js';

var przesuwanie=false;
var isDragging=false;
const panelSize=20;
const lastMouseClicked = new THREE.Vector2();
var baseMesh=new THREE.Object3D();
var arm1Mesh=new THREE.Object3D();
var arm2Mesh=new THREE.Object3D();
var toolMesh=new THREE.Object3D();

const rotation1 = new THREE.Group();
const rotation2 = new THREE.Group();

const raycaster = new THREE.Raycaster();

const canvas= document.getElementById('myCanvas')

document.getElementById('manual').addEventListener('click', function() {
             menu.style.left = '-250px';
 });


THREE.Group.prototype.rotateAroundAxis = function(axis, radians) {
    let rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(this.matrix);
    this.matrix = rotWorldMatrix;
    this.rotation.setFromRotationMatrix(this.matrix);
};
// Inicjalizacja sceny
const scene = new THREE.Scene();

const loader = new STLLoader();

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
camera.position.set(0, 0, 20);
//camera.inverted = true;

// Punkt obrotu
const pivotPoint = new THREE.Object3D();
pivotPoint.add(camera);
scene.add(pivotPoint);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x1b1b1b);

addLight();
addGrid();
// Rysowanie sceny
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

//obrot
rotateCamera(pivotPoint, canvas);
//przesuwanie
move();
zoomCamera(camera,canvas);


//stl
loadSTL('blok',mesh => { baseMesh.add(mesh); });
loadSTL('ramie1',mesh => { arm1Mesh.add(mesh); });
loadSTL('ramie2',mesh => { arm2Mesh.add(mesh); });
loadSTL('lapa',mesh => { toolMesh.add(mesh); });

//rotation2.add(arm2Mesh);
//rotation2.add(toolMesh);

rotation1.add(arm1Mesh);
rotation1.add(arm2Mesh);
rotation1.add(toolMesh);

//rotation1.add(rotation2);




//rotation1.pivot = new THREE.Vector3(  0,0,panelSize/4*100);
//rotation1.position.set( panelSize/4,0,0 );

scene.add(rotation1);
scene.add(rotation2);
scene.add(baseMesh);

//const axis = new THREE.Vector3( 0, 1, 0 );

//rotation1.rotateAroundAxis( axis, 90 * Math.PI / 180 );
//rotation1.position.set(0, panelSize/4, 0);
//rotation1.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
/*
const axis = new THREE.Vector3(2, 0, 5).normalize();
const angle = Math.PI / 2; // 90 stopni w radianach

rotation1.rotateOnWorldAxis(axis, angle);
*/

rotation1.translateX(panelSize/4);
rotation1.translateY(0);
rotation1.translateZ(0);

const axis = new THREE.Vector3(0, 1, 0);
rotation1.rotateOnAxis(axis, -Math.PI / 2);

rotation1.translateX(-panelSize/4);
rotation1.translateY(0);
rotation1.translateZ(0);


/*
const pp = new THREE.Vector3(-panelSize/4, 0,0); // przesunięcie
rotation1.position.set(pp.x, pp.y, pp.z); // obrót jest cały czas wokół 0,0,0
rotation1.rotateY(Math.PI / 2);
const pp2 = new THREE.Vector3(0, 0,0); // przesunięcie
*/
//rotation1.position.set(pp2.x, pp2.y, pp2.z); // obrót jest cały czas wokół 0,0,0

drawLines();


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
                                       color: 0xffa31a,
                                       roughness: 0.8, // zmniejszenie roughness
                                       lightMapIntensity: 1, // zwiększenie lightMapIntensity
                                     });

          shadowMaterial.castShadow = true;


          // mesh z geometry
          const mesh = new THREE.Mesh(geometry, shadowMaterial);
          mesh.position.set(panelSize/4, -1, 0)
          mesh.receiveShadow = true;

          mesh.rotation.x=-90 * Math.PI / 180;

          callback(mesh);

    });
}


function drawLines(){
    const redGeometry = new THREE.BufferGeometry();
    const greenGeometry = new THREE.BufferGeometry();

    const redArray = new Float32Array([
      panelSize/4, -1, 0,
      -panelSize/2, -1, 0,
    ]);
    const greenArray = new Float32Array([
       panelSize/4, -1, -panelSize/2,
       panelSize/4, -1, panelSize/2,
    ]);
    /*
    const blueArray = new Float32Array([
          panelSize/4, -1, 0,
          -panelSize/2, -1, 0,
    ]);
    */
    redGeometry.setAttribute('position', new THREE.BufferAttribute(redArray, 3));
    greenGeometry.setAttribute('position', new THREE.BufferAttribute(greenArray, 3));


    const redMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2
    });
    const greenMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2
    });
    const redLine = new THREE.Line(redGeometry, redMaterial);
    const greenLine = new THREE.Line(greenGeometry, greenMaterial);
    scene.add(redLine);
    scene.add(greenLine);


}

function rotateCamera(pivotPoint, canvas) {
    const previousMousePosition = new THREE.Vector2();


    canvas.addEventListener('mousedown', (event) => {
        //zablokuj normalną obsługę
        event.preventDefault();
        isDragging=false;
        lastMouseClicked.x = (event.clientX / window.innerWidth) * 2 - 1;
        lastMouseClicked.y = -(event.clientY / window.innerHeight) * 2 + 1;

         if (event.button === 1) {
             if(przesuwanie){
                 //zapisz współrzędne po naciśnięciu
                 previousMousePosition.set(event.clientX, event.clientY);

                 canvas.addEventListener('mousemove', mousemoveMovement);
                 canvas.addEventListener('mouseup', mouseupMovement);
            }else{
                //zapisz współrzędne po naciśnięciu
                previousMousePosition.set(event.clientX, event.clientY);

                canvas.addEventListener('mousemove', mousemoveRotation);
                canvas.addEventListener('mouseup', mouseupRotation);
            }
        }else if(event.button === 0){
               canvas.addEventListener('mousemove', STLMoveEvent);
               canvas.addEventListener('mouseup', STLUpEvent);
        }

    });

    function mousemoveRotation(event) {
        const sensitivity = 0.005;
        pivotPoint.rotation.y -= (event.clientX-previousMousePosition.x) * sensitivity;
        pivotPoint.rotation.x -= (event.clientY-previousMousePosition.y) * sensitivity;
        previousMousePosition.set(event.clientX, event.clientY);
    }
    function mousemoveMovement(event) {
        const sensitivity = 0.005;
        pivotPoint.translateX((event.clientX-previousMousePosition.x) * sensitivity);
        pivotPoint.translateY((previousMousePosition.y-event.clientY) * sensitivity);
        previousMousePosition.set(event.clientX, event.clientY);
    }
    function STLMoveEvent(event) {isDragging=true;}

    function mouseupRotation() {
        canvas.removeEventListener('mousemove', mousemoveRotation);
        canvas.removeEventListener('mouseup', mouseupRotation);
    }
    function mouseupMovement() {
            canvas.removeEventListener('mousemove', mousemoveMovement);
            canvas.removeEventListener('mouseup', mousemoveMovement);
    }
    function STLUpEvent(event) {
        if(!isDragging)
            selectSTL();
        isDragging=false;
    }

}

function move(){
    document.addEventListener('keydown', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=true;
        }
    });
    document.addEventListener('keyup', (event) => {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            przesuwanie=false;
        }
    });
}
function selectSTL(){
        console.log('wlazl selectSTL!');
      // Utwórz Raycaster, który sprawdzi, czy kliknięcie myszą przecina jakiś obiekt
      raycaster.setFromCamera(lastMouseClicked, camera);

       const meshes = [baseMesh, arm1Mesh, arm2Mesh,toolMesh];

      // Sprawdź, czy Raycaster przecina obiekt STL
      const intersects = raycaster.intersectObjects(meshes);

      // Jeśli tak, wykonaj odpowiednie akcje
      if (intersects.length > 0) {
           // Kliknięto na obiekt STL
            console.log('Kliknięto na obiekt STL!');
      }
}


function zoomCamera(camera, canvas) {
  let zoomLevel = 100;
  camera.zoom = zoomLevel;
  camera.updateProjectionMatrix();

  canvas.addEventListener('wheel', (event) => {
    // zapobiegaj domyślnej akcji
    event.preventDefault();

    // zwiększanie przybliżenia lub oddalanie w zależności od kierunku przewijania
    const zoomChange = event.deltaY > 0 ? 5 : -5; //0.1
    zoomLevel += zoomChange;

    // ograniczenie zakresu przybliżenia
    zoomLevel = Math.max(zoomLevel, 50.0);
    zoomLevel = Math.min(zoomLevel, 250.0);

    // zmiana wartości przybliżenia kamery
    camera.zoom = zoomLevel;

    // odświeżenie kamery
    camera.updateProjectionMatrix();
  });
}
