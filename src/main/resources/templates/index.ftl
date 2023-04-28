<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Scara Arm</title>
    <link rel="stylesheet" href="/static/index.css">
</head>
    <body >


      <!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
      <svg class="button" id="burger-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/>
      </svg>


    <nav>
        <ul>
            <li class="button" id="menu-button-icon">
              <!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
              <svg style="width: 40px;height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
              </svg>
            </li>
            <li class="button" id="menu-button"><a href="#">Manual control</a></li>
            <li class="button" id="menu-button"><a href="#">Load file</a></li>
        </ul>
    </nav>

    <script src="/static/index.js"></script>

    </body>
</html>



<!--
<body style="text-align: center; font-family: sans-serif">
    <h1>About me</h1>
        <p>Welcome to my static page!</p>
        <p>Feel free to take a look around.</p>
        <p>Or go to the <a href="/">main page</a>.</p>

        <#list files as file>
        <div>
            <h3>
                <a href="/file/${file.id}">${file.id}</a>
            </h3>
            <p>
                ${file.userId}
            </p>
            <img src="data:image/png;base64,${file.blobToBase64()}"/>
        </div>
        </#list>
        <hr>

    </body>
    -->
