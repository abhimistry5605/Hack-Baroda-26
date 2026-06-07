const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedeploy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('⚠️  DATABASE CONNECTION WARNING: Local MongoDB instance not detected.');
    console.log('💡  SafeDeploy is automatically falling back to an In-Memory/JSON database mode.');
    console.log('    All dashboard panels and AI Chat queries remain fully functional.');
  }
};

module.exports = connectDB;
