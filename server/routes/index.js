var express = require("express");
var router = express.Router();
var ensureAuthenticated = require("../model/helpers/ensure-authenticated");

/* GET home page. */
router.get("/", ensureAuthenticated, function (req, res) {
  res.render("index", { title: "Waveform watching", user: req.user });
});

/* Returns to homepage */
router.get("/logout", function (req, res) {
  res.clearCookie("remember_me");
  req.logout();
  res.redirect(process.env.HOMEPAGE);
});

module.exports = router;
