<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Scara Arm</title>
        <link rel="stylesheet" href="static/style.css">
    </head>
    <body>
        <div id="auth">
            <form action="/login" method="post">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" maxlength="20" required>

                <label for="password">Password:</label>
                <input type="password" id="password" name="password" maxlength="20" required>
                <div>
                    <button type="submit" formaction="/login">Login</button>
                    <button type="submit" formaction="/register">Register</button>
                </div>
            </form>
        </div>
        <script>
            <#if message?has_content>
                alert("${message}");
            </#if>
        </script>
    </body>
</html>


