// // routes/checkoutRoutes.js
// import express from "express";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import User from "../models/User.js";
// import { z } from "zod";

// const router = express.Router();

// /* ----------------------------------------------------
//    Zod validation
// ---------------------------------------------------- */
// const checkoutSessionSchema = z.object({
//   addressId: z.string(),
//   items: z
//     .array(
//       z.object({
//         productId: z.string(),
//         qty: z.number().min(1),
//         price: z.number().min(0),
//       })
//     )
//     .min(1),
//   totalAmount: z.number().min(1),
// });

// /* ----------------------------------------------------
//    1) SETUP CHECKOUT SESSION
//    Called before redirecting to Razorpay
// ---------------------------------------------------- */
// router.post("/session", verifyUserCookie, async (req, res) => {
//   const parsed = checkoutSessionSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid checkout data",
//       errors: parsed.error.flatten(),
//     });
//   }

//   const { addressId, items, totalAmount } = parsed.data;

//   /* ---- Validate address belongs to user ---- */
//   const user = await User.findById(req.userId);
//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found",
//     });
//   }

//   const address = user.addresses.find(
//     (a) => a._id.toString() === addressId.toString()
//   );

//   if (!address) {
//     return res.status(400).json({
//       success: false,
//       message: "Address not found or does not belong to user",
//     });
//   }

//   /* ---- Store session ---- */
//   req.session.checkout = {
//     user: req.userId,
//     addressId,
//     items,
//     totalAmount,
//   };

//   return res.json({
//     success: true,
//     message: "Checkout session saved",
//   });
// });

// /* ----------------------------------------------------
//    2) GET ACTIVE CHECKOUT SESSION (optional)
// ---------------------------------------------------- */
// router.get("/session", verifyUserCookie, (req, res) => {
//   if (!req.session.checkout) {
//     return res.json({ success: false, session: null });
//   }

//   res.json({ success: true, session: req.session.checkout });
// });

// export default router;
//////////////////////////////////////////////// updated 26--11
// routes/checkoutRoutes.js
import express from "express";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

const router = express.Router();

/* -----------------------------------------------------------
   Save Checkout Session in SIGNED HttpOnly Cookie
----------------------------------------------------------- */
router.post("/session", verifyUserCookie, async (req, res) => {
  try {
    const { addressId, items, totalAmount } = req.body;

    if (!addressId || !items?.length || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing checkout fields",
      });
    }

    // Validate user & address
    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // Validate items exist
    for (const i of items) {
      const product = await Product.findById(i.productId);
      if (!product)
        return res.status(400).json({
          success: false,
          message: "Product not found: " + i.productId,
        });
    }

    // Build small object → inside cookie
    const checkoutData = {
      userId: req.userId,
      addressId,
      items,
      totalAmount,
    };

    // Save signed HttpOnly cookie (10 minutes)
    res.cookie("checkout_session", checkoutData, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      signed: true,
      maxAge: 10 * 60 * 1000,
      domain: ".myazstore.shop",
      path: "/",
    });

    res.json({ success: true, message: "Checkout session saved" });
  } catch (err) {
    console.error("CHECKOUT SESSION ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -----------------------------------------------------------
   READ Checkout Session (Optional – for frontend reload)
----------------------------------------------------------- */
router.get("/session", verifyUserCookie, (req, res) => {
  const data = req.signedCookies.checkout_session || null;
  res.json({ success: !!data, session: data });
});

export default router;
