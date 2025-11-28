// tests/stock-reduction.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

describe("Order Creation - Stock Reduction", () => {
  let userCookie = "";
  let product;

  beforeEach(async () => {
    product = await Product.create({
      name: "Stock Test",
      price: 1000,
      stock: 10,
      category: "670e8f9a1b2c3d4e5f678901",
      imageUrl: "/test.jpg",
    });

    // Login as normal user
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "testuser@example.com", password: "123456" });

    userCookie = res.headers["set-cookie"][0].split(";")[0];
  });

  it("should reduce stock when order is placed", async () => {
    await request(app)
      .post("/api/orders/create")
      .set("Cookie", userCookie)
      .send({
        items: [{ productId: product._id.toString(), qty: 3 }],
        shippingAddress: {
          fullName: "Test",
          phone: "9999999999",
          street: "Test",
          city: "Test",
          state: "TS",
          pincode: "123456",
        },
        paymentMethod: "COD",
      })
      .expect(201);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(7); // 10 - 3 = 7
  });

  afterEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({ name: "Stock Test" });
  });
});
