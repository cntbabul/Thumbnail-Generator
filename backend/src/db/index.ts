import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thumbnail_generator';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🚀 MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectDB;
