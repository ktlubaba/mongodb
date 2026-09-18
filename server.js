const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");

const app = express();

const PORT = 3000;


// Middleware
app.use(express.json());


// Serve files from public folder
app.use(express.static(path.join(__dirname, "public")));


// File paths
const usersFile = path.join(__dirname, "users.json");
const auditFile = path.join(__dirname, "audit.log");


// --------------------------------------------------
// Helper function to read users
// --------------------------------------------------

function readUsers() {

    try {

        const data = fs.readFileSync(usersFile, "utf-8");

        return JSON.parse(data);

    } catch (error) {

        return [];

    }

}


// --------------------------------------------------
// Helper function to save users
// --------------------------------------------------

function saveUsers(users) {

    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );

}


// --------------------------------------------------
// EventEmitter
// --------------------------------------------------

const userEvents = new EventEmitter();


// Signup event
userEvents.on("signup", function(user) {

    const message =
        `[${new Date().toLocaleString()}] SIGNUP: ${user.name} (${user.email})\n`;

    fs.appendFileSync(auditFile, message);

});


// Login event
userEvents.on("login", function(user) {

    const message =
        `[${new Date().toLocaleString()}] LOGIN: ${user.name} (${user.email})\n`;

    fs.appendFileSync(auditFile, message);

});


// --------------------------------------------------
// SIGN UP ROUTE
// --------------------------------------------------

app.post("/signup", function(req, res) {

    const { name, email, password } = req.body;

    // Check all fields
    if (!name || !email || !password) {

        return res.json({
            success: false,
            message: "Please fill all fields."
        });

    }


    // Read existing users
    const users = readUsers();


    // Check if email already exists
    const existingUser = users.find(function(user) {

        return user.email === email;

    });


    if (existingUser) {

        return res.json({
            success: false,
            message: "Email already registered."
        });

    }


    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password
    };


    // Add user
    users.push(newUser);


    // Save users
    saveUsers(users);


    // Emit signup event
    userEvents.emit("signup", newUser);


    res.json({
        success: true,
        message: "Account created successfully!"
    });

});


// --------------------------------------------------
// LOGIN ROUTE
// --------------------------------------------------

app.post("/login", function(req, res) {

    const { email, password } = req.body;


    // Read users
    const users = readUsers();


    // Find matching user
    const user = users.find(function(user) {

        return user.email === email &&
               user.password === password;

    });


    // If user not found
    if (!user) {

        return res.json({
            success: false,
            message: "Invalid email or password."
        });

    }


    // Emit login event
    userEvents.emit("login", user);


    res.json({
        success: true,
        message: "Login successful!",
        name: user.name
    });

});


// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, function() {

    console.log(`Server running at http://localhost:${PORT}`);

});