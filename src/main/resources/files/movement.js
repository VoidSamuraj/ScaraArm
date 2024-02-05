import * as THREE from '/static/three/build/three.module.js'


/**
 * Function to rotate arm 1
 * @param {number} arm1Angle relative angle (change 1 mean rotate 1 degree) 
 * @param {THREE.Group} rotation1 group representing arm1
 * @param {number} arm2Angle  relative angle (change 1 mean rotate 1 degree)
 * @param {THREE.Group} rotation2 group representing arm2
 * @param {number} arm2Shift shift to perform rotation correctly
 * (arm is shifted to be positioned in group but rotation point stays in place,
 *  need to reverse this shift just for rotation)
 * @param {number} armShift similar to the previous parameter but associated with arm 1
 * @param {boolean} rightSide specifies orientation of arm 
 */
export function rotateArm1(arm1Angle,rotation1,arm2Angle,rotation2,arm2Shift,armShift,rightSide){

    rotateArm2(rotation2,-arm2Angle,arm2Shift,rightSide);
    rotation1.translateX(armShift);
    rotation2.translateX(armShift);
    var stopnie = rightSide ? -arm1Angle : arm1Angle;
    stopnie *= Math.PI / 180;

    rotation1.rotateY(stopnie);
    rotation2.rotateY(stopnie);

    rotation1.translateX(-armShift);
    rotation2.translateX(-armShift);
    rotateArm2(rotation2,arm2Angle,arm2Shift,rightSide);
}

/**
 * Function to rotate arm 2
 * @param {THREE.Group} rotation2 group representing arm2
 * @param {number} angle  relative angle (change 1 mean rotate 1 degree)
 * @param {number} arm2Shift shift to perform rotation correctly
 * (arm is shifted to be positioned in group but rotation point stays in place,
 *  need to reverse this shift just for rotation)
 * @param {boolean} rightSide specifies orientation of arm 
 */
export function rotateArm2(rotation2,angle,arm2Shift,rightSide){

    rotation2.translateX(arm2Shift);

      var stopnie = rightSide ? -angle : angle;
       stopnie *= Math.PI / 180;
    rotation2.rotateY(stopnie);

    rotation2.translateX(-arm2Shift);
}