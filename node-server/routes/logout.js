var express = require("express");
var router = express.Router();

/**
 * Clears cookie and redirects the user to home page
 */
router.get("/", function (req, res) {
  res.clearCookie("remember_me");
  req.logout();
  res.redirect(process.env.HOMEPAGE);
});

module.exports = router;
