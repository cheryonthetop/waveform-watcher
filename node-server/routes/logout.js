var express = require("express");
var router = express.Router();

/* Returns to homepage */
router.get("/", function (req, res) {
  res.clearCookie("remember_me");
  req.logout();
  res.redirect(process.env.HOMEPAGE);
});

module.exports = router;
