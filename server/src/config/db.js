const mongoose = require('mongoose');

const { MONGO_URI } = process.env;
if (!MONGO_URI) {
  console.error('Error: Missing required environment variable MONGO_URI.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connection established successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
