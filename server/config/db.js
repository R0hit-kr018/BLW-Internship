const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Calling mongoose.connect will invoke our mock connection which succeeds instantly
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/railguard');
    console.log(`✅ MongoDB Connection Initialized: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
