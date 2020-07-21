var mongoose = require("mongoose");
var findOrCreate = require("mongoose-findorcreate");
var connectionOptions = require("../config/connection-options");

mongoose
  .connect(process.env.AUTH_DB_URI, connectionOptions)
  .then(() => {
    console.log("mongoDB connected");
  })
  .catch((e) => {
    console.log(e);
  });
mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;

// Accessing user
const user_schema = new Schema({
  id: { type: String, unique: true, required: true },
  tokens: {
    type: Map,
    of: String,
  },
  username: { type: String, unique: true },
});

user_schema.plugin(findOrCreate);

user_schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.hash;
  },
});

module.exports = mongoose.model("auth", user_schema);

console.log("DB setup finished");
