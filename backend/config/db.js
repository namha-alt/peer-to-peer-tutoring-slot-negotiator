const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slotsync_db';
    const conn = await mongoose.connect(uri);
    const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('====================================================');
    console.log(`? MongoDB Connected: ${conn.connection.host}`);
    console.log(`?? Database: ${conn.connection.name}`);
    console.log(`?? URI: ${sanitizedUri}`);
    console.log('====================================================');
  } catch (err) {
    console.error(`? MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
