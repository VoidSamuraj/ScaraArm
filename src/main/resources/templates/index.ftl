<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <title>Scara Arm</title>
      <link rel="stylesheet" href="static/style.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"/>
      <link rel="stylesheet" href="static/alert.css">
   </head>
   <body>
      <div id="arm">
         <canvas id="myCanvas" ></canvas>
         <canvas id="pivot"></canvas>
      </div>
      <nav id="firstMenu">
         <ul>
            <li class="button first" id="menuIcon">
               <img src="static/icon/menu.svg" alt="controll">
            </li>
         </ul>
         <ul>
            <li class="button first" id="manual" ><a></a><img class="icons" src="static/icon/controll.svg" alt="controll"></li>
            <li class="button first"  id="loadFile"><a></a><img class="icons" src="static/icon/file.svg" alt="load"></li>
            <li class="button first"  id="options"><a></a><img class="icons" src="static/icon/settings.svg" alt="options"></li>
         </ul>
      </nav>
      <nav id="portMenu">
         <ul>
            <li class="button menu-button" id="closePortMenuIcon">
               <img class="icons" src="static/icon/back.svg" alt="back">
            </li>
            <li class="button menu-button" >
               <div class="upload-btn-wrapper">
                  <button id="portButton">Refresh Ports</button>
               </div>
            </li>
            <li id="tablePorts">
               <table>
                  <thead>
                     <tr>
                        <th>Port</th>
                     </tr>
                  </thead>
                <hr>
                  <div class="scroll-list">
                    <tbody class="radioList"></tbody>
                  </div>
               </table>
            </li>
            <hr style="margin: 5px 0px;">
            <li class="center-text">
               Move precision
               <div class="precision-li">
                  <input id="precision-move" class="range precision-input" type="number" min="1">
                  <select id="precisionUnit" class="select-menu precision-select">
                     <option value="cm">cm</option>
                     <option value="mm">mm</option>
                     <option value="0.1mm">0.1mm</option>
                  </select>
               </div>
            </li>
            <li class="center-text">
               Rotation precision
               <div class="precision-li">
                  <input id="precision-rotate" class="range precision-input" type="number" min="1">
                  <select id="precisionUnitDegree" class="select-menu precision-select">
                     <option value="0.1">&#8530;°</option>
                     <option value="1">1°</option>
                     <option value="10">10°</option>
                  </select>
               </div>
            </li>
         </ul>
      </nav>
      <nav id="loadMenu">
         <ul>
            <li class="button menu-button" id="closeLoadIcon">
               <img class="icons" src="static/icon/back.svg" alt="back">
            </li>
            <li class="button menu-button" >
               <div class="upload-btn-wrapper">
                  <button id="fileBtn">Upload a file</button>
               </div>
               <input type="file" name="myfile" id="myfile">
            </li>
            <div class="scroll-list">
                <li id="tableFiles">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
                </li>
            </div>
         </ul>
      </nav>
      <nav id="optionsMenu">
         <ul>
            <li class="button menu-button" id="closeOptionsIcon">
               <img class="icons" src="static/icon/back.svg" alt="back">
            </li>
            <hr>
            <div class="scroll-list">
                <li class="button menu-button" id="switch">
                    <input id="toggle" class="toggle" type="checkbox" role="switch" name="toggle"">
                    <label for="toggle" class="slot">
                    <span class="slot__label">Left</span>
                    <span class="slot__label">Right</span>
                    </label>
                </li>
                <li title="Stepper motor microstepping." class="button button-no-hover menu-button menu-button-no-hover">
                    <select id="mode" class="select-menu">
                    </select>
                    <label for="mode" class="slot">
                        <span class="slot__label">Stepper Mode</span>
                    </label>
                </li>
                <li title="Max speed of robotic arm in mm/s." class="button button-no-hover menu-button menu-button-no-hover">
                    <input id="speed" class="range" type="number" min="1">
                    <label for="speed" class="slot">
                        <span class="slot__label">Max speed</span>
                    </label>
                </li>
                <li title="Length of arm closer to base." class="button button-no-hover menu-button menu-button-no-hover">
                <input id="arm1Length" class="range" type="number" min="3" max="8" >
                <label for="arm1Length" class="slot">
                <span class="slot__label">Arm 1 length</span>
                </label>
                </li>
                <li title="Length of arm closer to tool." class="button button-no-hover menu-button menu-button-no-hover">
                <input id="arm2Length" class="range" type="number" min="3" max="8">
                <label for="arm2Length" class="slot">
                <span class="slot__label">Arm 2 length</span>
                </label>
                </li>
                <li title="This is distance between tool center and arm 2 end" class="button button-no-hover menu-button menu-button-no-hover">
                <input id="toolDistance" class="range" type="number" min="0.5" max="3">
                <label for="toolDistance" class="slot">
                <span class="slot__label" >Tool distance</span>
                </label>
                </li>
                <hr>
                <li title="This is gear ratio for arm 1" class="button button-no-hover menu-button menu-button-no-hover">
                <input id="arm1Ratio" class="range" type="number" min="0">
                <label for="arm1Ratio" class="slot">
                <span class="slot__label" >Arm 1 ratio</span>
                </label>
                </li>
                <li title="This is gear ratio for arm 2" class="button button-no-hover menu-button menu-button-no-hover">
                <input id="arm2Ratio" class="range" type="number" min="0">
                <label for="arm2Ratio" class="slot">
                <span class="slot__label" >Arm 2 ratio</span>
                </label>
                </li>
                <li title="This is additional gear ratio, needed when motor for arm 2 is not fixed to arm 1. In other case specify 0." 
                class="button button-no-hover menu-button menu-button-no-hover">
                <input id="armAdditionalRatio" class="range" type="number" min="0">
                <label for="armAdditionalRatio" class="slot">
                <span class="slot__label" >Extra ratio</span>
                </label>
                </li>
            </div>
            <hr>
            <div id="actions">
            <li class="button menu-button button-no-hover menu-button-no-hover">
                  <div class="upload-btn-wrapper" id="save-load-options">
                     <button id="save">Save</button>
                     <button id="load">Load</button>
                  </div>
               </li>
               <li class="button menu-button">
                  <div class="upload-btn-wrapper">
                     <button id="logout">Logout</button>
                  </div>
               </li>
               <li class="button menu-button">
                  <div class="upload-btn-wrapper">
                     <button id="deleteAccount">Delete Account</button>
                  </div>
               </li>
            </div>
         </ul>
      </nav>
      <nav id="saveMenu">
         <ul>
            <li class="button menu-button" id="closeSavedIcon">
               <img class="icons" src="static/icon/back.svg" alt="back">
            </li>
            <li id="tableSavedOptions">
               <table>
                  <thead>
                     <tr>
                        <th>Load</th>
                     </tr>
                  </thead>
                
                  <div class="scroll-list"><hr>
                    <tbody class="radioList"></tbody>
                  </div>
               </table>
            </li>
         </ul>
      </nav>
      <div id="positionBox" class="topBox">
         <p id="positionText">X=1000 Y=1000</p>
      </div>
      <div id="startBox" class="topBox">
        <div id="startButtonBox" class="buttonOverlay">
            <button id="startButton" class="printButton">Start</button>
        </div>
        <div id="pauseButtonBox" class="buttonOverlay">
            <button id="pauseButton" class="printButton">Pause</button>
        </div>
        <div id="stopButtonBox" class="buttonOverlay">
            <button id="stopButton" class="printButton">Stop</button>
        </div>
      </div>
      <div id="overlay"></div>
       <div class="alert hide" id="alert">
               <img src="static/icon/circle-info-solid.svg" alt="info">
         <span id="alert-msg">Warning: This is a warning alert!</span>
         <div class="close-btn" id="alert-close">
            <img src="static/icon/xmark-solid.svg" alt="close">
         </div>
      </div>
      <div id="popup">
         <h1>Session Expire Warning</h1>
         <p id="expireInfo">Your session will expire in 5 minutes</p>
         <button id="extendButton">Extend session</button>
      </div>
      <script type="module" src="static/display.js"></script>
      <script type="module" src="/static/three/build/three.module.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script type="module" src="static/navigation.js"></script>
      <script>
          const expirationText = "${expiration}";
          const lifeText = "${lifeTime}";
         
          var byInterval=false;
          var expirationTime=parseInt(expirationText.replace(/\s+/g, "").replace(/,/g, ""));
          const lifeTime=parseInt(lifeText.replace(/\s+/g, "").replace(/,/g, ""))*1000;
         
          function check(){
              let currentTime = Date.now();
              if (currentTime >= expirationTime) {
                  location.reload(true);
              } else if((expirationTime-currentTime)<300000 && (expirationTime-currentTime)>0){
                  document.getElementById("expireInfo").innerHTML="Your session will expire in "+Math.ceil((expirationTime-currentTime) / 60000)+" minutes";
                  document.getElementById("overlay").style.display='block';
                  document.getElementById("popup").style.display='block';
                  byInterval = true;
              }
          }
          document.getElementById("overlay").addEventListener('click', extend );
          document.getElementById("extendButton").addEventListener('click', extend );
          function extend(){
              let xhr = new XMLHttpRequest();
              xhr.open('POST', '/user/refresh-token-expiration');
         
              xhr.onload = function() {
                  if (xhr.status === 200) {
                      expirationTime=Date.now()+lifeTime;
                  }
                  if(byInterval){
                     document.getElementById("overlay").style.display='none';
                     byInterval=false;
                  }
                  document.getElementById("popup").style.display='none';
              };
              xhr.send();
          }
          <#if expiration?has_content>
          check();
          setInterval(check, 60000);
          </#if>
      </script>
   </body>
</html>
