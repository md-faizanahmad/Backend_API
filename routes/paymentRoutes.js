////////////////// updated 26--11
// routes/paymentRoutes.js
import express from "express";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { generateInvoiceBuffer } from "../utils/generateInvoiceBuffer.js";
import { createNotification } from "../utils/createNotification.js";
// import { sendEmail } from "../utils/sendEmail.js";
import { sendInvoiceEmail } from "../utils/sendInvoiceEmail.js";

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

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -----------------------------------------------------------
   2) VERIFY PAYMENT → Create actual order
----------------------------------------------------------- */
// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   try {
//     const session = req.signedCookies.checkout_session;

//     if (!session)
//       return res
//         .status(400)
//         .json({ success: false, message: "Checkout session expired" });

//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;

//     // Validate Razorpay signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Razorpay signature",
//       });
//     }

//     // Retrieve user data
//     const user = await User.findById(session.userId);
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });

//     const address = user.addresses.id(session.addressId);
//     if (!address)
//       return res
//         .status(400)
//         .json({ success: false, message: "Address not found" });

//     // Validate items again & reduce stock
//     for (const item of session.items) {
//       const product = await Product.findById(item.productId);
//       if (!product)
//         return res.status(400).json({
//           success: false,
//           message: "Product not found: " + item.productId,
//         });

//       if (product.stock < item.qty)
//         return res.json({
//           success: false,
//           message: `${product.name} is out of stock`,
//         });

//       await Product.updateOne(
//         { _id: product._id },
//         { $inc: { stock: -item.qty } }
//       );
//     }

//     // Create actual order
//     const order = await Order.create({
//       user: session.userId,
//       items: session.items.map((i) => ({
//         product: i.productId,
//         qty: i.qty,
//         price: i.price,
//       })),
//       totalAmount: session.totalAmount,
//       paymentStatus: "Paid",
//       status: "placed",
//       shippingAddress: address,
//       paymentInfo: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//         signature: razorpay_signature,
//       },
//     });

//     // admin notification
//     createNotification({
//       type: "new_order",
//       title: "New Order Received",
//       message: `Order #${order.paymentInfo.orderId} was placed`,
//       link: `/dashboard/orders/${order._id}`,
//     });

//     // CLEAR COOKIE
//     res.clearCookie("checkout_session", {
//       httpOnly: true,
//       secure: true,
//       sameSite: "none",
//       signed: true,
//       domain: ".myazstore.shop",
//       path: "/",
//     });

//     res.json({ success: true, orderId: order._id });
//   } catch (err) {
//     console.error("VERIFY PAYMENT ERROR:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Server error: " + err.message });
//   }
// });

///////////// update with route and email
// routes/paymentRoutes.js

// router.post("/verify-payment", verifyUserCookie, async (req, res) => {
//   try {
//     const session = req.signedCookies.checkout_session;

//     if (!session) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Checkout session expired" });
//     }

//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;

//     /* -------------------------------------------------
//        VERIFY RAZORPAY SIGNATURE
//     -------------------------------------------------- */
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Razorpay signature",
//       });
//     }

//     /* -------------------------------------------------
//        FETCH USER + ADDRESS
//     -------------------------------------------------- */
//     const user = await User.findById(session.userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const address = user.addresses.id(session.addressId);
//     if (!address) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Address not found" });
//     }

//     /* -------------------------------------------------
//        VALIDATE ITEMS & REDUCE STOCK
//     -------------------------------------------------- */
//     for (const item of session.items) {
//       const product = await Product.findById(item.productId);
//       if (!product) {
//         return res.status(400).json({
//           success: false,
//           message: `Product not found: ${item.productId}`,
//         });
//       }

//       if (product.stock < item.qty) {
//         return res.status(400).json({
//           success: false,
//           message: `${product.name} is out of stock`,
//         });
//       }

//       await Product.updateOne(
//         { _id: product._id },
//         { $inc: { stock: -item.qty } }
//       );
//     }

//     /* -------------------------------------------------
//        CREATE ORDER
//     -------------------------------------------------- */
//     const order = await Order.create({
//       user: user._id,
//       items: session.items.map((i) => ({
//         product: i.productId,
//         qty: i.qty,
//         price: i.price,
//       })),
//       totalAmount: session.totalAmount,
//       paymentStatus: "Paid",
//       status: "placed",
//       shippingAddress: address,
//       paymentInfo: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//         signature: razorpay_signature,
//       },
//     });

//     /* -------------------------------------------------
//        ADMIN NOTIFICATION (NON-BLOCKING)
//     -------------------------------------------------- */
//     createNotification({
//       type: "new_order",
//       title: "New Order Received",
//       message: `Order #${order.paymentInfo.orderId} was placed`,
//       link: `/dashboard/orders/${order._id}`,
//     }).catch(() => {});

//     /* -------------------------------------------------
//        CLEAR CHECKOUT COOKIE
//     -------------------------------------------------- */
//     res.clearCookie("checkout_session", {
//       httpOnly: true,
//       secure: true,
//       sameSite: "none",
//       signed: true,
//       domain: ".myazstore.shop",
//       path: "/",
//     });

//     /* -------------------------------------------------
//        RESPOND SUCCESS (DO NOT WAIT FOR EMAIL)
//     -------------------------------------------------- */
//     res.json({ success: true, orderId: order._id });

//     /* -------------------------------------------------
//        SEND EMAIL + INVOICE (BACKGROUND SAFE)
//     -------------------------------------------------- */
//     (async () => {
//       try {
//         const userEmail = await User.findById(order.user).select("email name");
//         if (!userEmail?.email) {
//           console.warn("Invoice email skipped: user email missing");
//           return;
//         }

//         const pdfBuffer = await generateInvoiceBuffer(order);

//         await sendEmail({
//           to: userEmail.email,
//           subject: `Invoice for Order ${order._id}`,
//           html: `
//             <p>Hi ${userEmail.name || "Customer"},</p>
//             <p>Your order has been placed successfully.</p>
//             <p>Please find your invoice attached.</p>
//           `,
//           attachments: [
//             {
//               filename: `invoice-${order._id}.pdf`,
//               content: pdfBuffer,
//             },
//           ],
//         });
//       } catch (err) {
//         console.error("POST-PAYMENT EMAIL FAILED:", err);
//       }
//     })();
//   } catch (err) {
//     console.error("VERIFY PAYMENT ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

////////////////// update with invoice
router.post("/verify-payment", verifyUserCookie, async (req, res) => {
  try {
    const session = req.signedCookies.checkout_session;

    if (!session) {
      return res
        .status(400)
        .json({ success: false, message: "Checkout session expired" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    /* -------------------------------
       VERIFY RAZORPAY SIGNATURE
    -------------------------------- */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

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

    /* -------------------------------
       LOAD USER + ADDRESS
    -------------------------------- */
    const user = await User.findById(session.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(session.addressId);
    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Address not found" });
    }

    /* -------------------------------
       VALIDATE STOCK
    -------------------------------- */
    for (const item of session.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -item.qty } }
      );
    }

    /* -------------------------------
       CREATE ORDER
    -------------------------------- */
    const order = await Order.create({
      user: user._id,
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
    createNotification({
      type: "new_order",
      title: "New Order Received",
      message: `Order #${order.paymentInfo.orderId} was placed`,
      link: `/dashboard/orders/${order._id}`,
    }).catch(() => {});
    /* -------------------------------
       GENERATE INVOICE (BUFFER)
    -------------------------------- */
    const pdfBuffer = await generateInvoiceBuffer(order);

    /* -------------------------------
       SEND EMAIL WITH ATTACHMENT
    -------------------------------- */
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <!-- CONTAINER -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:#0f172a; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; font-size:22px; margin:0; letter-spacing:1px;">
                MyAZ Store
              </h1>
              <p style="color:#cbd5e1; margin:6px 0 0; font-size:13px;">
                Order Confirmation
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:28px;">
              <p style="font-size:16px; color:#111827; margin:0 0 12px;">
                Hi <strong>${user.name || "Customer"}</strong>,
              </p>

              <p style="font-size:14px; color:#374151; margin:0 0 14px;">
                Your order has been placed successfully 🎉
              </p>

              <p style="font-size:14px; color:#374151; margin:0 0 18px;">
                We've attached your invoice to this email for your reference.
              </p>

              <!-- ORDER INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:14px; margin-bottom:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280;">
                    Order ID
                  </td>
                  <td align="right" style="font-size:13px; color:#111827; font-weight:600;">
                    ${order._id}
                  </td>
                </tr>
              </table>

              <p style="font-size:14px; color:#374151; margin:0;">
                We'll notify you once your order is shipped.
              </p>

              <p style="font-size:14px; color:#374151; margin:16px 0 0;">
                Thank you for shopping with <strong>MyAZ Store</strong>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb; padding:18px; text-align:center;">
              <p style="font-size:12px; color:#6b7280; margin:0;">
                Need help? Contact us at
                <a href="mailto:support@myazstore.shop" style="color:#2563eb; text-decoration:none;">
                  support@myazstore.shop
                </a>
              </p>

              <p style="font-size:11px; color:#9ca3af; margin:8px 0 0;">
                © ${new Date().getFullYear()} MyAZ Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await sendInvoiceEmail({
      to: user.email,
      subject: `Invoice for Order ${order._id}`,
      // html: `
      //   <p>Hi ${user.name || "Customer"},</p>
      //   <p>Your order has been placed successfully.</p>
      //   <p>Please find your invoice attached.</p>
      //   <p>Thank you for shopping with MyAZ Store.</p>
      // `,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice-${order._id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    /* -------------------------------
       CLEAR CHECKOUT COOKIE
    -------------------------------- */
    res.clearCookie("checkout_session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      signed: true,
      domain: ".myazstore.shop",
      path: "/",
    });

    return res.json({
      success: true,
      orderId: order._id,
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
});

export default router;
