// tests/deleted-product.test.js
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../index.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

describe("Admin Orders - Deleted Product Safety", () => {
  let adminCookie = "";

  beforeAll(async () => {
    const product = await Product.create({
      name: "Ghost Product",
      price: 500,
      stock: 5,
      category: "670e8f9a1b2c3d4e5f678901",
      imageUrl: "/ghost.jpg",
    });

    await Order.create({
      user: "66f8a1b2c3d4e5f678901234", // any user ID
      items: [{ product: product._id, qty: 2, price: 500 }],
      totalAmount: 1000,
      status: "placed",
      shippingAddress: { fullName: "Test" },
    });

    // DELETE THE PRODUCT
    await Product.findByIdAndDelete(product._id);

    const loginRes = await request(app)
      .post("/api/admin/login")
      .send({ email: "admin@myazstore.com", password: "admin123" });

    adminCookie = loginRes.headers["set-cookie"][0].split(";")[0];
  });

  it("should show 'Product Deleted' instead of crashing", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Cookie", adminCookie)
      .expect(200);

    const item = res.body.orders[0].items[0];
    expect(item.productName).toBe("Product Deleted");
    expect(item.productImage).toBe("/placeholder.jpg");
  });
});
