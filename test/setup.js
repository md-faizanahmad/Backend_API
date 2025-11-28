// api/test/setup.js   ← FINAL VERSION THAT WORKS
import { config } from "dotenv";
import path from "path";

// Load .env from ROOT (one level up)
config({ path: path.resolve(process.cwd(), "../.env") });

// Fake Razorpay keys so tests NEVER crash
process.env.RAZORPAY_KEY_ID = "rzp_test_fake123";
process.env.RAZORPAY_KEY_SECRET = "fake_secret_123456";
process.env.NODE_ENV = "test";

import mongoose from "mongoose";

const testDB = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/MyStore_DB.*$/, "testdb")
  : "mongodb://127.0.0.1:27017/testdb";

beforeAll(async () => {
  await mongoose.connect(testDB);
}, 60000);

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}, 60000);
