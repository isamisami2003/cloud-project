require('dotenv').config();
const mongoose = require('mongoose');

// monogdb uri
const monogUrI = process.env.MONGO_URI ;

// connect to database
async function connectDB() {
  try {
    await mongoose.connect(monogUrI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;