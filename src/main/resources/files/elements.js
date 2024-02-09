import * as THREE from '/static/three/build/three.module.js'

// Functions to draw elements on scene

var stlGroup = new THREE.Group();

/**
 * Create circle and adds it to scene.
 * @param {number} size - circle size.
 * @param {number} x - x coordinates.
 * @param {number} y - y coordinates.
 * @param {number} z - z coordinates.
 * @param {THREE.Scene} scene - scene witch will contain circle.
 * @returns {THREE.Mesh} - mesh representing circle.
 */
export function createCircle(scene,x,y,z,size){
    var circleMesh = new THREE.Mesh(new THREE.CircleGeometry(size, 30), new THREE.MeshBasicMaterial({ color: 0x454545 }));
    circleMesh.rotateX(-Math.PI/2);
    circleMesh.position.set(x, z, y);
    scene.add(circleMesh);
    return circleMesh;
}

/**
 * Create rectangle and adds it to scene.
 * @param {number} width - width of rectangle.
 * @param {number} height - height of rectangle.
 * @param {number} x - x coordinates.
 * @param {number} y - y coordinates.
 * @param {number} z - z coordinates.
 * @returns {THREE.Mesh} - mesh representing recrangle.
 */
export function getRectangle(width,height,x,y,z){
    let rectangleMesh= new THREE.Mesh(new THREE.PlaneGeometry( width, height), new THREE.MeshBasicMaterial({ color: 0x454545 }));
     rectangleMesh.rotateY(-Math.PI/2);
     rectangleMesh.position.set(x, z, y);
     return rectangleMesh;
}
/**
 * Function to create 4 bars representing percentage, bars are located like:
 * ```plaintext
 *           width
 *  |-----------------------|  
 *                             _ _
 *    /                   \     |   bar width     
 *   /                     \   _|_
 * 
 * 
 *   \                     /
 *    \                   /
 * ```
 * @param {number} width - distance between bars in one axis, for second axis this is hardcoded 
 * @param {number} height - max height of bar
 * @param {number} barWidth - width of bar
 * @param {number} percent - percent of bar, this will calculate displayed height
 * @param {number} x - x pos of whole element
 * @param {number} y - y pos of whole element 
 * @param {number} z - z pos of whole element 
 * @returns {THREE.Group}- group containing all elements (bars)
 */
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

/**
 * Function to update percentage Bars, to Init bars use: **getRectanglePercent**. 
 * Old bars are replaced by new one. Bars are located like:
 * ```plaintext
 *           width
 *  |-----------------------|  
 *                             _ _
 *    /                   \     |   bar width     
 *   /                     \   _|_
 * 
 * 
 *   \                     /
 *    \                   /
 * 
 * ```
 * @param {THREE.Scene} scene - scene containing bars
 * @param {THREE.Group} parentGroup - group containing **oldRectanglePercentGroup**
 * @param {THREE.Group} oldRectanglePercentGroup - old group returned by **getRectanglePercent**
 * @param {number} width - distance between bars in one axis, for second axis this is hardcoded 
 * @param {number} height - max height of bar
 * @param {number} barWidth - width of bar
 * @param {number} percent - percent of bar, this will calculate displayed height
 * @param {number} x - x pos of whole element
 * @param {number} y - y pos of whole element 
 * @param {number} z - z pos of whole element 
 * @see getRectanglePercent
 * @returns {THREE.Group|null} new group representing bars
 */
export function updateRectanglePercent(scene,parentGroup,oldRectanglePercentGroup,width,height,barWidth,percent,x,y,z){
    if(oldRectanglePercentGroup!=null){
        parentGroup.remove(oldRectanglePercentGroup);
        scene.remove(oldRectanglePercentGroup);
        // Remove all geometries and free resources
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

/**
 * Create ring or part of it on scene.
 * @param {THREE.Scene} scene - scene witch will contain ring.
 * @param {number} x - x pos of element
 * @param {number} y - y pos of element 
 * @param {number} z - z pos of element 
 * @param {number} innerRad - inner radius 
 * @param {number} outerRad - outer radius
 * @param {number} degree - degrees of ring
 * @returns 
 */
export function createRing(scene,x,y,z,innerRad,outerRad,degree){
    var ringMesh = new THREE.Mesh(new THREE.RingGeometry(innerRad, outerRad, 30, 1, 0, degree * Math.PI / 180), new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide }));
    ringMesh.rotateX(-Math.PI/2);
    ringMesh.rotateZ(-Math.PI);
    ringMesh.position.set(x, z, y);
    scene.add(ringMesh);
    return ringMesh;
}

/**
 * Replace ring mesh created by **createRing**
 * @param {THREE.Mesh} ringMesh - old mesh to replace
 * @param {number} innerRad - inner radius 
 * @param {number} outerRad - outer radius
 * @param {number} degree - degrees of ring
 * @see createRing
 */
export function updateRing(ringMesh,innerRad,outerRad,degree){
    ringMesh.geometry.dispose();
    ringMesh.geometry = new THREE.RingGeometry(innerRad, outerRad, 30, 1, 0, degree * Math.PI / 180);
    ringMesh.material = new THREE.MeshBasicMaterial({ color: 0xbfbfbf, side: THREE.DoubleSide });
}

/**
 * Create a grid and panel under it, which will be used as a work area for the arm.
 * @param {THREE.Scene} scene - scene witch will contain grid.
 * @param {number} panelSize - x and y width of panel
 * @param {number} x - x pos of element
 * @param {number} y - y pos of element 
 * @param {number} z - z pos of element 
 * @param {int} divisions - number of divisions(density of grid)
 */
export function addGrid(scene,panelSize,x,y,z,divisions){
    let grid1 = new THREE.GridHelper(panelSize, divisions, 0x777777, 0x777777);
    let grid2 = new THREE.GridHelper(panelSize, divisions/10, 0xffffff, 0xffffff);
    grid1.position.set(x,z,y);
    grid2.position.set(x,z,y);
    scene.add(grid1);
    scene.add(grid2);

    //panel under grid
    const backgroundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(panelSize, panelSize),
            new THREE.MeshBasicMaterial({ color: 0x454545, side: THREE.DoubleSide})
        );

    backgroundPlane.position.set(x, z-0.01, y);
    backgroundPlane.rotation.x=90 * Math.PI / 180;
    scene.add(backgroundPlane);
}

/**
 * Function will create 4 lights in corners of panel at height equal 50 
 * @param {THREE.Scene} scene - scene witch will contain lighting.
 * @param {number} panelSize - width of square panel
 */
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

/**
 * Function to draw lines corresponding to Cartesian directions.
 * @param {THREE.Scene} scene - scene witch will contain lines.
 * @param {number} panelSize - width of square panel
 * @param {number} armShift - shift of center of lines    
 */
export function drawCartesianLines(scene, panelSize,armShift){
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

/**
 * Function to update text displaying angles of arms
 * @param {string} text - degrees represented as string 
 * @param {number} fontSize - size of font
 * @param {THREE.Mesh} mesh - mesh on witch will be placed text
 * @param {number} x - x pos of element
 * @param {number} y - y pos of element 
 * @param {number} z - z pos of element 
 */
export function updateTextTexture(text, fontSize, mesh,x,y,z) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    var fSize=fontSize;
    if(text.length==3)
        fSize=parseInt(fSize*2/3);
    else if(text.length==1)
        fSize=parseInt(fSize*3/2);

    ctx.font = fSize + 'px Arial';
    const textWidth = ctx.measureText(text).width;
    canvas.width = textWidth;
    canvas.height = fSize;

    ctx.font = fSize + 'px Arial';
    ctx.fillStyle = "#bfbfbf";
    ctx.fillText(text, 0, fSize);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;


    mesh.position.set(x,z+0.01,y/*-0.1*/);
    mesh.material.map = texture;
}

/**
 * Function calculating min radius to center, witch can be accessed by tool. 
 * @param {number} MAX_ARM1_ANGLE - max possible angle of arm 1, it is the same for both directions
 * @param {number} MAX_ARM2_ANGLE - max possible angle of arm 2, it is the same for both directions
 * @param {number} arm1Length - length of arm 1
 * @param {number} arm2Length - length of arm 2
 * @returns {number} - min radius operatable by tool 
 */
export function getMinDistance(MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,arm1Length,arm2Length){

    let a1=(90+MAX_ARM1_ANGLE)* Math.PI / 180;
    let a2=(MAX_ARM2_ANGLE)* Math.PI / 180;

    let x = arm1Length * Math.cos(a1) + arm2Length * Math.cos(a1 + a2);
    let y = arm1Length * Math.sin(a1) + arm2Length * Math.sin(a1 + a2);

    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

/**
 * Function witch draw space avalible for tool based on **MAX_ARM1_ANGLE, MAX_ARM2_ANGLE, arm1Length, arm2Length**
 * @param {THREE.Scene} scene - scene witch will contain lines.
 * @param {number} panelSize - width of square panel
 * @param {number} armShift - shift from center
 * @param {number} arm1Length - length of arm 1
 * @param {number} arm2Length - length of arm 2
 * @param {number} MAX_ARM1_ANGLE - max possible angle of arm 1,s it is the same for both directions
 * @param {number} MAX_ARM2_ANGLE - max possible angle of arm 2, it is the same for both directions
 * @param {number} MAX_ARM1_ANGLE_COLLISION - max possible angle for arm 1 from other side, this is to prevent tool collision with arm base
 * @param {boolean} rightSide specifies orientation of arm 
 * @returns {THREE.Mesh} - mesh containing drawing
 */
export function drawArmRange(panelSize,armShift, arm1Length, arm2Length, MAX_ARM1_ANGLE,MAX_ARM2_ANGLE,MAX_ARM1_ANGLE_COLLISION,rightSide) {

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

    //corners of toolRange
    const canvasCorners = document.createElement('canvas');
    const contextCorners = canvasCorners.getContext('2d');
    canvasCorners.width = panelSize*scale;
    canvasCorners.height = panelSize*scale;
    const textureCorners = new THREE.Texture(canvasCorners);
    textureCorners.needsUpdate = true;
    contextCorners.drawImage(canvasRoundEnd, 0, 0);
    contextCorners.globalCompositeOperation = 'destination-out';
    contextCorners.drawImage(canvasMainArc, 0, 0);

    contextMainArc.drawImage(canvasRoundEnd, 0, 0);

    //cut canvasToCut from mainCanvas
    contextMainArc.globalCompositeOperation = 'destination-out';
    contextMainArc.drawImage(canvasToCut, 0, 0);
    contextMainArc.globalCompositeOperation = 'source-over';

    contextMainArc.drawImage(canvasCorners, 0, 0);

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

/**
 * Function to draw file on scene, it work like simulation of 3D printing, moving tool and placing 3d lines on visited route
 * @param {THREE.Scene} scene - scene witch will contain file.
 * @param {string} fileName - name of file to draw 
 * @param {callback(THEE.Vector,boolean)} onLineRead - function updating tool position in for displaying
 * @param {number} xShift - shift of model position
 * @param {boolean} isRightSide - specifies orientation of arm  
 * @TODO 1.display message in UI on file loading error
 *  2.Check if sending code to arm blocks UI/Server
 *  3.Synchronize arm code execution and Drawing state
 */
export function drawFile(scene,fileName,onLineRead,xShift,isRightSide){
    const data = {isRightSide: ''+isRightSide};
    const params = new URLSearchParams(data);

        //sending code to arm 
         fetch("/files/"+fileName+"/draw", {method: "POST",body: params}).then(response => {
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
    
    //draw file on the screen
    if(fileName!=null && typeof fileName !== 'undefined' && fileName!=""){
        fetch('/files/'+fileName, { method: 'GET' })
                .then(response => response.blob())
                .then(blob => {

                    var reader = new FileReader();
                reader.onload = function() {
                    var fileData = reader.result;
                    var lines = fileData.split('\n');
                    //push vector to array if position changed
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
                    //current height is used to calculate thickness of line, if not set then set as start point -0.1
                    if((points[0] !== undefined)&&!(firstHeightSet&&secondHeightSet))
                        currentHeight=points[0].z- 0.1;
                    for(var i = 0; i < points.length - 1; i++) {
                        (function(index) {
                            setTimeout(function() {
                                //update arm angles for UI
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
/**
 * Function to draw line of model from the code, being drawed on the screen and add it to group specified as argument.
 * @param {THREE.Group} group - group of object being drawn
 * @param {THREE.Vector3} startPoint - start point of line
 * @param {THREE.Vector3} endPoint - end point of line
 * @param {number} lineWidth - thickness of line
 */
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
