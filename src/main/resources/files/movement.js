import * as THREE from '/static/three/build/three.module.js'

export function rotateArm1(arm1Angle,rotation1,arm2Angle,rotation2,arm2Movement,armShift,rightSide){

    rotateArm2(rotation2,-arm2Angle,arm2Movement,rightSide);
    rotation1.translateX(armShift);
    rotation2.translateX(armShift);
   var stopnie = rightSide ? -arm1Angle : arm1Angle;
   stopnie *= Math.PI / 180;

    rotation1.rotateY(stopnie);
    rotation2.rotateY(stopnie);

    rotation1.translateX(-armShift);
    rotation2.translateX(-armShift);
    rotateArm2(rotation2,arm2Angle,arm2Movement,rightSide);
}

export function rotateArm2(rotation2,angle,arm2Movement,rightSide){

    rotation2.translateX(arm2Movement);

      var stopnie = rightSide ? -angle : angle;
       stopnie *= Math.PI / 180;
    rotation2.rotateY(stopnie);

    rotation2.translateX(-arm2Movement);
}