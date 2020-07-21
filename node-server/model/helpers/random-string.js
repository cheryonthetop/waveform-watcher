const Crypto = require('crypto')

module.exports = function randomString(size = 21) {  
    return Crypto
      .randomBytes(size)
      .toString('base64')
      .slice(0, size)
  }