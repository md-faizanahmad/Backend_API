// // api/routes/paymentRoutes.js
// import express from "express";
// import crypto from "crypto";
// import razorpay from "../config/razorpay.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import User from "../models/User.js";
// import Order from "../models/Order.js";
// import { sendInvoiceEmail } from "../utils/sendInvoiceEmail.js"; // <- you create this

// const router = express.Router();

// /* Create Razorpay order */
// router.post("/create-order", verifyUserCookie, async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Amount required" });
//     }

//     const options = {
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "rcpt_" + Date.now(),
//     };

//     const order = await razorpay.orders.create(options);

//     return res.json({ success: true, order });
//   } catch (err) {
//     console.error("Order Error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* Verify payment and create order */
// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       addressId,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing payment fields",
//       });
//     }

//     if (!addressId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Address is required" });
//     }

//     const sign = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest("hex");

//     if (expectedSign !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature",
//       });
//     }

//     // user + cart
//     const user = await User.findById(req.userId)
//       .populate("cart.product")
//       .select("cart email name addresses");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const address = user.addresses.find((a) => a._id.toString() === addressId);

//     if (!address) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Address not found" });
//     }

//     const items = user.cart.map((c) => ({
//       product: c.product._id,
//       qty: c.qty,
//       price: c.product.price,
//     }));

//     const totalAmount = items.reduce((sum, c) => sum + c.qty * c.price, 0);

//     const newOrder = await Order.create({
//       user: user._id,
//       items,
//       totalAmount,
//       status: "Placed",
//       paymentStatus: "Paid",
//       paymentInfo: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//       },
//       shippingAddress: {
//         fullName: address.fullName,
//         phone: address.phone,
//         street: address.street,
//         city: address.city,
//         state: address.state,
//         pincode: address.pincode,
//         landmark: address.landmark,
//       },
//     });

//     // clear cart
//     user.cart = [];
//     await user.save();

//     // send invoice email (you implement service)
//     try {
//       await sendInvoiceEmail(user, newOrder);
//     } catch (err) {
//       console.error("Invoice email failed:", err.message);
//       // don't block success response
//     }

//     return res.json({
//       success: true,
//       message: "Payment verified • Order created",
//       orderId: newOrder._id,
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default router;
//////////////////////////// with validation
// routes/paymentRoutes.js
// import express from "express";
// import crypto from "crypto";
// import razorpay from "../config/razorpay.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import {
//   createOrderSchema,
//   verifyPaymentSchema,
// } from "../validation/paymentValidation.js";

// import User from "../models/User.js";
// import Order from "../models/Order.js";

// import PDFDocument from "pdfkit";
// import { sendInvoiceEmail } from "../utils/sendInvoiceEmail.js";

// const router = express.Router();

// /* 1. Create Razorpay Order */
// router.post("/create-order", verifyUserCookie, async (req, res) => {
//   const parsed = createOrderSchema.safeParse(req.body);
//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid amount",
//     });
//   }

//   try {
//     const { amount } = parsed.data;

//     const order = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "rcpt_" + Date.now(),
//     });

//     return res.json({ success: true, order });
//   } catch (err) {
//     console.error("Order Error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* 2. Verify Payment + Create DB Order */
// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   const parsed = verifyPaymentSchema.safeParse(req.body);
//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Missing or invalid payment fields",
//     });
//   }

//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     parsed.data;

//   try {
//     // VERIFY SIGNATURE
//     const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest("hex");

//     if (expectedSign !== razorpay_signature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid payment signature" });
//     }

//     // FETCH USER + CART
//     const user = await User.findById(req.userId).populate("cart.product");
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const shippingAddressId = req.cookies.checkout_address;
//     const shippingAddress =
//       user.addresses.find((a) => a._id.toString() === shippingAddressId) ??
//       null;

//     const items = user.cart.map((c) => ({
//       product: c.product._id,
//       qty: c.qty,
//       price: c.product.price,
//     }));

//     const totalAmount = user.cart.reduce(
//       (sum, c) => sum + c.qty * c.product.price,
//       0
//     );

//     // CREATE ORDER IN DB
//     const newOrder = await Order.create({
//       user: user._id,
//       items,
//       totalAmount,
//       paymentInfo: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//       },
//       status: "placed",
//       paymentStatus: "Paid",
//       shippingAddress,
//     });

//     // CLEAR CART + COOKIE
//     user.cart = [];
//     await user.save();
//     res.clearCookie("checkout_address");

//     // ============================
//     // GENERATE INVOICE PDF
//     // ============================
//     const pdfBuffer = await generateInvoice(newOrder, user);

//     doc.on("data", (chunk) => chunks.push(chunk));
//     doc.on("end", async () => {
//       const invoiceBuffer = Buffer.concat(chunks);
//       await sendInvoiceEmail(user.email, newOrder._id, pdfBuffer);
//       // SEND EMAIL
//       await sendInvoiceEmail(user.email, newOrder._id, invoiceBuffer);

//       // RESPOND TO FRONTEND
//       return res.json({
//         success: true,
//         message: "Payment verified • Order created",
//         orderId: newOrder._id,
//       });
//     });

//     // PDF CONTENT
//     doc.fontSize(20).text("MyAZStore Invoice", { align: "center" });
//     doc.moveDown();

//     doc.text(`Order ID: ${newOrder._id}`);
//     doc.text(`Amount: ₹${newOrder.totalAmount}`);
//     doc.text(`Payment ID: ${razorpay_payment_id}`);

//     doc.moveDown();

//     newOrder.items.forEach((i) => {
//       doc.text(`${i.product.name} x ${i.qty} = ₹${i.price * i.qty}`);
//     });

//     doc.end();
//   } catch (err) {
//     console.error("Verify payment failed:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default router;
/////////////////////////////////////////////////////Invoice updated

// api/routes/paymentRoutes.js
// // api/routes/paymentRoutes.js
// import express from "express";
// import crypto from "crypto";
// import razorpay from "../config/razorpay.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import {
//   createOrderSchema,
//   verifyPaymentSchema,
// } from "../validation/paymentValidation.js";

// import User from "../models/User.js";
// import Order from "../models/Order.js";

// import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
// import { sendInvoiceEmail } from "../utils/sendInvoiceEmail.js";

// const router = express.Router();

// /* ----------------------------------------------------
//    1) CREATE Razorpay Order
// ---------------------------------------------------- */
// router.post("/create-order", verifyUserCookie, async (req, res) => {
//   const parsed = createOrderSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid amount",
//     });
//   }

//   try {
//     const { amount } = parsed.data;

//     const options = {
//       amount: amount * 100, // Razorpay requires paise
//       currency: "INR",
//       receipt: "rcpt_" + Date.now(),
//     };

//     const order = await razorpay.orders.create(options);

//     return res.json({ success: true, order });
//   } catch (err) {
//     console.error("Razorpay order creation error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------------
//    2) VERIFY Payment → Create Order + Send Invoice
// ---------------------------------------------------- */
// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   const parsed = verifyPaymentSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Missing or invalid payment fields",
//     });
//   }

//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     parsed.data;

//   try {
//     // Compute HMAC signature to verify payment
//     const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest("hex");

//     if (expectedSign !== razorpay_signature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid payment signature" });
//     }

//     // Fetch user + cart
//     const user = await User.findById(req.userId).populate("cart.product");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // Get shipping address (stored during checkout)
//     const shippingAddressId = req.cookies.checkout_address;

//     const shippingAddress =
//       user.addresses.find((a) => a._id.toString() === shippingAddressId) ??
//       null;

//     // Prepare order items
//     const items = user.cart.map((item) => ({
//       product: item.product._id,
//       qty: item.qty,
//       price: item.product.price,
//     }));

//     const totalAmount = user.cart.reduce(
//       (sum, item) => sum + item.qty * item.product.price,
//       0
//     );

//     // Create order in DB
//     const newOrder = await Order.create({
//       user: user._id,
//       items,
//       totalAmount,
//       paymentInfo: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//       },
//       status: "placed",
//       paymentStatus: "Paid",
//       shippingAddress,
//     });

//     // Clear cart
//     user.cart = [];
//     await user.save();

//     // Clear shipping cookie
//     res.clearCookie("checkout_address");

//     /* ----------------------------------------------------
//        Generate Invoice PDF + Email to user
//     ---------------------------------------------------- */
//     try {
//       const pdfBuffer = await generateInvoicePdf(newOrder, user);

//       await sendInvoiceEmail(user.email, newOrder._id, pdfBuffer);
//     } catch (err) {
//       console.error("Invoice/email failed, but order is OK:", err);
//       // Continue, don't block success response
//     }

//     return res.json({
//       success: true,
//       message: "Payment verified & order created",
//       orderId: newOrder._id,
//     });
//   } catch (err) {
//     console.error("Payment verify error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default router;
//////////////////////////////////////////////////////
////////////////// updated 25--11
// routes/paymentRoutes.js
// import express from "express";
// import crypto from "crypto";
// import razorpay from "../config/razorpay.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import {
//   createOrderSchema,
//   verifyPaymentSchema,
// } from "../validation/paymentValidation.js";

// import User from "../models/User.js";
// import Order from "../models/Order.js";

// const router = express.Router();

// /* ----------------------------------------------------
//    1) CREATE Razorpay Order
// ---------------------------------------------------- */
// router.post("/create-order", verifyUserCookie, async (req, res) => {
//   const parsed = createOrderSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid amount",
//     });
//   }

//   try {
//     const { amount } = parsed.data;

//     const order = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "order_" + Date.now(),
//     });

//     res.json({ success: true, order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------------
//    2) VERIFY Payment → Create Order from SESSION DATA
// ---------------------------------------------------- */
// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   const parsed = verifyPaymentSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid payment verification details",
//     });
//   }

//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     parsed.data;

//   /* ---- Validate Razorpay Signature ---- */
//   const body = razorpay_order_id + "|" + razorpay_payment_id;

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(body)
//     .digest("hex");

//   if (expectedSignature !== razorpay_signature) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid payment signature",
//     });
//   }

//   /* ---- Checkout session must exist ---- */
//   const checkoutSession = req.session.checkout;
//   if (!checkoutSession) {
//     return res.status(400).json({
//       success: false,
//       message: "Checkout session expired",
//     });
//   }

//   /* ---- Fetch user ---- */
//   const user = await User.findById(checkoutSession.user);
//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found",
//     });
//   }

//   /* ---- Get address from user stored earlier ---- */
//   const addressId = checkoutSession.addressId;
//   const address = user.addresses.id(addressId);

//   if (!address) {
//     return res.status(400).json({
//       success: false,
//       message: "Address not found",
//     });
//   }

//   /* ---- Create order ---- */
//   const order = await Order.create({
//     user: checkoutSession.user,
//     items: checkoutSession.items,
//     totalAmount: checkoutSession.totalAmount,
//     paymentStatus: "Paid",
//     status: "placed",
//     shippingAddress: address,
//     paymentInfo: {
//       orderId: razorpay_order_id,
//       paymentId: razorpay_payment_id,
//       signature: razorpay_signature,
//     },
//   });

//   /* ---- Clear session ---- */
//   req.session.checkout = null;

//   res.json({
//     success: true,
//     message: "Order created successfully",
//     orderId: order._id,
//   });
// });

// export default router;

////////////////// updated 26--11
// routes/paymentRoutes.js
import express from "express";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const router = express.Router();

/* -----------------------------------------------------------
   1) CREATE Razorpay Order
----------------------------------------------------------- */
router.post("/create-order", verifyUserCookie, async (req, res) => {
  try {
    const session = req.signedCookies.checkout_session;
    if (!session)
      return res
        .status(400)
        .json({ success: false, message: "Checkout session expired" });

    const { totalAmount } = session;

    // Create Razorpay order using cookie amount
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -----------------------------------------------------------
   2) VERIFY PAYMENT → Create actual order
----------------------------------------------------------- */
router.post("/verify-payment", verifyUserCookie, async (req, res) => {
  try {
    const session = req.signedCookies.checkout_session;

    if (!session)
      return res
        .status(400)
        .json({ success: false, message: "Checkout session expired" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    // Retrieve user data
    const user = await User.findById(session.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const address = user.addresses.id(session.addressId);
    if (!address)
      return res
        .status(400)
        .json({ success: false, message: "Address not found" });

    // Validate items again & reduce stock
    for (const item of session.items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(400).json({
          success: false,
          message: "Product not found: " + item.productId,
        });

      if (product.stock < item.qty)
        return res.json({
          success: false,
          message: `${product.name} is out of stock`,
        });

      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -item.qty } }
      );
    }

    // Create actual order
    const order = await Order.create({
      user: session.userId,
      items: session.items.map((i) => ({
        product: i.productId,
        qty: i.qty,
        price: i.price,
      })),
      totalAmount: session.totalAmount,
      paymentStatus: "Paid",
      status: "placed",
      shippingAddress: address,
      paymentInfo: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    // CLEAR COOKIE
    res.clearCookie("checkout_session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      signed: true,
      domain: ".myazstore.shop",
      path: "/",
    });

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + err.message });
  }
});

export default router;
