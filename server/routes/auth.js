var express = require("express");
var url = require("url");
var passport = require("passport");
var router = express.Router();
var issueToken = require("../model/helpers/issue-token");
var mongoose = require("mongoose");
const { ENGINE_METHOD_NONE } = require("constants");
var model = mongoose.model("auth");

const authCheck = (req, res, next) => {
  var token = req.token;
  console.log("request token in auth: " + token);
  if (!token) return next();
  model.find({}, (err, users) => {
    users.map((user) => {
      if (user.tokens.has(token)) {
        console.log("found client token!!");
        res.json({
          status: 200,
          user: user.username,
          id: user.id,
          // token: req.token,
          // cookies: req.cookies,
        });
      }
    });
  });
};

router.get("/", authCheck, function (req, res) {
  res.json({
    status: 401,
    authenticated: false,
  });
});

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "user:name", "user:login", "user:id"],
  })
);

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: process.env.HOMEPAGE + "/login/failure",
  }),
  function (req, res, next) {
    issueToken(req.user, req.model, function (err, token) {
      if (err) {
        return next(err);
      }
      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000,
        secure: true,
      });
      return next();
    });
  },
  function (req, res) {
    // model.findOneAndUpdate({ id: req.user.id }, { cb_complete: true });
    console.log("updated");
    // Successful authentication, respond with success.
    res.redirect(process.env.HOMEPAGE + "/login/success");
  }
);

module.exports = router;
