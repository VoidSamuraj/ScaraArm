import * as THREE from '/static/three/build/three.module.js'
import { STLLoader } from '/static/three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();
const armColor=0xffa31a;


export function loadSTL(nazwa,x,y,z,callback){

    loader.load(`/static/stl/${nazwa}.stl`, (geometry) => {

          const shadowMaterial = new THREE.MeshStandardMaterial({
                                       color: armColor,
                                       roughness: 0.8, // zmniejszenie roughness
                                       lightMapIntensity: 0.8, // zwiększenie lightMapIntensity
                                     });

          shadowMaterial.castShadow = true;


          // mesh z geometry
          const mesh = new THREE.Mesh(geometry, shadowMaterial);
          mesh.position.set(x,z,y);
          mesh.receiveShadow = true;

          mesh.rotation.x=-90 * Math.PI / 180;

          mesh.name=nazwa;
          callback(mesh);

    });
}


