var mongoose = require('mongoose')
var passport = require('passport')
var GitHubStrategy = require('passport-github2').Strategy
var RememberMeStrategy = require('passport-remember-me').Strategy
var randomString = require('./helpers/random-string')
var MongoClient = require('mongodb').MongoClient
var { Octokit } = require('@octokit/rest')

/**
 * Initializes octokit which makes it easier to access Github API
 * @type {Octokit}
 */
const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_TOKEN,
  baseUrl: 'https://api.github.com',
})

/**
 * Model for the user collection storing token and user info.
 * Used for authentication. Separate from the collection variable
 * @type {mongoose.Model}
 */
const model = mongoose.model('auth')

/**
 * Collection storing list of allowed users. Used for verification.
 * Separte from the model constant
 * @type {import("mongodb").Collection}
 */
var collection

/**
 * Initializes collection after establishing connection
 */
MongoClient.connect(
  process.env.USERS_DB_URI,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) console.log(err)
    collection = client.db('run').collection('users')
  },
)

/**
 * Serializes user by storing only the user ID
 */
passport.serializeUser(function (user, done) {
  model.findOrCreate({ id: user.id, username: user.username }, function (
    e,
    docs,
  ) {
    console.log('Serializing user:' + user)
    done(null, user.id)
  })
})

/**
 * Deserializes the user by finding the user with specified ID
 */
passport.deserializeUser(function (id, done) {
  model.find({ id: id }, function (e, user) {
    console.log('Deserializing user: ', user)
    done(null, user)
  })
})

/**
 * Verifies a Github user by its membership
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ['read:user', 'read: user'],
    },

    function verify(accessToken, refreshToken, profile, done) {
      // github organization membership verification
      user = profile.username
      checkMembershipForUser(octokit, user, 'XENON1T')
        .then((value) => {
          console.log('user ' + user + ' is in ' + 'XENON1T')
          model.findOrCreate({ id: profile.id }, { username: user })
          return done(null, profile)
        })
        .catch((err) => {
          console.log(err)
          checkMembershipForUser(octokit, user, 'XENONnT')
            .then((value) => {
              console.log('user ' + user + ' is in ' + 'XENONnT')
              model.findOrCreate({ id: profile.id }, { username: user })
              return done(null, profile)
            })
            .catch((err) => {
              console.log(err)
              const verified = checkMembershipForUserInDB(profile)
              if (verified) return done(null, profile)
              return done(null, false)
            })
        })
    },
  ),
)

/**
 * Remember Me cookie strategy
 * This strategy consumes a remember me token, supplying the user the
 * token was originally issued to.  The token is single-use, so a new
 * token is then issued to replace it.
 */
passport.use(
  new RememberMeStrategy(function (token, done) {
    consumeRememberMeToken(token, function (err, uid) {
      if (err) {
        return done(err)
      }
      if (!uid) {
        return done(null, false)
      }
      model.findOne({ id: uid }, function (err, user) {
        if (err) console.log(err)
        console.log('remember ' + user + '!')
        return done(null, user)
      })
    })
  }, issueToken),
)

/**
 * Consumes a token by checking if it exists in the model variable
 * @param {string} token The token to be consumed
 * @param {Function} fn Gets the user id for deserialization
 */
function consumeRememberMeToken(token, fn) {
  console.log('cookie token is: ' + token)

  // convert to mongo token
  token = token.replace(/%20/g, '+')
  console.log(token)
  const key = 'tokens.'.concat(token)
  model.findOne({ [key]: { $exists: true } }, (err, user) => {
    if (err) return fn(null, false)
    if (!user) return fn(null, false)
    console.log(user)
    console.log('rememberMeToken is for real!!')
    const uid = user.id
    return fn(null, uid)
  })
}

/**
 * Unlike the exported function, this does not need to take a model as argument.
 * This is used by passport-remember-me, not github login. This issues a token
 * to the db
 * @param {Object} user The deserialized remembered user
 * @param {Function} done Passes the token to passport session for future consumption
 */
function issueToken(user, done) {
  var token = randomString(64)
  if (token === undefined) return done(null, false)
  console.log('generated token: ' + token)
  var map = new Map()
  map.set(token, user.id)
  model.updateOne({ id: user.id }, { tokens: map }, function (err) {
    if (err) console.log(err)
  })
  console.log('token issued: ' + token)
  return done(null, token)
}

/**
 * Checks if a user is in the given organization
 * @param {Octokit} octokit An Octokit instance
 * @param {Object} user An user object
 * @param {String} org The name of the the Github organization
 */
function checkMembershipForUser(octokit, user, org) {
  return octokit.orgs.checkMembershipForUser({
    org: org,
    username: user,
  })
}

/**
 * Checks if a user is in the collection object
 * @param {Object} profile Github profile
 */
function checkMembershipForUserInDB(profile) {
  // rundb verification
  process.nextTick(function () {
    collection
      .find({
        $or: [
          { github: profile._json.login },
          { github_id: profile._json.login },
        ],
      }) // to be deleted
      .toArray()
      .then(async (items) => {
        console.log(items)
        if (items.length === 0) return false
        console.log('username is: ', profile.username)
        const doc = await model.findOrCreate(
          { id: profile.id },
          { username: profile.username },
          // { new: true } // return new doc after update to be saved
        )
        console.log('after update:', doc.username)
        return true
      })
      .catch((err) => {
        console.log(err)
        return false
      })
  })
}

console.log('passport setup finished')
