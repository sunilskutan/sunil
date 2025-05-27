<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
	 <script src="cryptoUtils.js"></script>
 <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f2f5;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            background-color: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 300px;
            text-align: center;
        }
        .container h2 {
            margin-bottom: 1.5rem;
            color: #0056b3;
        }
        .container input {
            width: 94%;
            padding: 0.5rem;
            margin: 0.5rem 0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button.first {
            width: 100%;
            padding: 0.5rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        button.first:hover {
            background-color: #0056b3;
        }
    </style>
<script>
function checkFinancierData() {
        const financierData = localStorage.getItem('financierData');
        if (financierData === null) {
            const data = prompt("Enter financier data:");
            if (data !== null && data.trim() !== "") {
                localStorage.setItem('financierData', data);
                alert("Financier data saved.");
                return true;
            } else {
                alert("Financier data is required.");
                return false;
            }
        } else {
            return true;
        }
    }

    function isChromeBrowser() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return userAgent.includes('chrome') && !userAgent.includes('edg') && !userAgent.includes('opr') && !userAgent.includes('brave');
    }

    function formLoadCheck() {
        const mainPage = document.getElementById("mainPage");
        const mainHeading = document.getElementById("financierName");
        const financierData = localStorage.getItem('financierData');
        if (isChromeBrowser()) {
            mainPage.style.display = "none";
            if (checkFinancierData()) {
                mainHeading.innerHTML = financierData;
                mainPage.style.display = "block";
            }
        } else {
            mainPage.style.display = "none";
            alert("Open in Chrome Browser");
        }
    }


function trackUsage() {       

    const databaseName = 'webAppUsageDB';
    let db = JSON.parse(localStorage.getItem(databaseName)) || {};
    
    // Retrieve the current user from sessionStorage
    const currentUser = sessionStorage.getItem('currentUser');
    const now = new Date().toISOString();

    // Check if the user exists in the database
    if (!db[currentUser]) {
        // Create a new record for the new user
        db[currentUser] = {
            username: currentUser,
            startDateTime: now,
            stopDateTime: null,
            usageCount: 1
        };

        // Save the new record to local storage
        localStorage.setItem(databaseName, JSON.stringify(db));
	sessionStorage.setItem('menuItem', '00');
        // Redirect to change password page
        window.location.href = 'changePassword.jsp';
    } else {
        // User already exists, update the record
        const userData = db[currentUser];

        // Increment usage count and set the stopDateTime to null
        userData.usageCount += 1;
        userData.stopDateTime = null;  // Always null for ongoing sessions

        // Update the record in local storage
        db[currentUser] = userData;
        localStorage.setItem(databaseName, JSON.stringify(db));
	window.location.href = "staffMenuPage.jsp";
    }

    // Log the usage data for debugging purposes

}



</script>
</head>
<body onload="formLoadCheck()">



<div class="container" id="mainPage">

<p align="center">
            <font color="#003366" size="1">
                <span id="financierName" 
                      onmouseover="formLoadCheck()" 
                      style="font-family: 'Calibri', sans-serif; 
                             font-size: 13px; font-weight:normal;
                             background-color: lightblue; 
                             color: #fff; 
                             text-shadow: 0 0 5px #fff, 
                                          0 0 10px #007bff, 
                                          0 0 15px #007bff, 
                                          0 0 20px #007bff, 
                                          0 0 25px #007bff, 
                                          0 0 30px #007bff, 
                                          0 0 35px #007bff;">
                </span> 
            </font>
    </p>

    <h2>Login</h2>
    <form id="loginForm" method="post" onsubmit="submitForm(event)">
        <input type="text" id="username" name="username" placeholder="Login ID" required>
        <input type="password" id="password" name="password" placeholder="Password" required>
        <button type="submit" class="first">Login</button>
    </form>
</div>

<script>

    function submitForm(event) {
        event.preventDefault(); // Prevent the default form submission

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'loginUser.jsp', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = xhr.responseText.trim();
                if (response === "administrator") {
                    window.location.href = "adminMenuPage.jsp";
                } else if (response === "supervisor") {
                    window.location.href = "supervisorMenuPage.jsp";
                } else if (response === "staff") {			sessionStorage.setItem('currentUser', username); trackUsage(); 
                } else if (response === "EmptyTable") {
                    window.location.href = "addUser.jsp"; // Redirect to addUser.jsp if the table is empty
                } else {
                    alert("Invalid credentials");
                }
            } else {
                alert("An error occurred during the login process.");
            }
        };
        xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
    }
</script>


</body>
</html>
