import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksense';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't crash immediately, allow retry or fallback
    throw error;
  }
}

export default mongoose;
