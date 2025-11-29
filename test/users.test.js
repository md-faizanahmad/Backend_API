// tests/users.test.js
// Integration tests for /api/users endpoints using Supertest and the in-memory DB.
//
// IMPORTANT:
// - Ensure src/app.js exports the express app (not listen).
// - Adjust import paths below if your files live elsewhere.

import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app.js"; // adjust path if necessary
import bcrypt from "bcryptjs";
import { startTestDB, stopTestDB, clearCollections } from "./setup.js";
import { jwtSignTestToken, createTestUser } from "./testUtils.js";

test.before(async () => {
  // Start the in-memory DB; this will throw if NODE_ENV !== 'test'
  await startTestDB();
});

test.after(async () => {
  // Stop and cleanup the in-memory DB
  await stopTestDB();
});

test.afterEach(async () => {
  // Ensure tests don't leak data into each other
  await clearCollections();
});

/**
 * Test: Signup - missing fields should return 400
 * This checks your input validation path.
 */
test("POST /api/users/signup - missing fields returns 400", async () => {
  const res = await request(app)
    .post("/api/users/signup")
    .send({ email: "onlyemail@example.com" }) // no name/password
    .set("Accept", "application/json");

  // Many APIs return 400 or 422; allow both so test isn't brittle.
  assert.ok(
    [400, 422].includes(res.status),
    `expected 400/422, got ${res.status}`
  );
});

/**
 * Test: Signup - happy path
 * We simulate a verified OTP token (the controller expects otpToken).
 * The token is created using the same test fallback secret.
 */
test("POST /api/users/signup - happy path creates user", async () => {
  const email = `testuser+${Date.now()}@example.com`;
  // create an OTP token that your controller will accept
  const otpToken = jwtSignTestToken({
    email,
    otpVerified: true,
    purpose: "signup",
  });

  const payload = {
    name: "Test User",
    email,
    password: "StrongPass123!",
    otpToken,
  };

  const res = await request(app)
    .post("/api/users/signup")
    .send(payload)
    .set("Accept", "application/json");

  // Accept either 201 (created) or 200 (some APIs return 200)
  assert.ok(
    [200, 201].includes(res.status),
    `expected 200/201, got ${res.status}`
  );
  // Expect a user object / id/email back
  assert.ok(
    res.body &&
      (res.body.user || res.body.email || res.body.id || res.body.user?.id),
    "expected returned user data"
  );
});

/**
 * Test: Login - missing fields returns 400
 */
test("POST /api/users/login - missing fields returns 400", async () => {
  const res = await request(app)
    .post("/api/users/login")
    .send({ email: "no-pass@example.com" })
    .set("Accept", "application/json");

  assert.ok(
    [400, 401, 422].includes(res.status),
    `expected 400/401/422, got ${res.status}`
  );
});

/**
 * Test: Login - invalid credentials -> 401
 * No user exists, so login should fail.
 */
test("POST /api/users/login - invalid credentials returns 401", async () => {
  const res = await request(app)
    .post("/api/users/login")
    .send({ email: "doesnotexist@example.com", password: "wrongpass" })
    .set("Accept", "application/json");

  assert.ok(
    [401, 400].includes(res.status),
    `expected 401/400, got ${res.status}`
  );
});

/**
 * Test: Login - valid credentials -> success
 * Create a user directly in DB then login via API.
 */
test("POST /api/users/login - valid credentials returns success", async () => {
  const email = `loginuser+${Date.now()}@example.com`;
  const rawPassword = "MySecretPass123!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // create user directly in DB (bypassing API); createTestUser uses the User model
  await createTestUser({ email, passwordHash, name: "Login Test" });

  const res = await request(app)
    .post("/api/users/login")
    .send({ email, password: rawPassword })
    .set("Accept", "application/json");

  // Expect 200 (or 201) and a token cookie set by the API
  assert.ok(
    [200, 201].includes(res.status),
    `expected 200/201, got ${res.status}`
  );
  // If your app sets cookie, Supertest exposes it in res.headers['set-cookie']
  assert.ok(
    res.headers && (res.headers["set-cookie"] || res.body?.user),
    "expected set-cookie header or user in body"
  );
});

/**
 * Test: Login with OTP - missing token returns 400
 */
test("POST /api/users/login-otp - missing token returns 400", async () => {
  const res = await request(app)
    .post("/api/users/login-otp")
    .send({})
    .set("Accept", "application/json");

  assert.ok(
    [400, 401, 422].includes(res.status),
    `expected 400/401/422, got ${res.status}`
  );
});

/**
 * Test: Login with OTP - happy path
 * Create a user, sign an OTP token with purpose 'login' and otpVerified true, then call login-otp.
 */
test("POST /api/users/login-otp - valid OTP logs in user", async () => {
  const email = `otpuser+${Date.now()}@example.com`;
  const rawPassword = "IgnoredPass123!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // create user
  await createTestUser({ email, passwordHash, name: "OTP Login" });

  // sign a login OTP token
  const otpToken = jwtSignTestToken({
    email,
    otpVerified: true,
    purpose: "login",
  });

  const res = await request(app)
    .post("/api/users/login-otp")
    .send({ otpToken })
    .set("Accept", "application/json");

  assert.ok(
    [200, 201].includes(res.status),
    `expected 200/201, got ${res.status}`
  );
  assert.ok(
    res.body && res.body.success,
    "expected success true in response body"
  );
});
