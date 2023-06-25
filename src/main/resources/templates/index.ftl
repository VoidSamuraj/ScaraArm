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
                    <img src="static/icon/menu.svg" alt="controll"/>
                </li>
            </ul>

            <ul>
                <li class="button first" id="manual" ><a></a><img class="icons" src="static/icon/controll.svg" alt="controll"/></li>
                <li class="button first"  id="loadFile"><a></a><img class="icons" src="static/icon/file.svg" alt="load"/></li>
                <li class="button first"  id="options"><a></a><img class="icons" src="static/icon/settings.svg" alt="options"/></li>
            </ul>

        </nav>
        <nav id="loadMenu">
            <ul>
                <li class="button menu-button" id="closeLoadIcon">
                    <img class="icons" src="static/icon/back.svg" alt="back"/>
                </li>
                <li class="button menu-button" >
                    <div class="upload-btn-wrapper">
                        <button id="fileBtn">Upload a file</button>
                    </div>
                    <input type="file" name="myfile" id="myfile"/>
                </li>
            </ul>
        </nav>
        <nav id="optionsMenu">
            <ul>
                <li class="button menu-button" id="closeOptionsIcon">
                    <img class="icons" src="static/icon/back.svg" alt="back"/>
                </li>
                <li class="button menu-button" id="switch">
                    <input id="toggle" class="toggle" type="checkbox" role="switch" name="toggle">
                    <label for="toggle" class="slot">
                        <span class="slot__label">Left</span>
                        <span class="slot__label">Right</span>
                    </label>
                </li>
            </ul>
        </nav>
        <script src="static/navigation.js"></script>
        <script type="module" src="static/display.js"></script>
        <script type="module" src="/static/three/build/three.module.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    </body>
</html>


