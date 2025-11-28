// api/tests/admin-orders.test.js
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../index";

describe("Admin Orders Route – NEVER CRASHES", () => {
  let adminCookie = "";

  // Auto login before each test
  beforeEach(async () => {
    const loginRes = await request(app).post("/api/admin/login").send({
      email: "admin@mystore.com", // ← change to your real admin email
      password: "admin123", // ← change to real password
    });

    // Extract cookie from response
    const cookies = loginRes.headers["set-cookie"];
    if (cookies) {
      adminCookie = cookies[0].split(";")[0]; // gets "token=abc123..."
    }
  });

  it("should return 200 and safe data", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
