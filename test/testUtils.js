// tests/testUtils.js
// Small helpers used by tests: sign OTP tokens with test secret and create a user directly via Mongoose.

import jwt from "jsonwebtoken";
import User from "../models/User.js"; // adjust path if your model is elsewhere

// Sign an OTP-style token for tests using the test fallback secret.
// payload should be an object like { email, otpVerified: true, purpose: "signup" }
export function jwtSignTestToken(payload, options = {}) {
  const secret = process.env.OTP_SECRET || "dev-test-otp-secret";
  const signOpts = { expiresIn: options.expiresIn || "10m" };
  return jwt.sign(payload, secret, signOpts);
}

// Create and return a user record directly (bypasses API).
// Useful to set up login tests without calling signup endpoint.
export async function createTestUser({
  email,
  passwordHash,
  name = "Test User",
  phone = "",
}) {
  const normalized = String(email).trim().toLowerCase();
  const user = await User.create({
    name,
    email: normalized,
    password: passwordHash, // send hashed password if you prefer; tests can hash with bcrypt if needed
    phone,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });
  return user;
}
