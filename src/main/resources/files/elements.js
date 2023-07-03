import * as THREE from '/static/three/build/three.module.js'


const stlGroup = new THREE.Group();

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
    ringMesh.geometry = new THREE.RingGeometry(min, max, 30, 1, 0, degree * Math.PI / 180);
    ringMesh.material = new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide });
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

  //dystans( najbliższy dystans)
export function getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,Lr,Sr){
    let a1=(90+MAX_ARM1_ANGLE)* Math.PI / 180;
    let a2=(MAX_ARM2_ANGLE)* Math.PI / 180;
    return Math.sqrt((Lr * Lr) + (Sr * Sr) - (2 * Lr * Sr * Math.cos(a1 + a2)))
}
export function getArmRange(scene,panelSize, Lr, Sr, MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,rightSide) {

    distance=getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,Lr,Sr);

    let a1=(90+MAX_ARM1_ANGLE)* Math.PI / 180;
    let a2=(MAX_ARM2_ANGLE)* Math.PI / 180;
    var distance = Math.sqrt((Lr * Lr) + (Sr * Sr) - (2 * Lr * Sr * Math.cos(a1 + a2)))


  const scale=50;

    // main arc
  const canvas1 = document.createElement('canvas');
  const context1 = canvas1.getContext('2d');
  canvas1.width = panelSize*scale;
  canvas1.height = panelSize*scale;
  const texture1 = new THREE.Texture(canvas1);
  texture1.needsUpdate = true;


    context1.beginPath();
    context1.arc((panelSize/2)*scale, (panelSize/2)*scale, ((Lr+Sr-distance)/2+distance)*scale, 0, MAX_ARM1_ANGLE*2 * Math.PI / 180);
    context1.lineWidth = (Lr+Sr-distance)*scale;
    context1.strokeStyle = '#ff0000';
    context1.stroke();

    //part to cut
  const canvas2 = document.createElement('canvas');
  const context2 = canvas2.getContext('2d');
  canvas2.width = panelSize*scale;
  canvas2.height = panelSize*scale;
  const texture2 = new THREE.Texture(canvas2);
  texture2.needsUpdate = true;

   context2.beginPath();
    context2.lineWidth = Sr*scale;
    context2.strokeStyle = '#ff0000';
    context2.arc((panelSize/2+Lr)*scale, panelSize/2*scale, Sr/2*scale,0, 2*Math.PI);
    context2.stroke();

  const canvas3 = document.createElement('canvas');
  const context3 = canvas3.getContext('2d');
  canvas3.width = panelSize*scale;
  canvas3.height = panelSize*scale;
  const texture3 = new THREE.Texture(canvas3);
  texture3.needsUpdate = true;

   //draw round end
        context3.strokeStyle = '#ff0000';
        context3.beginPath();
        context3.lineWidth = Sr*scale;
        var xp1=Lr;
        var yp1=0;
        var angle=MAX_ARM1_ANGLE*Math.PI/90;
        var x1=(xp1*Math.cos(angle)-yp1*Math.sin(angle)+panelSize/2)*scale;
        var y1=(xp1*Math.sin(angle)+yp1*Math.cos(angle)+panelSize/2)*scale;

        context3.arc(x1, y1, Sr/2*scale,0, 2*Math.PI );
        context3.stroke();

//canvas to reverse and cut from canvas 3
  const canvas4 = document.createElement('canvas');
  const context4 = canvas4.getContext('2d');
  canvas4.width = panelSize*scale;
  canvas4.height = panelSize*scale;
  const texture4 = new THREE.Texture(canvas4);
  texture4.needsUpdate = true;
        context4.beginPath();
        context4.arc((panelSize/2)*scale, (panelSize/2)*scale, ((Lr+Sr-distance)/2+distance)*scale, 0, 2 * Math.PI);
        context4.lineWidth = (Lr+Sr-distance)*scale;
        context4.strokeStyle = '#ff0000';
        context4.stroke();

    context3.globalCompositeOperation = 'destination-in';
    context3.drawImage(canvas4, 0, 0);
    context3.globalCompositeOperation = 'source-over';

    context1.beginPath();
    context1.arc((panelSize/2)*scale, (panelSize/2)*scale, ((Lr+Sr-distance)/2+distance)*scale, 0, MAX_ARM1_ANGLE*2 * Math.PI / 180);
    context1.lineWidth = (Lr+Sr-distance)*scale;
    context1.strokeStyle = '#ff0000';
    context1.stroke();



    //cut canvas 2 from canvas 1
    context1.globalCompositeOperation = 'destination-out';
    context1.drawImage(canvas2, 0, 0);
    context1.globalCompositeOperation = 'source-over';
    context1.drawImage(canvas3, 0, 0);

        //fill gap after canvas 3 remove
    context1.beginPath();
    context1.arc((panelSize/2)*scale, (panelSize/2)*scale, ((Lr+Sr-distance)/2+distance)*scale, (MAX_ARM1_ANGLE - 40)*2 * Math.PI / 180,MAX_ARM1_ANGLE*2 * Math.PI / 180 );
    context1.lineWidth = (Lr+Sr-distance)*scale;
    context1.stroke();


    //change opacity of canvas
    var imageData = context1.getImageData(0, 0, canvas1.width, canvas1.height);
    var data = imageData.data;

    var alpha = 0.5;


    for (var i = 0; i < data.length; i += 4) {
        //{R,G,B,A}
      data[i + 3] = alpha * data[i + 3]; //alpha
    }

    context1.putImageData(imageData, 0, 0);

    const geometry = new THREE.PlaneGeometry(panelSize, panelSize);
    const material = new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, depthTest: true, wireframe: false});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.map = texture1;
    mesh.rotateX(-Math.PI/2);

    drawFile(scene);

if(rightSide)
  mesh.rotateZ(MAX_ARM1_ANGLE*Math.PI/180-Math.PI);
else{
    mesh.rotateZ(-MAX_ARM1_ANGLE*Math.PI/180-Math.PI);
    mesh.scale.y = -1;
}
  mesh.position.set(panelSize/4, -0.97,0);

return mesh;
}

export function drawFile(scene,fileName){
    stlGroup.clear();
    scene.add(stlGroup);
    var totalAngle=-Math.PI/4;
    var changedPos=false;
    var points = [];

    var xPos=0;
    var yPos=0;
    var zPos=0;
    var changedSomething=false;
    const scale=0.1;

    if(fileName!=null && typeof fileName !== 'undefined' && fileName!=""){
    fetch('/files/'+fileName, { method: 'GET' })
      .then(response => response.blob())
      .then(blob => {

        var reader = new FileReader();
        reader.onload = function() {
            var fileData = reader.result;
            var lines = fileData.split('\n');
            lines.forEach(line => {
                if((!line.includes(';')) && line.includes("G1")){
                    let commands=line.split(' ');
                    changedSomething=false;
                    commands.forEach(command=>{
                        var firstCharacter = command.charAt(0);
                        switch (firstCharacter) {
                          case "X":
                                xPos=parseFloat(command.slice(1))*scale;
                                changedSomething=true;
                                changedPos=true;
                            break;
                          case "Y":
                                yPos=parseFloat(command.slice(1))*scale;
                                changedSomething=true;
                                changedPos=true;
                            break;
                          case "Z":
                                zPos=parseFloat(command.slice(1))*scale;
                                changedSomething=true;
                            break;
                          default:
                            break;
                        }

                    });
                    if(changedSomething){
                    console.log("x"+xPos+" y"+yPos);
                    if(changedPos)
                        points.push(new THREE.Vector3(xPos, yPos, zPos));
                    }
                }

            });

            for(var i=0;i<points.length-1; i++){
                totalAngle+=draw3DLine(stlGroup,points[i],points[i+1],0.01,totalAngle);
            }

        };
        reader.readAsText(blob); // Ustawienie formatu odczytu bloba (tekst)

      })
      .catch(error => {
        console.error('Wystąpił błąd:', error);
      });
    stlGroup.rotateX(-Math.PI/2);
    }
}

function draw3DLine(group,startPoint,endPoint,lineWidth,totalAngle){

   var direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    var world= new THREE.Vector3(0, 0, 0);
    var height = direction.length();

    var geometry = new THREE.CylinderGeometry(lineWidth, lineWidth, height, 6);
    //var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
              const shadowMaterial = new THREE.MeshStandardMaterial({
                                           color: 0x00ff00,
                                           roughness: 0.8, // zmniejszenie roughness
                                           lightMapIntensity: 0.8, // zwiększenie lightMapIntensity
                                         });
    var cylinder = new THREE.Mesh(geometry, shadowMaterial);
    var angle =startPoint.angleTo(endPoint);
    angle=Math.atan2( endPoint.x - startPoint.x,endPoint.y - startPoint.y);
    cylinder.rotateZ(angle);
    cylinder.position.copy(startPoint.clone().add(direction.multiplyScalar(0.5)));


group.add(cylinder);
return angle;
}
