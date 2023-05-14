import * as THREE from '/static/three/build/three.module.js'

export function createCircle(scene,x,y,z,size){
    var circleMesh = new THREE.Mesh(new THREE.CircleGeometry(size, 30), new THREE.MeshBasicMaterial({ color: 0x454545 }));
    circleMesh.rotateX(-Math.PI/2);
    circleMesh.position.set(x, z, y);
    scene.add(circleMesh);
    return circleMesh;
}

export function createRing(scene,x,y,z,min,max,degree){
    var ringMesh = new THREE.Mesh(new THREE.RingGeometry(min, max, 30, 1, 0, degree * Math.PI / 180), new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide }));
    ringMesh.rotateX(-Math.PI/2);
    ringMesh.rotateZ(-Math.PI);
    ringMesh.position.set(x, z, y);
    scene.add(ringMesh);
    return ringMesh;
}

export function updateRing(ringMesh,min,max,degree){
    ringMesh.geometry.dispose();
    ringMesh.geometry = new THREE.RingGeometry(min, max, 30, 1, 0, degree * Math.PI / 180)
    ringMesh.material = new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide })
}

export function addGrid(scene,panelSize,x,y,z){
    const grid = new THREE.GridHelper(panelSize, panelSize, 0xffffff, 0xffffff);
    grid.position.set(x,z,y);
    scene.add(grid);

    //panel pod siatką
    const backgroundPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(panelSize, panelSize),
      new THREE.MeshBasicMaterial({ color: 0x454545, side: THREE.DoubleSide})
    );
    backgroundPlane.position.set(x, z-0.01, y);
    backgroundPlane.rotation.x=90 * Math.PI / 180;
    scene.add(backgroundPlane);
}

export function addLight(scene,panelSize){
    const light1 = new THREE.PointLight(0xffffff, 1, 1000);
    light1.position.set(panelSize/2, 50, panelSize/2);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 1, 1000);
    light2.position.set(panelSize/2, 50, -panelSize/2);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xffffff, 1, 1000);
    light3.position.set(-panelSize/2, 50, -panelSize/2);
    scene.add(light3);

    const light4 = new THREE.PointLight(0xffffff, 1, 1000);
    light4.position.set(-panelSize/2, 50, panelSize/2);
    scene.add(light4);
}

export function drawLines(scene, panelSize){
    const redGeometry = new THREE.BufferGeometry();
    const greenGeometry = new THREE.BufferGeometry();

    const greenArray = new Float32Array([
      panelSize/4, -1, 0,
      -panelSize/2, -1, 0,
    ]);
    const redArray = new Float32Array([
       panelSize/4, -1, -panelSize/2,
       panelSize/4, -1, panelSize/2,
    ]);

    redGeometry.setAttribute('position', new THREE.BufferAttribute(redArray, 3));
    greenGeometry.setAttribute('position', new THREE.BufferAttribute(greenArray, 3));


    const redMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000
    });
    const greenMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00
    });
    const redLine = new THREE.Line(redGeometry, redMaterial);
    const greenLine = new THREE.Line(greenGeometry, greenMaterial);
    scene.add(redLine);
    scene.add(greenLine);

}

export function updateTextTexture(text, size, mesh,x,y,z) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  var fontSize=size;
  if(text.length==3)
    fontSize=parseInt(fontSize*2/3);
  else if(text.length==1)
    fontSize=parseInt(fontSize*3/2);

  ctx.font = fontSize + 'px Arial';
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth;
  canvas.height = fontSize;

  ctx.font = fontSize + 'px Arial';
  ctx.fillStyle = "#bfbfbf";
  ctx.fillText(text, 0, fontSize);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  mesh.position.set(x,z+0.01,y/*-0.1*/);
  mesh.material.map = texture;
}