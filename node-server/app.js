var createError = require("http-errors");
var cookieSession = require("cookie-session");
var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var passport = require("passport");
var session = require("express-session");
var cors = require("cors");
var model = require("./model/db-setup");

var logoutRouter = require("./routes/logout");
var authRouter = require("./routes/auth");

/**
 * Creates an express applicaton
 * @type {Express}
 */
var app = express();

/**
 * set up cors to allow us to accept requests from our client
 */
app.use(
  cors({
    origin: "*", // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // allow session cookie from browser to pass through
  })
);

/**
 * Configure cookie session
 */
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_SECRET_KEY],
    maxAge: 24 * 60 * 60 * 100,
    sameSite: "none",
  })
);

/**
 * Parses cookies in HTTP requests
 */
app.use(cookieParser());

/**
 * Log output for development use
 */
app.use(logger("dev"));

/**
 * Parses JSON
 */
app.use(express.json());

/**
 * Parses urlencoded bodies with qs library
 */
app.use(express.urlencoded({ extended: false }));

/**
 * Configure passport session
 */
app.use(
  session({
    secret: process.env.PASSPORT_SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

/**
 * Sets up the passport model, establishes connection to DB,
 * load required routine functions
 */
require("./model/passport");

/**
 * Initializes passport
 */
app.use(passport.initialize());

/**
 * Alter the req object and change the 'user' value that is
 * currently the session id (from the client cookie) into the
 * true deserialized user object. Supports persistent login
 */
app.use(passport.session());

/**
 * Make the db model and user token accessible to routers
 */
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  req.model = model;
  req.token = req.query.token;
  next();
});

/**
 * Use logoutRouter for requests to /logout
 */
app.use("/logout", logoutRouter);

/**
 * Use authRouter for requests to /auth
 */
app.use("/auth", authRouter);

/**
 * Catches 404 and forward to error handler
 */
app.use(function (req, res, next) {
  next(createError(404));
});

/**
 * The error handler. Simply sends a 404 status
 */
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.sendStatus(404);
});

/**
 * Exported to server.js where the app listesn to a port
 */
module.exports = app;
