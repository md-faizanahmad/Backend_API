// tests/setup.js
// Responsible for managing the in-memory MongoDB lifecycle and clearing collections.
// Tests must import and call startTestDB() in a before hook.

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer = null;

export async function startTestDB() {
  // Safety guard: abort if NODE_ENV is not 'test' so we never touch a real DB.
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "startTestDB() called but NODE_ENV !== 'test' — aborting to avoid touching real DB."
    );
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect mongoose to the ephemeral in-memory server
  await mongoose.connect(uri);
  return uri;
}

export async function clearCollections() {
  if (!mongoose.connection.readyState) return;
  const collections = mongoose.connection.collections;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

export async function stopTestDB() {
  try {
    if (mongoose.connection.readyState) {
      // Drop the in-memory DB and disconnect
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  }
}
