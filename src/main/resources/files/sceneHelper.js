import * as THREE from '/static/three/build/three.module.js'


function setupCanvasHelper(cameraCanvasHelper,sceneHelper,pivotPointHelper){

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

export function setupHelpers(cameraCanvasHelper,sceneHelper,pivotPointHelper,rotation1,rotation2,axesHelper1,axesHelper2,panelSize,arm2Movement){

    setupCanvasHelper(cameraCanvasHelper,sceneHelper,pivotPointHelper);

    axesHelper1.rotateX(-Math.PI/2);
    axesHelper1.rotateZ(Math.PI/2);
    axesHelper1.translateY(-panelSize/4);
    axesHelper1.translateZ(4.3);

    axesHelper2.rotateX(-Math.PI/2);
    axesHelper2.rotateZ(Math.PI/2);
    axesHelper2.translateY(-arm2Movement);
    axesHelper2.translateZ(6.1);

    axesHelper1.visible=false;
    axesHelper2.visible=false;

    rotation1.add(axesHelper1);
    rotation2.add(axesHelper2);
}