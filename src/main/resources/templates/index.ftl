<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Scara Arm</title>
        <link rel="stylesheet" href="static/style.css">
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
                <li class="button menu-button" id="closePortIcon">
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
                        <tbody class="radioList"></tbody>
                    </table>
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
                        <tbody></tbody>
                    </table>
                </li>
            </ul>
        </nav>
    <nav id="optionsMenu">
            <ul>
                <li class="button menu-button" id="closeOptionsIcon">
                    <img class="icons" src="static/icon/back.svg" alt="back">
                </li>
                <li class="button menu-button" id="switch">
                    <input id="toggle" class="toggle" type="checkbox" role="switch" name="toggle"">
                    <label for="toggle" class="slot">
                        <span class="slot__label">Left</span>
                        <span class="slot__label">Right</span>
                    </label>
                </li>
                <li class="button button-no-hover menu-button menu-button-no-hover">
                    <select id="ports" >
                      <option value="opcja1">Opcja 1</option>
                      <option value="opcja2">Opcja 2</option>
                      <option value="opcja3">Opcja 3</option>
                    </select>
                </li>
                    <li class="button button-no-hover menu-button menu-button-no-hover">
                        <input id="arm1Length" class="range" type="number" min="3" max="8" >
                        <label for="arm1Length" class="slot">
                            <span class="slot__label">Arm 1 length</span>
                        </label>
                    </li>
                    <li class="button button-no-hover menu-button menu-button-no-hover">
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
                <div id="actions">
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
        <div id="positionBox">
            <p id="positionText">X=1000 Y=1000</p>
        </div>

        <div id="overlay"></div>
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
           function onEditSize(event){
                        if(event.charCode==13)
                            alert("TEST");
                        return (event.charCode >= 48 && event.charCode <= 57) || event.key === '.' || event.key === ','
                    }
            const expirationText = "${expiration}";
            const lifeText = "${lifeTime}";

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
                    document.getElementById("overlay").style.display='none';
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


