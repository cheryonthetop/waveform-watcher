/**
 * Generates a random string
 * @type {Function}
 */
var randomString = require("./random-string");

/**
 * Issues a token when the user logs in
 * @param {Object} user The user object
 * @param {mongoose.model} model The model for user collection
 * @param {Function} done Passes the token to passport session for future consumption
 */
module.exports = function issueToken(user, model, done) {
  var token = randomString(64);
  if (token === undefined) return done(null, false);
  console.log("generated token: " + token);
  var map = new Map();
  map.set(token, user.id);
  model.updateOne({ id: user.id }, { tokens: map }, function (err) {
    if (err) console.log(err);
  });
  // console.log(model.find({}));
  console.log("token issued: " + token);
  return done(null, token);
};
