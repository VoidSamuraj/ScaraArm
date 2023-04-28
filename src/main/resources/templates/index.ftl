<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Scara Arm</title>
</head>
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
</html>