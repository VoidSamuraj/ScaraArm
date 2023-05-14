import * as THREE from '/static/three/build/three.module.js'

export function rotateArm1(arm1Angle,rotation1,arm2Angle,rotation2,arm2Movement,panelSize){

    rotateArm2(rotation2,-arm2Angle,arm2Movement);
    rotation1.translateX(panelSize/4);
    rotation2.translateX(panelSize/4);
    const stopnie=-arm1Angle * Math.PI / 180;
    rotation1.rotateY(stopnie);
    rotation2.rotateY(stopnie);

    rotation1.translateX(-panelSize/4);
    rotation2.translateX(-panelSize/4);
    rotateArm2(rotation2,arm2Angle,arm2Movement);
}

export function rotateArm2(rotation2,angle,arm2Movement){

    rotation2.translateX(arm2Movement);

    const stopnie=-angle * Math.PI / 180;
    rotation2.rotateY(stopnie);

    rotation2.translateX(-arm2Movement);
}