// tests/deleted-user.test.js
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../index.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

describe("Admin Orders - Deleted User Safety", () => {
  let adminCookie = "";
  let testProduct;

  beforeAll(async () => {
    // Create test product
    testProduct = await Product.create({
      name: "Test Shirt",
      price: 999,
      stock: 10,
      category: "670e8f9a1b2c3d4e5f678901", // any valid category ID
      imageUrl: "/test.jpg",
    });

    // Create order with a user we will delete
    const testUser = await User.create({
      name: "Doomed User",
      email: "doomed@example.com",
      password: "123456",
    });

    await Order.create({
      user: testUser._id,
      items: [{ product: testProduct._id, qty: 1, price: 999 }],
      totalAmount: 999,
      status: "placed",
      shippingAddress: { fullName: "Test" },
    });

    // DELETE THE USER (simulates account deletion)
    await User.findByIdAndDelete(testUser._id);

    // Login as admin to get cookie
    const loginRes = await request(app)
      .post("/api/admin/login")
      .send({ email: "admin@myazstore.com", password: "admin123" });

    adminCookie = loginRes.headers["set-cookie"][0].split(";")[0];
  });

  it("should show 'Deleted User' instead of crashing", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Cookie", adminCookie)
      .expect(200);

    const order = res.body.orders.find((o) => o.userName === "Deleted User");
    expect(order).toBeTruthy();
    expect(order.userName).toBe("Deleted User");
    expect(order.userEmail).toBe("N/A");
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({ name: "Test Shirt" });
  });
});
