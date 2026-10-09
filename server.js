"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties

MongoClient.connect(db, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);
    const database = client.db(); // uses the database name from the URI (/nodegoat)

    // Render terminates HTTPS at its proxy: needed for secure cookies and correct client IPs
    app.set("trust proxy", 1);

    // Adding/ remove HTTP Headers for security
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        // Mandatory in Express v4
        extended: false
    }));

    // Enable session management using express middleware
    app.use(session({
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Fix for clear text transmission of the session cookie
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "lax"
        }
    }));

    // Fix for missing CSRF protection: must come after sessions and body parsing, before routes
    app.use(csrf());
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    app.use(express.static(`${__dirname}/app/assets`));


    // Initializing marked library
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, database);

    // Template system setup
    swig.setDefaults({
        // Autoescape disabled
        autoescape: false
    });

    // HTTP connection
    http.createServer(app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

});
