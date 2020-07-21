module.exports = function ensureAuthenticated(req, res, next) {
  console.log("request is " + req);
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(process.env.HOMEPAGE + "/login/success");
};
