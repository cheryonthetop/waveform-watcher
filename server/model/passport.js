var mongoose = require("mongoose");
var passport = require("passport");
var GitHubStrategy = require("passport-github2").Strategy;
var RememberMeStrategy = require("passport-remember-me").Strategy;
var randomString = require("./helpers/random-string");
var MongoClient = require("mongodb").MongoClient;
var { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: "cherryonthetop",
  userAgent: "waveform-watcher",
  baseUrl: "https://api.github.com",
});

var CALLBACK_URL = process.env.CALLBACK_URL;

// users data for sign-in backend only (serialization, remember-me cookie)
// separate from the users below for verification
var model = mongoose.model("auth");

// for another db, separate from the model above
var collection;

MongoClient.connect(
  process.env.USERS_DB_URI,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) console.log(err);
    collection = client.db("run").collection("users");
    // collection.find({}).toArray().then(items => console.log(items)).catch(err => console.log(err))
    // collection.findOne({ github_id: "nupole" }, function (err, user) {
    // console.log(user);
    // });
  }
);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  model.findOrCreate({ id: user.id }, function (e, docs) {
    console.log("Serializing user:" + user.id);
    done(null, user.id);
  });
});

passport.deserializeUser(function (id, done) {
  model.find({ id: id }, function (e, user) {
    console.log("Deserializing user: ", user);
    done(null, user);
  });
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ["user:email", "user:name", "user:login", "user:id"],
    },

    function verify(accessToken, refreshToken, profile, done) {
      // console.log("access token: ", accessToken);
      // console.log("refresh token: " + refreshToken);
      // console.log("profile: " + JSON.stringify(profile));
      // github prganization membership verification

      // octokit.orgs
      //   .checkMembershipForUser({
      //     org: "XENON1T",
      //     username: profile.username,
      //   })
      //   .then((value) => {
      //     console.log(value);
      //     const doc = model.findOrCreate(
      //       { id: profile.id },
      //       { username: profile.username }
      //       // { new: true } // return new doc after update to be saved
      //     );
      //     console.log("after update:", doc.username);
      //     return done(null, profile);
      //   })
      //   .catch((err) => console.log(err));
      // octokit.orgs
      //   .checkMembershipForUser({
      //     org: "XENONnT",
      //     username: profile.username,
      //   })
      //   .then((value) => {
      //     console.log(value);
      //     const doc = model.findOrCreate(
      //       { id: profile.id },
      //       { username: profile.username }
      //       // { new: true } // return new doc after update to be saved
      //     );
      //     console.log("after update:", doc.username);
      //     return done(null, profile);
      //   })
      //   .catch((err) => console.log(err));
      // rundb verification
      process.nextTick(function () {
        collection
          .find({
            $or: [
              { github: profile._json.login },
              { github_id: profile._json.login },
              { github_id: "nupole" },
            ],
          }) // to be deleted
          .toArray()
          .then(async (items) => {
            console.log(items);
            if (items.length === 0) return done(null, false);
            console.log("username is: ", profile.username);
            const doc = await model.findOrCreate(
              { id: profile.id },
              { username: profile.username }
              // { new: true } // return new doc after update to be saved
            );
            console.log("after update:", doc.username);
            return done(null, profile);
          })
          .catch((err) => console.log(err));
      });
    }
  )
);

// Remember Me cookie strategy
//   This strategy consumes a remember me token, supplying the user the
//   token was originally issued to.  The token is single-use, so a new
//   token is then issued to replace it.
passport.use(
  new RememberMeStrategy(function (token, done) {
    consumeRememberMeToken(token, function (err, uid) {
      if (err) {
        return done(err);
      }
      if (!uid) {
        return done(null, false);
      }
      model.findOne({ id: uid }, function (err, user) {
        if (err) console.log(err);
        console.log("remember " + user + "!");
        return done(null, user);
      });
    });
  }, issueToken)
);

/* Passport-remember-me helpers */
/* Fake, in-memory database of remember me tokens */

function consumeRememberMeToken(token, fn) {
  console.log("token is: " + token);
  var uid;

  model.find({}, (err, users) => {
    if (err) {
      console.log(err);
      return fn(null, false);
    }

    users.map((user) => {
      if (user.tokens.has(token)) {
        uid = user.tokens.get(token);
        // invalidate the single-use token
        user.tokens.delete(token);
        console.log("found token!!");
      }
    });
    return fn(null, uid);
  });
}

/* Unlike the exported function, this does not need to take a model as argument. 
   The passport-remember-me strategy only recognizes such method signature as well*/
function issueToken(user, done) {
  var token = randomString(64);
  if (token === undefined) return done(null, false);
  console.log("generated token: " + token);
  var map = new Map();
  map.set(token, user.id);
  model.updateOne({ id: user.id }, { tokens: map }, function (err) {
    if (err) console.log(err);
  });
  console.log("token issued: " + token);
  return done(null, token);
}

console.log("passport setup finished");
