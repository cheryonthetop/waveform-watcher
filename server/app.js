var createError = require("http-errors");
const cookieSession = require("cookie-session");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var passport = require("passport");
var bodyParser = require("body-parser");
var session = require("express-session");
var flash = require("connect-flash");
require("https").globalAgent.options.rejectUnauthorized = false;
var cors = require("cors");
// set up mongodb
var model = require("./model/db-setup");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

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
    keys: ["secrettexthere"],
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
    secret: "secrettexthere",
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

// app.all("/*", function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });

// Make our db accessible to our router
app.use(function (req, res, next) {
  req.model = model;
  req.token = req.cookies.remember_me;
  console.log("request:" + req);
  console.log("request headers:" + req.headers);
  console.log("request token here:" + req.token);
  console.log("request user here:" + req.user);
  // if (req.user.id) res.json(req.user.id);
  next();
});

// Specific routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
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

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
