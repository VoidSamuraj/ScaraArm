import * as THREE from '/static/three/build/three.module.js'

//for Canvas Helper
function getCanvasHelperGroup(width,length,lineShift){

    let geoR = new THREE.CapsuleGeometry( width/2, length, 4, 8 );
    let geoG = new THREE.CapsuleGeometry( width/2,length, 4, 8 );
    let geoB = new THREE.CapsuleGeometry( width/2, length, 4, 8 );

    let red = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    let green = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    let blue = new THREE.MeshBasicMaterial( {color: 0x0000ff} );

    let redC = new THREE.Mesh( geoR, red );
    let greenC = new THREE.Mesh( geoG, green );
    let blueC = new THREE.Mesh( geoB, blue );

    // width/2 adds rounded end space
    let shift = lineShift != null ? (length+width)/2 + lineShift : length/2 + 0.02;

    redC.rotateX(Math.PI/2);
    redC.rotateY(Math.PI/2);
    redC.position.set(0,0,-shift);

    greenC.rotateY(Math.PI/2);
    greenC.rotateX(Math.PI/2);
    greenC.position.set(-shift,0,0);

    blueC.position.set(0,shift,0);

    var group=new THREE.Group();

    group.add(redC);
    group.add(greenC);
    group.add(blueC);
    return group;
}
//for arm directions Helper
export function getRotationHelperGroup(rotationGroup, armShift,helperHeight,lineShift){
    let armHelperGroup=getCanvasHelperGroup(0.1, 3,lineShift);
    getCanvasHelperGroup(armHelperGroup,0.1, 3,lineShift);
    armHelperGroup.position.set(armShift,helperHeight,0);
    rotationGroup.add(armHelperGroup);
    armHelperGroup.visible=false;
    return armHelperGroup;
}

//for second canvas
export function setupCanvasHelper(cameraCanvasHelper,sceneHelper,pivotPointHelper){
    cameraCanvasHelper.updateProjectionMatrix();
    let groupHelper=getCanvasHelperGroup(0.04, 0.8,null);
    sceneHelper.add(groupHelper);
    cameraCanvasHelper.position.set(0, 0, 2);
    sceneHelper.add(cameraCanvasHelper);
    pivotPointHelper.add(cameraCanvasHelper);
    sceneHelper.add(pivotPointHelper);
}