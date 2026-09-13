require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    console.warn('MongoDB disabled: MONGODB_URL is not configured.');
    return false;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Database connection unavailable: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
