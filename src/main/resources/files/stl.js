import * as THREE from '/static/three/build/three.module.js'
import { STLLoader } from '/static/three/examples/jsm/loaders/STLLoader.js';

//functios to load and color stl model

const SLoader = new STLLoader();
const armColor=0xffa31a;

/**
 * Function to change color of stl
 * @param {THREE.Object3D} stl specifies which stl update
 * @param {color} color color in hex format
 */
export function changeSTLColor(stl,color){
        stl.traverse((child)=>{
            if (child instanceof THREE.Mesh){
                child.material.color.set(color);
                child.material.emissive.set(color);
            }
        });
}
/**
 * loads stl, place in specified place and execute callback on new object
 * @param {string} name name of stl file  
 * @param {float} x position of stl
 * @param {float} y position of stl
 * @param {float} z position of stl
 * @param {function(THREE.Mesh)} callback - apply operations on mesh, add them to group to get handle for them
 */
export function loadSTL(name,x,y,z,callback){
    SLoader.load(`/static/stl/${name}.stl`, (geometry) => {

          const shadowMaterial = new THREE.MeshPhongMaterial({
                                       color: armColor,
                                       emissive:armColor,       //to prevent black down side
                                       emissiveIntensity:0.01
                                     });

          const mesh = new THREE.Mesh(geometry, shadowMaterial);

          mesh.position.set(x,z,y);
          mesh.receiveShadow = true;
          mesh.castShadow = true;

          mesh.rotation.x=-90 * Math.PI / 180;

          mesh.name=name;
          callback(mesh);
    });
}


