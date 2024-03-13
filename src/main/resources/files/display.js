import * as THREE from "/static/three/build/three.module.js";
import { loadSTL, changeSTLColor } from "/static/stl.js";
import {
  getRectangle,
  updateRectanglePercent,
  createCircle,
  createRing,
  updateRing,
  addGrid,
  addLight,
  drawCartesianLines,
  updateTextTexture,
  drawArmRange,
  getMinDistance,
  drawFile,
  restoreDrawing
} from "/static/elements.js";
import {
  setupCanvasHelper,
  getRotationHelperGroup,
} from "/static/sceneHelper.js";
import { showDialog } from "/static/helpers.js";
import { rotateArm1, rotateArm2 } from "/static/movement.js";
import { OrbitControls } from "/static/three/examples/jsm/controls/OrbitControls.js";
import {
  getCanMoveArm,
  setupOptionMenu,
  getMovePrecision,
  getRotationPrecision,
  refreshPorts,
  demoMode,
} from "/static/navigation.js";

// main file to display and manage elements of arm and related UI

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              parameters of arm and UI
//////////////////////////////////////////////////////////////////////////////////////////////////

const panelSize = 20;
const armShift = panelSize / 4;
const stlNames = [
  "blok",
  "arm1p1",
  "arm1p2",
  "arm2p1",
  "arm2p2",
  "toolmain",
  "toolextension",
];

//scale of the base plate and grid under arm, this scale dimensions
const scaleOfPlateSize = 1.5;
//scale of base plate divisions
const scaleOfGridDivisions = 10;
//it is divided by 5, because of different metrics used
const defaultArmLength = 4;
const defaultToolDistance = 0.8;
const maxHeight = 2.1;
const minHeight = -0.01;
const MAX_ARM1_ANGLE = 135;
const MAX_ARM2_ANGLE = 145;
//max angle of one side to prevent tool collision with arm base
const MAX_ARM1_ANGLE_COLLISION = 35;
const armColor = 0xffa31a;
const rotationTextHeight = 7.53;
const heightTextHeight = 4.75;
const selectColor = 0xff2222;
//scale units to arm size
const scaleDisplayDivider = 5;

var arm1Length = parseFloat(
  localStorage.getItem("arm1Length") / scaleDisplayDivider || defaultArmLength
);
var arm2Length = parseFloat(
  localStorage.getItem("arm2Length") / scaleDisplayDivider ||
    defaultArmLength - defaultToolDistance
);
var toolDistanceToArm = parseFloat(
  localStorage.getItem("toolDistanceToArm") / scaleDisplayDivider ||
    defaultToolDistance
);
setupOptionMenu(changeArmDimens);
var arm1Angle = 0;
var arm2Angle = 0;

var arm2TotalLength = arm2Length + toolDistanceToArm;
var additionalToolLength = toolDistanceToArm - defaultToolDistance;
var additionalArm1Length = arm1Length - defaultArmLength;
var additionalArm2Length = arm2Length - defaultArmLength;
var arm2RotationShift = 1 - additionalArm1Length;

var editMode = false;
var toolEditMode = false;
var isArmDrawing = false;

var rightSide = localStorage.getItem("rightSide"); //direction of arm(movement area)
if (rightSide === null) rightSide = false;
else rightSide = JSON.parse(rightSide);

var currentHeight = minHeight;
var currentToolX = arm1Length + arm2TotalLength;
var currentToolY = 0;

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              Objects on scene
//////////////////////////////////////////////////////////////////////////////////////////////////

const baseMesh = new THREE.Object3D();
const arm1Mesh = new THREE.Object3D();
const arm2Mesh = new THREE.Object3D();
const toolMesh = new THREE.Object3D();

const rotation1 = new THREE.Group();
const rotation2 = new THREE.Group();

const canvas = document.getElementById("myCanvas");
const canvasHelper = document.getElementById("pivot");
const positionText = document.getElementById("positionText");
updatePositionText();

const scene = new THREE.Scene();
const sceneHelper = new THREE.Scene();

const textCircleSize = 0.5;
const textGeometry1 = new THREE.PlaneGeometry(textCircleSize, textCircleSize);
const textGeometry2 = new THREE.PlaneGeometry(textCircleSize, textCircleSize);
const textHeightGeometry = new THREE.PlaneGeometry(
  textCircleSize,
  textCircleSize
);
const textMaterial1 = new THREE.MeshBasicMaterial({ transparent: true });
const textMaterial2 = new THREE.MeshBasicMaterial({ transparent: true });
const textHeightMaterial = new THREE.MeshBasicMaterial({ transparent: true });
const circleMesh1 = createCircle(
  scene,
  5,
  0,
  rotationTextHeight,
  textCircleSize - 0.005
);
const circleMesh2 = createCircle(
  scene,
  arm2RotationShift,
  0,
  rotationTextHeight,
  textCircleSize - 0.005
);

const arm1Text = new THREE.Mesh(textGeometry1, textMaterial1);
const arm2Text = new THREE.Mesh(textGeometry2, textMaterial2);
const heightText = new THREE.Mesh(textHeightGeometry, textHeightMaterial);
const heightRect = getRectangle(
  1.7,
  1.6,
  -3.5 + (defaultArmLength * 2 - arm1Length - arm2Length),
  0,
  heightTextHeight
);

var ringMesh1 = createRing(
  scene,
  5,
  0,
  rotationTextHeight + 0.001,
  0.4,
  textCircleSize,
  0
);
ringMesh1.rotateX(Math.PI);
var ringMesh2 = createRing(
  scene,
  arm2RotationShift,
  0,
  rotationTextHeight + 0.001,
  0.4,
  textCircleSize,
  0
);
var lastSelectedMesh;

scene.add(arm1Text);
scene.add(arm2Text);
scene.add(heightText);
scene.add(heightRect);
rotation2.add(heightText);
rotation2.add(heightRect);

arm1Text.rotateX(-Math.PI / 2);
arm2Text.rotateX(-Math.PI / 2);
heightText.rotateY(-Math.PI / 2);

updateTextTexture("0", 30, arm1Text, 5, 0, rotationTextHeight);
updateTextTexture("0", 30, arm2Text, arm2RotationShift, 0, rotationTextHeight);
updateTextTexture(
  "0",
  40,
  heightText,
  -3.501 + (defaultArmLength * 2 - arm1Length - arm2Length),
  0,
  heightTextHeight
);

//bar displaying percentage currentHeight relative to maxHeight-minHeight
var rectanglePercent = updateRectanglePercent(
  scene, //scene
  rotation2, //parentGroup
  null, //oldRectanglePercentGroup
  1.96, //width
  1.6, //height
  0.28, //barWidth
  0, //percentage
  -3.38 + (defaultArmLength * 2 - arm1Length - arm2Length), //x
  0, //y
  heightTextHeight //z
);

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              Camera
//////////////////////////////////////////////////////////////////////////////////////////////////

const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.OrthographicCamera(
  width / -2, // left end
  width / 2, // right end
  height / 2, // top end
  height / -2, // bottom end
  1, // close plan
  1000 // far plan
);
camera.position.set(0, 5, 20);

const pivotPointHelper = new THREE.Object3D();
const cameraCanvasHelper = new THREE.PerspectiveCamera(
  75,
  canvasHelper.width / canvasHelper.height,
  0.01,
  1000
);

// Point of camera rotation
const pivotPoint = new THREE.Object3D();
pivotPoint.add(camera);
scene.add(pivotPoint);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1b1b1b);

const rendererHelper = new THREE.WebGLRenderer({
  canvas: canvasHelper,
  antialias: true,
});
rendererHelper.setSize(canvasHelper.width, canvasHelper.height);
rendererHelper.setClearColor(0x1b1b1b, 0);
let zoomLevel = 80;
camera.zoom = zoomLevel;
camera.updateProjectionMatrix();
cameraCanvasHelper.zoom = zoomLevel / 2;
rendererHelper.render(sceneHelper, cameraCanvasHelper);

var controls = new OrbitControls(camera, renderer.domElement);
var controlsHelper = new OrbitControls(
  cameraCanvasHelper,
  rendererHelper.domElement
);

//rotation and position for helper
var previousRotation = null;
var previousPosition = null;
//store info about last position of helper
var toUndo = new THREE.Vector3();
var temp = new THREE.Vector3();

controls.addEventListener("change", updateHelper);

animate();

// if device is not mobile, define click, keyboard and wheel event
if (
  !/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
) {
  renderer.domElement.addEventListener("click", selectSTL);
  setupMoveListener();
  renderer.domElement.addEventListener(
    "wheel",
    function (event) {
      if (editMode && getCanMoveArm() && !isArmDrawing) {
        controls.enableZoom = false;
        var zoomChange = event.deltaY > 0 ? 1 : -1;
        let reacted = false;
        lastSelectedMesh.traverse((children) => {
          if (!reacted)
            switch (children.name) {
              //arm 1
              case stlNames[1]:
              case stlNames[2]:
              case "cubeArmExtension1p1":
              case "cubeArmExtension1p2":
                if (
                  isAngleBetween(
                    MAX_ARM1_ANGLE,
                    MAX_ARM1_ANGLE_COLLISION,
                    arm1Angle + zoomChange * getRotationPrecision(),
                    rightSide
                  )
                ) {
                  zoomChange *= getRotationPrecision();
                  arm1Angle += zoomChange;
                  rotateArm1(
                    zoomChange,
                    rotation1,
                    arm2Angle,
                    rotation2,
                    arm2RotationShift,
                    armShift,
                    rightSide
                  );
                  updateTextTexture(
                    Math.round(arm1Angle % 360).toString(),
                    30,
                    arm1Text,
                    5,
                    0,
                    rotationTextHeight
                  );
                  updateRing(
                    ringMesh1,
                    0.4,
                    0.5,
                    rightSide ? arm1Angle % 360 : -arm1Angle % 360
                  );
                  if (rightSide)
                    arm2Text.rotation.z += (zoomChange * Math.PI) / 180;
                  else arm2Text.rotation.z -= (zoomChange * Math.PI) / 180;
                  if (!demoMode)
                    moveArmByAngle(rightSide ? zoomChange : -zoomChange, null);
                  updateToolPos();
                  reacted = true;
                }
                break;
              //arm 2
              case stlNames[3]:
              case stlNames[4]:
              case "cubeArmExtension2":
                if (
                  isAngleBetween(
                    MAX_ARM2_ANGLE,
                    null,
                    arm2Angle + zoomChange * getRotationPrecision(),
                    rightSide
                  )
                ) {
                  zoomChange *= getRotationPrecision();
                  arm2Angle += zoomChange;
                  rotateArm2(
                    rotation2,
                    zoomChange,
                    arm2RotationShift,
                    rightSide
                  );
                  updateTextTexture(
                    Math.round(arm2Angle % 360).toString(),
                    30,
                    arm2Text,
                    arm2RotationShift,
                    0,
                    rotationTextHeight
                  );
                  updateRing(
                    ringMesh2,
                    0.4,
                    0.5,
                    rightSide ? arm2Angle % 360 : -arm2Angle % 360
                  );
                  if (rightSide)
                    arm2Text.rotation.z += (zoomChange * Math.PI) / 180;
                  else arm2Text.rotation.z -= (zoomChange * Math.PI) / 180;
                  if (!demoMode)
                    moveArmByAngle(null, rightSide ? zoomChange : -zoomChange);
                  updateToolPos();
                  reacted = true;
                }
                break;
              //tool
              case stlNames[5]:
              case stlNames[6]:
              case "cubeToolExtension1":
              case "cubeToolExtension2":
                let scale = getMovePrecision() / scaleDisplayDivider;
                let lastHeight = currentHeight;
                if (
                  (zoomChange > 0 &&
                    currentHeight + zoomChange * scale < maxHeight) ||
                  (zoomChange < 0 &&
                    currentHeight + zoomChange * scale > minHeight)
                ) {
                  currentHeight += zoomChange * scale;
                } else if (
                  zoomChange > 0 &&
                  currentHeight + zoomChange * scale > maxHeight
                )
                  currentHeight = maxHeight;
                else if (
                  zoomChange < 0 &&
                  currentHeight + zoomChange * scale < minHeight
                )
                  currentHeight = minHeight;
                if (currentHeight != lastHeight) {
                  let percent = Math.round(
                    ((currentHeight - minHeight) / (maxHeight - minHeight)) *
                      100
                  );
                  rectanglePercent = updateRectanglePercent(
                    scene, //scene
                    rotation2, //parentGroup
                    rectanglePercent, //oldRectanglePercentGroup
                    1.96, //width
                    1.6, //height
                    0.28, //barWidth
                    percent, //percentage
                    -3.38 + (defaultArmLength * 2 - arm1Length - arm2Length), //x
                    0, //y
                    heightTextHeight //z
                  );
                  updateTextTexture(
                    ((currentHeight - minHeight) * scaleDisplayDivider)
                      .toFixed(2)
                      .toString(),
                    40,
                    heightText,
                    -3.501 + (defaultArmLength * 2 - arm1Length - arm2Length),
                    0,
                    heightTextHeight
                  );
                  if (!demoMode)
                    moveArmBy(
                      null,
                      null,
                      currentHeight - lastHeight,
                      rightSide
                    );
                  toolMesh.translateY(currentHeight - lastHeight);
                }
                reacted = true;
                break;
            }
        });
      } else {
        controls.enableZoom = true;
        changeSTLColor(lastSelectedMesh, armColor);
      }
    },
    { passive: false }
  );
}

addLight(scene, panelSize);
addGrid(
  scene,
  panelSize * scaleOfPlateSize,
  0,
  0,
  -1,
  panelSize * scaleOfGridDivisions * scaleOfPlateSize * scaleDisplayDivider
);

var armRange = drawArmRange(
  panelSize * 2,
  armShift,
  arm1Length,
  arm2TotalLength,
  MAX_ARM1_ANGLE,
  MAX_ARM2_ANGLE,
  MAX_ARM1_ANGLE_COLLISION,
  !rightSide
);
scene.add(armRange);

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              STL
//////////////////////////////////////////////////////////////////////////////////////////////////
loadSTL(stlNames[0], armShift, 0, 5.1, (mesh) => {
  mesh.name = stlNames[0];
  baseMesh.add(mesh);
});
loadSTL(stlNames[1], armShift, 0, 5.1, (mesh) => {
  mesh.name = stlNames[1];
  arm1Mesh.add(mesh);
});
loadSTL(stlNames[2], armShift - additionalArm1Length, 0, 5.1, (mesh) => {
  mesh.name = stlNames[2];
  arm1Mesh.add(mesh);
});
loadSTL(stlNames[3], armShift - additionalArm1Length, 0, 5.1, (mesh) => {
  mesh.name = stlNames[3];
  arm2Mesh.add(mesh);
});
loadSTL(
  stlNames[4],
  armShift - additionalArm1Length - additionalArm2Length,
  0,
  5.1,
  (mesh) => {
    mesh.name = stlNames[4];
    arm2Mesh.add(mesh);
  }
);
loadSTL(
  stlNames[5],
  armShift - additionalArm1Length - additionalArm2Length,
  0,
  5.1,
  (mesh) => {
    mesh.name = stlNames[5];
    toolMesh.add(mesh);
    lastSelectedMesh = toolMesh;
  }
);
loadSTL(
  stlNames[6],
  armShift - additionalArm1Length - additionalArm2Length - additionalToolLength,
  0,
  5.1,
  (mesh) => {
    mesh.name = stlNames[6];
    toolMesh.add(mesh);
    lastSelectedMesh = toolMesh;
  }
);

addAdditionalLength();

rotation2.add(arm2Mesh);
rotation2.add(toolMesh);
rotation2.add(arm2Text);
rotation2.add(circleMesh2);
rotation2.add(ringMesh2);

rotation1.add(arm1Mesh);
rotation1.add(rotation2);

setupCanvasHelper(cameraCanvasHelper, sceneHelper, pivotPointHelper);
const arm1RotationHelper = getRotationHelperGroup(
  rotation1,
  armShift,
  rotationTextHeight,
  textCircleSize
);
const arm2RotationHelper = getRotationHelperGroup(
  rotation2,
  arm2RotationShift,
  rotationTextHeight,
  textCircleSize
);

scene.add(rotation1);
scene.add(rotation2);
scene.add(baseMesh);

//lines drawn on arm base
drawCartesianLines(scene, panelSize * scaleOfPlateSize, armShift);

const toggle = document.getElementById("toggle");
toggle.checked = rightSide;
toggle.addEventListener("change", function () {
  //update direction
  var formData = new FormData();
  formData.append("isRight", toggle.checked);
  fetch("/arm/set/direction", {
    method: "POST",
    body: formData,
  }).then((response) => {
    if (response.ok) {
      rightSide = toggle.checked;
      localStorage.setItem("rightSide", rightSide);
      location.reload();
      return true;
    } else {
      console.error("Cannot change direction");
      return false;
    }
  });
});

/**
 * Function to dispose old elements, draw them in new positions and connect by meshes, redraw arm range
 */
function changeArmDimens() {
  currentToolX = arm1Length + arm2TotalLength;
  currentToolY = 0;
  moveToolOnSceneToPosition(true, 1);
  arm1Length = parseFloat(
    localStorage.getItem("arm1Length") / scaleDisplayDivider || defaultArmLength
  );
  arm2Length = parseFloat(
    localStorage.getItem("arm2Length") / scaleDisplayDivider ||
      defaultArmLength - defaultToolDistance
  );
  toolDistanceToArm = parseFloat(
    localStorage.getItem("toolDistanceToArm") / scaleDisplayDivider ||
      defaultToolDistance
  );
  arm2TotalLength = arm2Length + toolDistanceToArm;
  additionalArm1Length = arm1Length - defaultArmLength;
  additionalArm2Length = arm2Length - defaultArmLength;
  arm2RotationShift = 1 - additionalArm1Length;
  currentToolX = arm1Length + arm2TotalLength;

  updatePositionText();

  //toolChange
  let cubeToolExtension1 = toolMesh.getObjectByName("cubeToolExtension1", true);
  let cubeToolExtension2 = toolMesh.getObjectByName("cubeToolExtension2", true);
  //arm1
  let cubeArmExtension1p1 = arm1Mesh.getObjectByName(
    "cubeArmExtension1p1",
    true
  );
  let cubeArmExtension1p2 = arm1Mesh.getObjectByName(
    "cubeArmExtension1p2",
    true
  );
  //arm2
  let cubeArmExtension2 = arm2Mesh.getObjectByName("cubeArmExtension2", true);

  if (cubeToolExtension1 != null) {
    toolMesh.remove(cubeToolExtension1);
    cubeToolExtension1.material.dispose();
    cubeToolExtension1.geometry.dispose();
  }
  if (cubeToolExtension2 != null) {
    toolMesh.remove(cubeToolExtension2);
    cubeToolExtension2.material.dispose();
    cubeToolExtension2.geometry.dispose();
  }

  if (cubeArmExtension1p1 != null) {
    arm1Mesh.remove(cubeArmExtension1p1);
    cubeArmExtension1p1.material.dispose();
    cubeArmExtension1p1.geometry.dispose();
  }
  if (cubeArmExtension1p2 != null) {
    arm1Mesh.remove(cubeArmExtension1p2);
    cubeArmExtension1p2.material.dispose();
    cubeArmExtension1p2.geometry.dispose();
  }
  if (cubeArmExtension2 != null) {
    arm2Mesh.remove(cubeArmExtension2);
    cubeArmExtension2.material.dispose();
    cubeArmExtension2.geometry.dispose();
  }

  additionalToolLength = toolDistanceToArm - defaultToolDistance;
  addAdditionalLength();

  arm1Mesh
    .getObjectByName(stlNames[2], true)
    .position.set(armShift - additionalArm1Length, 5.1, 0);
  ringMesh2.position.set(arm2RotationShift, rotationTextHeight + 0.001, 0);
  circleMesh2.position.set(arm2RotationShift, rotationTextHeight, 0);
  arm2Text.position.set(arm2RotationShift, rotationTextHeight + 0.01, 0);
  arm2RotationHelper.position.set(arm2RotationShift, rotationTextHeight, 0);
  heightText.position.set(-3.501, heightTextHeight, 0);
  heightRect.position.set(-3.5, heightTextHeight, 0);
  arm2Mesh
    .getObjectByName(stlNames[3], true)
    .position.set(armShift - additionalArm1Length, 5.1, 0);
  arm2Mesh
    .getObjectByName(stlNames[4], true)
    .position.set(
      armShift - additionalArm1Length - additionalArm2Length,
      5.1,
      0
    );

  //mesh main parts
  toolMesh
    .getObjectByName(stlNames[5], true)
    .position.set(
      armShift - additionalArm1Length - additionalArm2Length,
      5.1,
      0
    );
  toolMesh
    .getObjectByName(stlNames[6], true)
    .position.set(
      armShift -
        additionalArm1Length -
        additionalArm2Length -
        additionalToolLength,
      5.1,
      0
    );

  heightText.position.set(
    -3.501 + (defaultArmLength * 2 - arm1Length - arm2Length),
    heightTextHeight,
    0
  );
  let percent = Math.round(
    ((currentHeight - minHeight) / (maxHeight - minHeight)) * 100
  );
  rectanglePercent = updateRectanglePercent(
    scene, //scene
    rotation2, //parentGroup
    rectanglePercent, //oldRectanglePercentGroup
    1.96, //width
    1.6, //height
    0.28, //barWidth
    percent, //percentage
    -3.38 + (defaultArmLength * 2 - arm1Length - arm2Length), //x
    0, //y
    heightTextHeight //z
  );
  heightRect.position.set(
    -3.5 + (defaultArmLength * 2 - arm1Length - arm2Length),
    heightTextHeight,
    0
  );

  //armRange
  scene.remove(armRange);
  armRange.material.dispose();
  armRange.geometry.dispose();
  armRange = drawArmRange(
    panelSize * 2,
    armShift,
    arm1Length,
    arm2TotalLength,
    MAX_ARM1_ANGLE,
    MAX_ARM2_ANGLE,
    MAX_ARM1_ANGLE_COLLISION,
    !rightSide
  );
  scene.add(armRange);
}

/**
 * Function that creates additional meshes to make connection between cuted stl to change arms and tool sizes
 */
function addAdditionalLength() {
  if (additionalToolLength > 0) {
    let cubeToolExtension1 = new THREE.Mesh(
      new THREE.BoxGeometry(additionalToolLength + 0.01, 0.86, 2.2),
      new THREE.MeshPhongMaterial({
        color: armColor,
        emissive: armColor,
        emissiveIntensity: 0.01,
      })
    );
    cubeToolExtension1.position.set(
      -3.49 -
        additionalToolLength / 2 -
        additionalArm1Length -
        additionalArm2Length,
      0.23285,
      0.0035
    );
    cubeToolExtension1.name = "cubeToolExtension1";

    let cubeToolExtension2 = new THREE.Mesh(
      new THREE.BoxGeometry(additionalToolLength + 0.01, 0.36, 2.2),
      new THREE.MeshPhongMaterial({
        color: armColor,
        emissive: armColor,
        emissiveIntensity: 0.01,
      })
    );
    cubeToolExtension2.position.set(
      -3.49 -
        additionalToolLength / 2 -
        additionalArm1Length -
        additionalArm2Length,
      1.6228,
      0.0035
    );
    cubeToolExtension2.name = "cubeToolExtension2";

    toolMesh.add(cubeToolExtension1);
    toolMesh.add(cubeToolExtension2);
  }

  if (additionalArm1Length > 0) {
    let cubeArmExtension1p1 = new THREE.Mesh(
      new THREE.BoxGeometry(additionalArm1Length + 0.01, 2.3, 1.6),
      new THREE.MeshPhongMaterial({
        color: armColor,
        emissive: armColor,
        emissiveIntensity: 0.01,
      })
    );
    cubeArmExtension1p1.position.set(3 - additionalArm1Length / 2, 6.173, 0);
    cubeArmExtension1p1.name = "cubeArmExtension1p1";

    let length = additionalArm1Length * 1.5,
      width = 1.6;

    let shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, width);
    shape.lineTo(length, width);
    shape.lineTo(length, 0);
    shape.lineTo(0, 0);

    let extrudeSettings = {
      steps: 1,
      depth: 1,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: -0.1,
      bevelSegments: 1,
    };
    let cubeArmExtension1p2 = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, extrudeSettings),
      new THREE.MeshPhongMaterial({
        color: armColor,
        emissive: armColor,
        emissiveIntensity: 0.01,
      })
    );
    cubeArmExtension1p2.rotateX(-Math.PI / 2);
    cubeArmExtension1p2.position.set(
      3 - (additionalArm1Length + length) / 2,
      6.4225,
      width / 2
    );
    cubeArmExtension1p2.name = "cubeArmExtension1p2";

    arm1Mesh.add(cubeArmExtension1p2);
    arm1Mesh.add(cubeArmExtension1p1);
  }
  if (additionalArm2Length > 0) {
    let cubeArmExtension2 = new THREE.Mesh(
      new THREE.BoxGeometry(additionalArm2Length + 0.1, 0.5, 1.6),
      new THREE.MeshPhongMaterial({
        color: armColor,
        emissive: armColor,
        emissiveIntensity: 0.01,
      })
    );
    cubeArmExtension2.position.set(
      -2.48 - additionalArm1Length - additionalArm2Length / 2,
      4.7528,
      0.00385
    );
    cubeArmExtension2.name = "cubeArmExtension2";
    arm2Mesh.add(cubeArmExtension2);
  }
}

/**
 * Function animating changes on the scene
 */
function animate() {
  //set animation refreshing
  requestAnimationFrame(animate);
  //re-render scene
  renderer.render(scene, camera);
  rendererHelper.render(sceneHelper, cameraCanvasHelper);
}

/**
 * Function checking if armAngle is inside range (-MAX_ARM_ANGLE, MAX_ARM_ANGLE_COLLISION) if isRightSide. Else (-MAX_ARM_ANGLE_COLLISION, MAX_ARM_ANGLE).
 * If MAX_ARM_ANGLE_COLLISION is Undefined then it uses MAX_ARM_ANGLE as replacement.
 * @param {number} MAX_ARM_ANGLE - max angle
 * @param {number} MAX_ARM_ANGLE_COLLISION  - max for other side
 * @param {number} armAngle - angle to check
 * @param {boolean} isRightSide - specifies orientation of arm
 * @returns {boolean} - is angle inside range
 */
function isAngleBetween(
  MAX_ARM_ANGLE,
  MAX_ARM_ANGLE_COLLISION,
  armAngle,
  isRightSide
) {
  var ret =
    (!isRightSide &&
      armAngle >= -MAX_ARM_ANGLE &&
      armAngle <=
        (MAX_ARM_ANGLE_COLLISION != undefined
          ? MAX_ARM_ANGLE_COLLISION
          : MAX_ARM_ANGLE)) ||
    (isRightSide &&
      armAngle >=
        -(MAX_ARM_ANGLE_COLLISION != undefined
          ? MAX_ARM_ANGLE_COLLISION
          : MAX_ARM_ANGLE) &&
      armAngle <= MAX_ARM_ANGLE);
  return ret;
}

/**
 * Function to setup keydown listener to move tool by keyboard
 */
async function setupMoveListener() {
  document.addEventListener("keydown", (event) => {
    if (toolEditMode && !isArmDrawing) {
      let armStepToSend = getMovePrecision() * 10;
      let armStep = getMovePrecision() / scaleDisplayDivider;
      switch (event.code) {
        case "ArrowUp":
        case "Numpad8":
        case "KeyW":
          if (canMove(currentToolX + armStep, currentToolY)) {
            currentToolX += armStep;
            moveToolOnSceneToPosition();
            if (!demoMode) moveArmBy(armStepToSend, null, null, rightSide);
            updatePositionText();
          }
          break;
        case "ArrowDown":
        case "Numpad2":
        case "KeyS":
          if (canMove(currentToolX - armStep, currentToolY)) {
            currentToolX -= armStep;
            moveToolOnSceneToPosition();
            if (!demoMode) moveArmBy(-armStepToSend, null, null, rightSide);
            updatePositionText();
          }
          break;
        case "ArrowLeft":
        case "Numpad4":
        case "KeyA":
          if (canMove(currentToolX, currentToolY + armStep)) {
            currentToolY += armStep;
            moveToolOnSceneToPosition();
            if (!demoMode) moveArmBy(null, armStepToSend, null, rightSide);
            updatePositionText();
          }
          break;
        case "ArrowRight":
        case "Numpad6":
        case "KeyD":
          if (canMove(currentToolX, currentToolY - armStep)) {
            currentToolY -= armStep;
            moveToolOnSceneToPosition();
            if (!demoMode) moveArmBy(null, -armStepToSend, null, rightSide);
            updatePositionText();
          }
          break;
        default:
          break;
      }
    }
  });
}

/**
 * Text displayed on top of screen, displaying tool coordinates
 */
function updatePositionText() {
  positionText.textContent =
    "X=" +
    (currentToolX * scaleDisplayDivider).toFixed(2) +
    " Y=" +
    (currentToolY * scaleDisplayDivider).toFixed(2);
}

/**
 * Update helper rotation and camera position based on the main scene.
 */
function updateHelper() {
  var nowRounded = new THREE.Vector3(
    controls.object.rotation.x.toFixed(3),
    controls.object.rotation.y.toFixed(3),
    controls.object.rotation.z.toFixed(3)
  );
  if (previousPosition === null) {
    previousPosition = new THREE.Vector3();
    previousPosition.copy(controls.object.position);
  }
  if (previousRotation == null) {
    controlsHelper.target = sceneHelper.position;
    controlsHelper.object.rotation.copy(controls.object.rotation);
    previousRotation = new THREE.Vector3(
      nowRounded.x,
      nowRounded.y,
      nowRounded.z
    );
  }

  if (!previousRotation.equals(nowRounded)) {
    arm1Text.rotation.z += nowRounded.z - previousRotation.z;
    arm2Text.rotation.z += nowRounded.z - previousRotation.z;
    controlsHelper.target = sceneHelper.position;
    controlsHelper.object.rotation.copy(controls.object.rotation);
    previousRotation = new THREE.Vector3(
      nowRounded.x,
      nowRounded.y,
      nowRounded.z
    );
  } else {
    previousPosition.sub(controls.object.position);
    toUndo.add(previousPosition);
  }
  temp.addVectors(controls.object.position, toUndo);
  controlsHelper.object.position.copy(temp);

  rendererHelper.render(sceneHelper, cameraCanvasHelper);
  previousPosition.copy(controls.object.position);
}

/**
 * Function checking if arm can move to position
 * @param {number} toolX - x pos of tool
 * @param {number} toolY - x pos of tool
 * @returns {boolean} - if tool is inside radius and angles are in range
 */
function canMove(toolX, toolY) {
  const newRadius = Math.hypot(toolX, toolY);

  if (
    newRadius > arm1Length + arm2TotalLength ||
    newRadius <
      getMinDistance(
        MAX_ARM1_ANGLE,
        MAX_ARM2_ANGLE,
        arm1Length,
        arm2TotalLength
      )
  ) {
    //console.error("Object is outside workspace R<"+newRadius);
    return false;
  }
  let gamma = Math.atan2(toolY, toolX);
  let toBeta =
    (arm1Length * arm1Length +
      arm2TotalLength * arm2TotalLength -
      toolX * toolX -
      toolY * toolY) /
    (2 * arm1Length * arm2TotalLength);
  let beta = Math.acos(toBeta);

  let toAlpha =
    (toolX * toolX +
      toolY * toolY +
      arm1Length * arm1Length -
      arm2TotalLength * arm2TotalLength) /
    (2 * arm1Length * newRadius);
  let alpha = Math.acos(toAlpha);

  let angle = gamma + alpha;
  var arm1AngleNew = -(angle * (180 / Math.PI));
  var arm2AngleNew = 180 - beta * (180 / Math.PI);

  if (isNaN(arm1AngleNew)) arm1AngleNew = 0;

  if (isNaN(arm2AngleNew)) arm2AngleNew = 0;

  if (
    !isAngleBetween(
      MAX_ARM1_ANGLE,
      MAX_ARM1_ANGLE_COLLISION,
      arm1AngleNew,
      rightSide
    )
  )
    return false;
  if (!isAngleBetween(MAX_ARM2_ANGLE, null, arm2AngleNew, rightSide))
    return false;

  return true;
}

/**
 * Function to move physical arm by axis movement
 * @param {number} x - relative movement in X axis, null if no movement
 * @param {number} y - relative movement in X axis, null if no movement
 * @param {number} z - relative movement in X axis, null if no movement
 * @param {boolean} isRightSide - specifies orientation of arm
 * @TODO verify function and integrate, add blocking/ queue commands
 */
function moveArmBy(x, y, z, isRightSide) {
  const data = {
    x: "" + x,
    y: "" + y,
    z: "" + z,
    isRightSide: "" + !isRightSide,
  };
  const params = new URLSearchParams();

  for (const key in data) {
    params.append(key, data[key]);
  }
  fetch("/arm/movement/cartesian", {
    method: "POST",
    body: params,
  })
    .then((response) => {
      if (response.status == 500) {
        console.error("move fail");
      } else if (response.status == 503) {
        onArmDisconnect();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/**
 * Function to block move, deselect arm part, display notification
 */
export function onArmDisconnect() {
  console.error("Connection lost");
  showDialog(
    document.getElementById("alert"),
    document.getElementById("alert-msg"),
    "e",
    "Arm connection lost"
  );
  changeSTLColor(lastSelectedMesh, armColor);
  lastSelectedMesh = null;
  refreshPorts();
}

/**
 * Function to move physical arm by angle
 * @param {number} firstArmAngle - relative movement of first arm, null if no movement
 * @param {number} secondArmAngle - relative movement of second arm, null if no movement
 * @param {boolean} isRightSide - specifies orientation of arm
 * @TODO verify function and integrate, add blocking/ queue commands
 */
function moveArmByAngle(firstArmAngle, secondArmAngle) {
  const data = {
    L: "" + firstArmAngle,
    S: "" + secondArmAngle,
  };
  const params = new URLSearchParams();

  for (const key in data) {
    params.append(key, data[key]);
  }
  fetch("/arm/movement/angle", {
    method: "POST",
    body: params,
  })
    .then((response) => {
      if (response.status == 500) {
        console.error("move fail");
      } else if (response.status == 503) {
        console.error("Connection lost");
        showDialog(
          document.getElementById("alert"),
          document.getElementById("alert-msg"),
          "e",
          "Arm connection lost"
        );
        changeSTLColor(lastSelectedMesh, armColor);
        lastSelectedMesh = null;
        refreshPorts();
      }
    })
    .catch((error) => {
      console.error("Error:", error.message); // Odczytujemy treść odpowiedzi błędu
    });
}

/**
 * Update arm on the screen, based on currentToolX and currentToolY
 * @param {boolean} checkRotation - verify or not if arm angle is in range
 * @param {int} totalSteps - to divide one movement into totalSteps to make movement more linear
 * @param {bool} isRightSide - determine direction of arm
 */
function moveToolOnSceneToPosition(checkRotation = true, totalSteps = 20, isRightSide=rightSide) {
  let newRadius = Math.hypot(currentToolX, currentToolY);

  let gamma = Math.atan2(currentToolY, currentToolX);
  let toBeta =
    (arm1Length * arm1Length +
      arm2TotalLength * arm2TotalLength -
      currentToolX * currentToolX -
      currentToolY * currentToolY) /
    (2 * arm1Length * arm2TotalLength);
  let beta = Math.acos(toBeta);

  let toAlpha =
    (currentToolX * currentToolX +
      currentToolY * currentToolY +
      arm1Length * arm1Length -
      arm2TotalLength * arm2TotalLength) /
    (2 * arm1Length * newRadius);
  let alpha = Math.acos(toAlpha);

  let angle = gamma + alpha;
  let arm1AngleNew = -(angle * (180 / Math.PI));
  let arm2AngleNew = 180 - beta * (180 / Math.PI);

  if (isNaN(arm1AngleNew)) {
    arm1AngleNew = 0;
  }

  if (isNaN(arm2AngleNew)) {
    arm2AngleNew = 0;
  }

  let arm1AngleNewCp = arm1AngleNew - arm1Angle;
  let arm2AngleNewCp = arm2AngleNew - arm2Angle;
  let canRotate = true;

  if (checkRotation) {
    if (
      !isAngleBetween(
        MAX_ARM1_ANGLE,
        MAX_ARM1_ANGLE_COLLISION,
        arm1AngleNew,
        isRightSide
      )
    )
      canRotate = false;
    if (!isAngleBetween(MAX_ARM2_ANGLE, null, arm2AngleNew, isRightSide))
      canRotate = false;
  }
  let steps = 0; // interpolation steps

  if (canRotate && (arm1AngleNewCp != 0 || arm2AngleNewCp != 0)) {
    function interpolateStep() {
      if (steps < totalSteps) {
        arm1Angle += arm1AngleNewCp / totalSteps;
        rotateArm1(
          arm1AngleNewCp / totalSteps,
          rotation1,
          arm2Angle,
          rotation2,
          arm2RotationShift,
          armShift,
          isRightSide
        );
        updateTextTexture(
          Math.round(arm1Angle % 360).toString(),
          30,
          arm1Text,
          5,
          0,
          rotationTextHeight
        );
        updateRing(
          ringMesh1,
          0.4,
          0.5,
          isRightSide ? arm1Angle % 360 : -arm1Angle % 360
        );
        if (isRightSide)
          arm2Text.rotation.z +=
            ((arm1AngleNewCp / totalSteps) * Math.PI) / 180;
        else
          arm2Text.rotation.z -=
            ((arm1AngleNewCp / totalSteps) * Math.PI) / 180;
        arm2Angle += arm2AngleNewCp / totalSteps;
        rotateArm2(
          rotation2,
          arm2AngleNewCp / totalSteps,
          arm2RotationShift,
          isRightSide
        );
        updateTextTexture(
          Math.round(arm2Angle % 360).toString(),
          26,
          arm2Text,
          arm2RotationShift,
          0,
          rotationTextHeight
        );
        updateRing(
          ringMesh2,
          0.4,
          0.5,
          isRightSide ? arm2Angle % 360 : -arm2Angle % 360
        );
        if (isRightSide)
          arm2Text.rotation.z +=
            ((arm2AngleNewCp / totalSteps) * Math.PI) / 180;
        else
          arm2Text.rotation.z -=
            ((arm2AngleNewCp / totalSteps) * Math.PI) / 180;
        renderer.render(scene, camera);
        steps++;
        setTimeout(interpolateStep, 15);
      }
    }

    interpolateStep();
  }
}

/**
 * Set position on of the tool and update displayed arm
 * @param {THREE.Vector3} vector
 * @param {boolean} isRightSide - specifies orientation of arm
 */
function setToolPosition(vector, isRightSide) {
  currentToolX = vector.x;
  currentToolY = -vector.y;
  if (isRightSide) {
    currentToolX = vector.y;
    currentToolY = -vector.x;
  }

  toolMesh.translateY(vector.z - currentHeight);
  currentHeight = vector.z;
  moveToolOnSceneToPosition(false, 1, isRightSide);
  updatePositionText();
    let percent = Math.round(
      ((currentHeight - minHeight) / (maxHeight - minHeight)) * 100
    );
 updateTextTexture(
   ((currentHeight - minHeight) * scaleDisplayDivider)
     .toFixed(2)
     .toString(),
   40,
   heightText,
   -3.501 + (defaultArmLength * 2 - arm1Length - arm2Length),
   0,
   heightTextHeight
 );
  rectanglePercent = updateRectanglePercent(
    scene, //scene
    rotation2, //parentGroup
    rectanglePercent, //oldRectanglePercentGroup
    1.96, //width
    1.6, //height
    0.28, //barWidth
    percent, //percentage
    -3.38 + (defaultArmLength * 2 - arm1Length - arm2Length), //x
    0, //y
    heightTextHeight //z
  );
}

/**
 * Update position based on current rotation, update position text
 */
function updateToolPos() {
  let a1 = -arm1Angle * (Math.PI / 180);
  let a2 = -arm2Angle * (Math.PI / 180);

  let x = arm1Length * Math.cos(a1) + arm2TotalLength * Math.cos(a1 + a2);
  let y = arm1Length * Math.sin(a1) + arm2TotalLength * Math.sin(a1 + a2);

  currentToolX = x;
  currentToolY = y;
  updatePositionText();
}

/**
 * Function listtening for clicks on an object and mark it as selected(lastSelectedMesh). Show cartesian axis lines for arm.
 */
function selectSTL() {
  if (getCanMoveArm()&& !isArmDrawing) {
    const meshes = [baseMesh, arm1Mesh, arm2Mesh, toolMesh];
    changeSTLColor(lastSelectedMesh, armColor);

    arm1RotationHelper.visible = false;
    arm2RotationHelper.visible = false;

    editMode = false;
    toolEditMode = false;

    var mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0 && intersects[0].object.name.trim() != "") {
      //closest object
      const object = intersects[0].object;
      editMode = true;
      if (object.name != stlNames[0]) {
        switch (object.name) {
          case stlNames[1]:
          case stlNames[2]:
          case "cubeArmExtension1p1":
          case "cubeArmExtension1p2":
            lastSelectedMesh = meshes[1];
            arm1RotationHelper.visible = true;
            break;
          case stlNames[3]:
          case stlNames[4]:
          case "cubeArmExtension2":
            lastSelectedMesh = meshes[2];
            arm2RotationHelper.visible = true;
            break;
          case stlNames[5]:
          case stlNames[6]:
          case "cubeToolExtension1":
          case "cubeToolExtension2":
            lastSelectedMesh = toolMesh;
            toolEditMode = true;
            break;
        }
        changeSTLColor(lastSelectedMesh, selectColor);
      }
    }
  }
}
/**
 * Load file and draw it on the scene
 * @param {string} fileName
 */
function drawFileOnScene(fileName) {
  isArmDrawing = true;
  drawFile(scene, fileName, setToolPosition, armShift, rightSide, [currentToolX, currentToolY,currentHeight]);
}
window.drawFileOnScene = drawFileOnScene;

//update helpers rotation
document.addEventListener("DOMContentLoaded", function () {
  updateHelper();
  restoreDrawing(scene, setToolPosition, armShift, rightSide, [currentToolX, currentToolY,currentHeight]).then((value)=>{
    isArmDrawing = value;
  });
});