////////////Above one working with only if product in cart
// routes/checkoutRoutes.js
import express from "express";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

const router = express.Router();

/* -----------------------------------------------------------
   SAVE CHECKOUT SESSION (CART + BUY NOW)
----------------------------------------------------------- */
router.post("/session", verifyUserCookie, async (req, res) => {
  try {
    const { addressId, items, totalAmount } = req.body;
    const { quickbuy } = req.query;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "addressId required",
      });
    }

    // Validate user
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    // Validate address
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    let finalItems = [];
    let finalTotal = 0;

    /* -------------------------------------------------
       BUY NOW FLOW
    ------------------------------------------------- */
    if (quickbuy) {
      const product = await Product.findById(quickbuy);
      if (!product)
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });

      if (product.stock < 1)
        return res.status(400).json({
          success: false,
          message: "Product out of stock",
        });

      const price = product.discountPrice ?? product.price;

      finalItems = [
        {
          productId: product._id,
          qty: 1,
          price,
        },
      ];

      finalTotal = price;
    } else {
      /* -------------------------------------------------
       CART FLOW (Existing)
    ------------------------------------------------- */
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      if (typeof totalAmount !== "number" || totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid totalAmount",
        });
      }

      // Validate cart items
      for (const i of items) {
        const product = await Product.findById(i.productId);
        if (!product)
          return res.status(400).json({
            success: false,
            message: "Product not found: " + i.productId,
          });
      }

      finalItems = items;
      finalTotal = totalAmount;
    }

    /* -------------------------------------------------
       SAVE CHECKOUT SESSION (SIGNED COOKIE)
    ------------------------------------------------- */
    const checkoutData = {
      userId: req.userId,
      addressId,
      items: finalItems,
      totalAmount: finalTotal,
      createdAt: Date.now(),
    };

    res.cookie("checkout_session", checkoutData, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      signed: true,
      maxAge: 10 * 60 * 1000,
      domain: ".myazstore.shop",
      path: "/",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("CHECKOUT SESSION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
