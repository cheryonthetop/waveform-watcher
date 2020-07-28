const Crypto = require("crypto");

/**
 * Generates a cryptographic random string as token
 * @param {Number} size Size of the string in byets
 */
module.exports = function randomString(size = 21) {
  return Crypto.randomBytes(size).toString("base64").slice(0, size);
};
