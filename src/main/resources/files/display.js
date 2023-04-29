//import * as THREE from '/static/node_modules/three/build/three.min.js';
import * as THREE from '/static/three/build/three.module.js'


const canvas= document.getElementById('myCanvas')

document.getElementById('manual').addEventListener('click', function() {
             menu.style.left = '-250px';
 });


// Inicjalizacja sceny
const scene = new THREE.Scene();

// Kamera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 0, 5);

// Punkt obrotu
const pivotPoint = new THREE.Object3D();
pivotPoint.add(camera);
scene.add(pivotPoint);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize( window.innerWidth, window.innerHeight );
//document.body.appendChild( renderer.domElement );



// Światło
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 0, 0);
scene.add(light);

// Siatka
const grid = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
grid.position.set(0, -1, 0);
scene.add(grid);

// Rysowanie sceny
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

//obrot
rotateCamera(pivotPoint, canvas);

function rotateCamera(pivotPoint, canvas) {
  const mouse = new THREE.Vector2();
  const previousMousePosition = new THREE.Vector2();

  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();

    previousMousePosition.set(event.clientX, event.clientY);

    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mouseup', mouseup);
  });

  function mousemove(event) {
    mouse.set(
      (event.clientX / canvas.clientWidth) * 2 - 1,
      -(event.clientY / canvas.clientHeight) * 2 + 1
    );

    const delta = new THREE.Vector2().subVectors(mouse, previousMousePosition);

    const sensitivity = 0.005;
    pivotPoint.rotation.y -= delta.x * sensitivity* sensitivity;
    pivotPoint.rotation.x -= delta.y * sensitivity* sensitivity;

    previousMousePosition.set(event.clientX, event.clientY);
  }

  function mouseup() {
    canvas.removeEventListener('mousemove', mousemove);
    canvas.removeEventListener('mouseup', mouseup);
  }
}