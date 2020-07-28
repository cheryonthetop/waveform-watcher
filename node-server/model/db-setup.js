var mongoose = require("mongoose");
var findOrCreate = require("mongoose-findorcreate");
var connectionOptions = require("../config/connection-options");

/**
 * Connects to the database storing user info
 */
mongoose
  .connect(process.env.AUTH_DB_URI, connectionOptions)
  .then(() => {
    console.log("mongoDB connected");
  })
  .catch((e) => {
    console.log(e);
  });

/**
 * Assign your own Promise library. Note this is
 * actually not needed after Mongoose 5.0 as it relies
 * on its own Promise implementation
 */
mongoose.Promise = global.Promise;

/**
 * The collection schema class
 * @type {mongoose.Schema}
 */
var Schema = mongoose.Schema;

/**
 * Defines the user collection schema
 */
const user_schema = new Schema({
  id: { type: String, unique: true, required: true },
  tokens: {
    type: Map,
    of: String,
  },
  username: { type: String, unique: true },
});

/**
 * Make findOrCreate an available function to the user
 * collection
 */
user_schema.plugin(findOrCreate);

/**
 * Transforms the returned value to json
 */
user_schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.hash;
  },
});

/**
 * Exports a mongoose model for the collection
 */
module.exports = mongoose.model("auth", user_schema);

console.log("DB setup finished");
