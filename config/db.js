import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // 🔥 prevents reconnecting on every request

  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI is missing");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    throw err; // NO process.exit() in serverless!
  }
};

export default connectDB;
