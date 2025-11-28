// config/db.js
import mongoose from "mongoose";

let globalConnection = global.mongoose_conn || null;

export async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    throw new Error("MONGO_URI missing");
  }

  // -------------------------------
  // ✔ Reuse existing global connection (Vercel optimization)
  // -------------------------------
  if (globalConnection && globalConnection.readyState === 1) {
    // console.log("👉 Using existing MongoDB connection");
    return globalConnection;
  }

  try {
    // -------------------------------
    // ✔ Establish New Connection
    // -------------------------------
    globalConnection = await mongoose.connect(MONGO_URI, {
      // Add safe options for stability
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000, // avoid “buffering timeout” error
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected:", globalConnection.connection.name);

    // Save globally to prevent reconnecting
    global.mongoose_conn = globalConnection;

    return globalConnection;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

//////////////////new

// import mongoose from "mongoose";

// export default async function connectDB(uri) {
//   if (!uri) throw new Error("MONGO_URI missing");
//   await mongoose.connect(uri);
//   console.log("✅ MongoDB connected");
// }
