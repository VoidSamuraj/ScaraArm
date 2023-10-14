import * as THREE from '/static/three/build/three.module.js'
import { STLLoader } from '/static/three/examples/jsm/loaders/STLLoader.js';
const SLoader = new STLLoader();
const armColor=0xffa31a;
export function changeSTLColor(stl,color){
        stl.traverse((child)=>{
            if (child instanceof THREE.Mesh){
                child.material.color.set(color);
                child.material.emissive.set(color);
            }
        });
}
export function loadSTL(nazwa,x,y,z,callback){
    SLoader.load(`/static/stl/${nazwa}.stl`, (geometry) => {

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

          mesh.name=nazwa;
          callback(mesh);
    });
}


