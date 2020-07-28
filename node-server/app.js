var createError = require("http-errors");
var cookieSession = require("cookie-session");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var passport = require("passport");
var bodyParser = require("body-parser");
var session = require("express-session");
var flash = require("connect-flash");
var cors = require("cors");
// set up mongodb
var model = require("./model/db-setup");

var logoutRouter = require("./routes/logout");
var authRouter = require("./routes/auth");

var app = express();

// Every incoming request
// set up cors to allow us to accept requests from our client
app.use(
  cors({
    origin: process.env.HOMEPAGE, // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // allow session cookie from browser to pass through
  })
);
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_SECRET_KEY],
    maxAge: 24 * 60 * 60 * 100,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// required for passport session
app.use(
  session({
    secret: process.env.PASSPORT_SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);
app.use(flash());
require("./model/passport");
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate("remember-me"));

app.use(express.static(path.join(__dirname, "public")));

// Make our db accessible to our router
app.use(function (req, res, next) {
  req.model = model;
  req.token = req.query.token;
  // console.log("request token here:" + req.token);
  // console.log("request user here:" + req.user);
  // if (req.user.id) res.json(req.user.id);
  next();
});

// Specific routes
app.use("/logout", logoutRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.sendStatus(404);
});

module.exports = app;
