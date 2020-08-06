var express = require("express");
var passport = require("passport");
var router = express.Router();
var issueToken = require("../model/helpers/issue-token");
var mongoose = require("mongoose");
var model = mongoose.model("auth");

/**
 * Sends 200 response if a user is authenticated
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
const authCheck = (req, res, next) => {
  // if browser allows third-party cookie
  if (req.user) {
    const { username, id } = req.user[0];
    res.status(200).send({
      user: username,
      id: id,
    });
  } else {
    // if browser does not allow third party cookie
    var token = req.token;
    if (!token) return next();
    // convert to mongo token
    token = token.replace(/%20/g, "+");
    console.log(token);
    const key = "tokens.".concat(token);
    model.findOne({ [key]: { $exists: true } }, (err, user) => {
      if (err) return next();
      if (!user) return next();
      console.log(user);
      console.log("found client token!!");
      res.status(200).send({
        user: user.username,
        id: user.id,
      });
    });
  }
};

/**
 * Check if a user is authenticated, send 400 response
 * if it is not
 */
router.get("/", authCheck, function (req, res) {
  res.sendStatus(401);
});

/**
 * GET /auth/github
 *  Use passport.authenticate() as route middleware to authenticate the
 *  request.  The first step in GitHub authentication will involve redirecting
 *  the user to github.com.  After authorization, GitHub will redirect the user
 *  back to this application at /auth/github/callback
 */
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user", "read:org"],
  })
);

/**
 * GET /auth/github/callback
 * Use passport.authenticate() as route middleware to authenticate the
 * request.  If authentication fails, the user will be redirected back to the
 * login page.  Otherwise, the primary route function will be called,
 * which, in this example, will redirect the user to the home page.
 */
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
    console.log("updated");
    // Successful authentication, respond with success.
    res.redirect(process.env.HOMEPAGE + "/login/success?token=" + req.token);
  }
);

module.exports = router;
