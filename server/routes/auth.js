var express = require("express");
var url = require("url");
var passport = require("passport");
var router = express.Router();
var issueToken = require("../model/helpers/issue-token");
var mongoose = require("mongoose");
var model = mongoose.model("auth");

const authCheck = (req, res, next) => {
  // if browser allows third-party cookie
  if (req.user)
    res.status(200).json({
      user: req.user.username,
      id: req.user.id,
    });
  // if browser does not allow third party cookie
  else {
    var token = req.token;
    if (!token) return next();
    model.find({}, (err, users) => {
      users.map((user) => {
        if (user.tokens.has(token)) {
          console.log("found client token!!");
          res.json({
            status: 200,
            user: user.username,
            id: user.id,
          });
        }
      });
    });
  }
};

router.get("/", authCheck, function (req, res) {
  res.status(401).json({
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
    scope: ["read:user", "read:org"],
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
      req.token = token;
      return next();
    });
  },
  function (req, res) {
    // model.findOneAndUpdate({ id: req.user.id }, { cb_complete: true });
    console.log("updated");
    // Successful authentication, respond with success.
    res.redirect(process.env.HOMEPAGE + "/login/success?token=" + req.token);
  }
);

module.exports = router;
