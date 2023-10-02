import * as THREE from '/static/three/build/three.module.js'


var stlGroup = new THREE.Group();

export function createCircle(scene,x,y,z,size){
    var circleMesh = new THREE.Mesh(new THREE.CircleGeometry(size, 30), new THREE.MeshBasicMaterial({ color: 0x454545 }));
    circleMesh.rotateX(-Math.PI/2);
    circleMesh.position.set(x, z, y);
    scene.add(circleMesh);
    return circleMesh;
}

export function getRectangle(width,height,x,y,z){
    let rectangleMesh= new THREE.Mesh(new THREE.PlaneGeometry( width, height), new THREE.MeshBasicMaterial({ color: 0x454545 }));
     rectangleMesh.rotateY(-Math.PI/2);
     rectangleMesh.position.set(x, z, y);
     return rectangleMesh;
}

function getRectanglePercent(width,height,barWidth,percent,x,y,z){
     let rectangleMesh1= new THREE.Mesh(new THREE.PlaneGeometry( barWidth, height*percent/100), new THREE.MeshBasicMaterial({ color: 0xbfbfbf }));
     let rectangleMesh2= new THREE.Mesh(new THREE.PlaneGeometry( barWidth, height*percent/100), new THREE.MeshBasicMaterial({ color: 0xbfbfbf }));
     let rectangleMesh3= new THREE.Mesh(new THREE.PlaneGeometry( barWidth, height*percent/100), new THREE.MeshBasicMaterial({ color: 0xbfbfbf }));
     let rectangleMesh4= new THREE.Mesh(new THREE.PlaneGeometry( barWidth, height*percent/100), new THREE.MeshBasicMaterial({ color: 0xbfbfbf }));

     let spaceBetween=(width)/2;
     let heightOfBar=z-(height*(100-percent)/200);

     rectangleMesh1.rotateY(-Math.PI*3/4);
     rectangleMesh1.position.set(x, heightOfBar, y-spaceBetween);
     rectangleMesh2.rotateY(-Math.PI/4);
     rectangleMesh2.position.set(x, heightOfBar, y+spaceBetween);
     rectangleMesh3.rotateY(Math.PI*3/4);
     rectangleMesh3.position.set(x+0.775, heightOfBar, y-spaceBetween);
     rectangleMesh4.rotateY(Math.PI/4);
     rectangleMesh4.position.set(x+0.775, heightOfBar, y+spaceBetween);

     let group =new THREE.Group();
     group.add(rectangleMesh1);
     group.add(rectangleMesh2);
     group.add(rectangleMesh3);
     group.add(rectangleMesh4);
     return group;
}

export function updateRectanglePercent(scene,parentGroup,oldRectanglePercentGroup,width,height,barWidth,percent,x,y,z){
    if(oldRectanglePercentGroup!=null){
        parentGroup.remove(oldRectanglePercentGroup);
        scene.remove(oldRectanglePercentGroup);
        // Usuń wszystkie geometrie w grupie i zwolnij ich zasoby
        oldRectanglePercentGroup.children.forEach((mesh) => {
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
        });
    }
    if(percent!=0){
        let newGroup=getRectanglePercent(width,height,barWidth,percent,x,y,z);
        scene.add(newGroup);
        parentGroup.add(newGroup);
        return newGroup;
    }
    return null;
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

    //panel under grid
    const backgroundPlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(panelSize, panelSize),
            new THREE.MeshBasicMaterial({ color: 0x454545, side: THREE.DoubleSide})
        );

    backgroundPlane.position.set(x, z-0.01, y);
    backgroundPlane.rotation.x=90 * Math.PI / 180;
    scene.add(backgroundPlane);
}

export function addLight(scene,panelSize){

    const light1 = new THREE.PointLight(0xffffff, 0.6, 1000);
    light1.position.set(panelSize/2, 50, panelSize/2);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 0.6, 1000);
    light2.position.set(panelSize/2, 50, -panelSize/2);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xffffff, 0.6, 1000);
    light3.position.set(-panelSize/2, 50, -panelSize/2);
    scene.add(light3);

    const light4 = new THREE.PointLight(0xffffff, 0.6, 1000);
    light4.position.set(-panelSize/2, 50, panelSize/2);
    scene.add(light4);
}

export function drawLines(scene, panelSize,armShift){
    const redGeometry = new THREE.BufferGeometry();
    const greenGeometry = new THREE.BufferGeometry();

    const greenArray = new Float32Array([
        armShift, -1, 0,
        -panelSize/2, -1, 0,
    ]);
    const redArray = new Float32Array([
        armShift, -1, -panelSize/2,
        armShift, -1, panelSize/2,
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

//closest distance of tool to center(arm1 rotation point)
export function getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,arm1Length,arm2Length){

    let a1=(90+MAX_ARM1_ANGLE)* Math.PI / 180;
    let a2=(MAX_ARM2_ANGLE)* Math.PI / 180;

    let x = arm1Length * Math.cos(a1) + arm2Length * Math.cos(a1 + a2);
    let y = arm1Length * Math.sin(a1) + arm2Length * Math.sin(a1 + a2);

    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}
export function drawArmRange(scene,panelSize,armShift, arm1Length, arm2Length, MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,MAX_ARM1_ANGLE_COLLISION,rightSide) {

    let distance=getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,arm1Length,arm2Length);
    let scale=50;
    let lineWidth=(arm1Length+arm2Length-distance)*scale;
    let lineCenter=((arm1Length+arm2Length-distance)/2+distance)*scale;

    // main arc
    const canvasMainArc = document.createElement('canvas');
    const contextMainArc = canvasMainArc.getContext('2d');
    canvasMainArc.width = panelSize*scale;
    canvasMainArc.height = panelSize*scale;
    const textureMainArc = new THREE.Texture(canvasMainArc);
    textureMainArc.needsUpdate = true;

    contextMainArc.beginPath();
    contextMainArc.arc((panelSize/2)*scale, (panelSize/2)*scale, lineCenter, 0, (MAX_ARM1_ANGLE+MAX_ARM1_ANGLE_COLLISION) * Math.PI / 180);
    contextMainArc.lineWidth = lineWidth;
    contextMainArc.strokeStyle = '#ff0000';
    contextMainArc.stroke();

    //part to cut
    const canvasToCut = document.createElement('canvas');
    const contextToCut = canvasToCut.getContext('2d');
    canvasToCut.width = panelSize*scale;
    canvasToCut.height = panelSize*scale;
    const textureToCut = new THREE.Texture(canvasToCut);
    textureToCut.needsUpdate = true;

    contextToCut.beginPath();
    contextToCut.lineWidth = scale;
    contextToCut.fillStyle = '#ff0000';
    contextToCut.arc((panelSize/2+arm1Length)*scale, panelSize/2*scale, arm2Length*scale,0, 2*Math.PI);
    contextToCut.closePath()
    contextToCut.fill();
    
    //draw round end
    const canvasRoundEnd = document.createElement('canvas');
    const contextRoundEnd = canvasRoundEnd.getContext('2d');
    canvasRoundEnd.width = panelSize*scale;
    canvasRoundEnd.height = panelSize*scale;
    const textureRoundEnd = new THREE.Texture(canvasRoundEnd);
    textureRoundEnd.needsUpdate = true;

    contextRoundEnd.fillStyle = '#ff0000';
    contextRoundEnd.beginPath();
    contextRoundEnd.lineWidth = scale;
    var xp1=arm1Length;
    var yp1=0;
    var angle=(MAX_ARM1_ANGLE+MAX_ARM1_ANGLE_COLLISION)*Math.PI/180;
    var x1=(arm1Length*Math.cos(angle)-yp1*Math.sin(angle)+panelSize/2)*scale;
    var y1=(arm1Length*Math.sin(angle)+yp1*Math.cos(angle)+panelSize/2)*scale;

    contextRoundEnd.arc(x1, y1, arm2Length*scale,0, 2*Math.PI );
    contextRoundEnd.closePath()
    contextRoundEnd.fill();


    //canvas to reverse and cut from canvasRoundEnd

    const canvasReverseCut = document.createElement('canvas');
    const contextReverseCut = canvasReverseCut.getContext('2d');
    canvasReverseCut.width = panelSize*scale;
    canvasReverseCut.height = panelSize*scale;
    const textureReverseCut = new THREE.Texture(canvasReverseCut);
    textureReverseCut.needsUpdate = true;
    contextReverseCut.beginPath();
    contextReverseCut.arc((panelSize/2)*scale, (panelSize/2)*scale, lineCenter, 0, 2 * Math.PI);
    contextReverseCut.lineWidth = lineWidth;
    contextReverseCut.strokeStyle = '#ff0000';
    contextReverseCut.stroke();

    contextRoundEnd.globalCompositeOperation = 'destination-in';
    contextRoundEnd.drawImage(canvasReverseCut, 0, 0);
    contextRoundEnd.globalCompositeOperation = 'source-over';
/*
    contextMainArc.beginPath();
    contextMainArc.arc((panelSize/2)*scale, (panelSize/2)*scale, lineCenter, 0, MAX_ARM1_ANGLE*2 * Math.PI / 180);
    contextMainArc.lineWidth = lineWidth;
    contextMainArc.strokeStyle = '#ff0000';
    contextMainArc.stroke();
*/

    contextMainArc.drawImage(canvasRoundEnd, 0, 0);
    //cut canvasToCut from mainCanvas
    contextMainArc.globalCompositeOperation = 'destination-out';
    contextMainArc.drawImage(canvasToCut, 0, 0);
    contextMainArc.globalCompositeOperation = 'source-over';



    //fill gap after contextReverseCut remove
    /*
    contextMainArc.beginPath();
    contextMainArc.arc((panelSize/2)*scale, (panelSize/2)*scale, lineCenter, (MAX_ARM1_ANGLE - 40)*2 * Math.PI / 180,MAX_ARM1_ANGLE*2 * Math.PI / 180 );
    contextMainArc.lineWidth = lineWidth;
   contextMainArc.stroke();
*/

    //change opacity of canvas
    var imageData = contextMainArc.getImageData(0, 0, canvasMainArc.width, canvasMainArc.height);
    var data = imageData.data;

    var alpha = 0.5;


    for (var i = 0; i < data.length; i += 4) {
        //{R,G,B,A}
        data[i + 3] = alpha * data[i + 3]; //alpha
    }

    contextMainArc.putImageData(imageData, 0, 0);

    const geometry = new THREE.PlaneGeometry(panelSize, panelSize);
    const material = new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, depthTest: true, wireframe: false});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.map = textureMainArc;
    mesh.rotateX(-Math.PI/2);

    if(rightSide)
        mesh.rotateZ(MAX_ARM1_ANGLE*Math.PI/180-Math.PI);
    else{
        mesh.rotateZ(-MAX_ARM1_ANGLE*Math.PI/180-Math.PI);
        mesh.scale.y = -1;
    }
    mesh.position.set(armShift, -0.97,0);

    return mesh;
}

export function drawFile(scene,fileName,onLineRead,xShift,isRightSide){
    const data = {isRightSide: ''+isRightSide};
    const params = new URLSearchParams();
    for (const key in data) {
      params.append(key, data[key]);
    }
         fetch("/files/draw/"+fileName, {method: "POST",body: params}).then(response => {
                  if (response.ok) {
                    console.log("File is processing.");
                  } else {
                    console.error("ERROR during file process. "+response);
                  }
                })
                .catch(error => {
                  console.error("ERROR occurred:", error);
                });

    var lastHeight=0;
    var currentHeight=0;
    var firstHeightSet=false;
    var secondHeightSet=false;
    stlGroup.clear();
    scene.remove(stlGroup);
    stlGroup = new THREE.Group();

    if(isRightSide){
        stlGroup.rotateX(-Math.PI/2);
        stlGroup.rotateZ(Math.PI/2);
        stlGroup.translateY(-xShift);
    }else{
        stlGroup.rotateX(-Math.PI/2);
        stlGroup.rotateZ(Math.PI);
        stlGroup.translateX(-xShift);
    }
    stlGroup.translateZ(-1);

    scene.add(stlGroup);
    var totalAngle=0;
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
                                    break;
                                case "Y":
                                    yPos=parseFloat(command.slice(1))*scale;
                                    changedSomething=true;
                                    break;
                                case "Z":
                                    zPos=parseFloat(command.slice(1))*scale;
                                    changedSomething=true;
                                    if(!firstHeightSet){
                                        currentHeight=zPos;
                                        firstHeightSet=true;
                                    }
                                    if(firstHeightSet && !secondHeightSet && zPos!=currentHeight){
                                        currentHeight=currentHeight-(zPos*0.5);
                                        secondHeightSet=true;
                                    }
                                    break;
                                default:
                                    break;
                            }

                        });
                        if(changedSomething){
                            points.push(new THREE.Vector3(xPos, yPos, zPos));
                        }
                    }

                });

                if((points[0] !== undefined)&&!(firstHeightSet&&firstHeightSet))
                    currentHeight=points[0].z- 0.1;
                for(var i = 0; i < points.length - 1; i++) {
                    (function(index) {
                        setTimeout(function() {
                            onLineRead(points[index + 1],isRightSide);
                            if(currentHeight!=points[index + 1].z){
                                lastHeight=currentHeight;

                            }
                            currentHeight=points[index + 1].z;
                            console.log("POS "+points[index + 1].x+" "+points[index + 1].y+" "+points[index + 1].z);
                            draw3DLine(stlGroup,points[index],points[index+1],currentHeight-lastHeight);
                        }, 500 * index);
                    })(i);
                }

            };
            reader.readAsText(blob);

        })
                .catch(error => {
                    console.error('Error:', error);
        });
    }
}

function draw3DLine(group,startPoint,endPoint,lineWidth){
    var direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    var distance = direction.length();


    var path = new THREE.LineCurve3(startPoint, endPoint);
    var geometry = new THREE.TubeGeometry(path, 16, lineWidth, 6, true);

    var shadowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        roughness: 0.8,
        lightMapIntensity: 0.8,
    });
    var tubeMesh = new THREE.Mesh(geometry, shadowMaterial);

    group.add(tubeMesh);
}
