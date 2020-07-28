/**
 * @type {Object}
 * The connection options used by MongoClient
 */
const connectionOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
module.exports = connectionOptions;
