const {MongodbPersistence} = require('y-mongodb-provider');

const { MONGO_URI } = process.env;
if (!MONGO_URI) {
  console.error('Error: Missing required environment variable MONGO_URI.');
  process.exit(1);
}

const mdb = new MongodbPersistence(MONGO_URI, {
  collectionName: 'yjs_documents',
  flushSize: 100,
});

module.exports = { mdb };
