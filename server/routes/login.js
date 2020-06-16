var express = require("express");
var router = express.Router();
var ensureAuthenticated = require("../public/javascripts/ensure-authenticated");

/* GET login page */
router.get("/", ensureAuthenticated, function (req, res) {
  res.json({ isAuthenticated: true });
});

module.exports = router;
