// updated with admin all accesss
import express from "express";
import Order from "../models/Order.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// import { generateInvoice } from "../utils/generateInvoice.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";

const router = express.Router();

/* ==========================================================
   ADMIN ROUTES (put FIRST — prevents collision with user routes)
========================================================== */

/* ADMIN: all orders */
// router.get("/", verifyAdminCookie, async (_req, res) => {
//   const orders = await Order.find()
//     .populate("user", "name email")
//     .populate("items.product", "name imageUrl")
//     .sort({ createdAt: -1 });

//   const mapped = orders.map((o) => ({
//     _id: o._id,
//     user: o.user._id,
//     userName: o.user.name,
//     userEmail: o.user.email,
//     items: o.items,
//     totalAmount: o.totalAmount,
//     status: o.status,
//     paymentStatus: o.paymentStatus,
//     paymentInfo: o.paymentInfo,
//     createdAt: o.createdAt,
//     updatedAt: o.updatedAt,
//   }));

//// Updated with 505 error
// routes/orderRoutes.js — ADMIN GET ALL (SAFE FOREVER)
router.get("/", verifyAdminCookie, async (req, res) => {
  try {
    // const orders = await Order.find()
    //   .populate("user", "name email")
    //   .populate("items.product", "name imageUrl")
    //   .sort({ createdAt: -1 });
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name imageUrl")
      .sort({ createdAt: -1 })
      .lean(); // ← makes it 2–3x faster + safer

    // SAFE MAPPING — handles ALL null cases
    const safeOrders = orders.map((order) => {
      // Safe user
      const user = order.user || {
        name: "Deleted User",
        email: "N/A",
        _id: null,
      };

      // Safe items
      const safeItems = (order.items || []).map((item) => {
        const product = item.product || {
          name: "Product Deleted",
          imageUrl: "/placeholder.jpg",
        };
        return {
          productId: product._id || null,
          productName: product.name,
          productImage: product.imageUrl,
          qty: item.qty || 0,
          price: item.price || 0,
        };
      });

      return {
        _id: order._id.toString(),
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        items: safeItems,
        totalAmount: Number(order.totalAmount) || 0, // ← SAFE NUMBER
        status: order.status || "pending",
        paymentStatus: order.paymentStatus || "Unpaid",
        paymentInfo: order.paymentInfo || null,
        shippingAddress: order.shippingAddress || {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    res.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//   res.json({ success: true, orders: mapped });
// });

/* ADMIN: Get Single Order (fix for order manage page) */
router.get("/admin/order/:orderId", verifyAdminCookie, async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate(
    "items.product"
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({ success: true, order });
});

/* Admin Dashboard Status */

/* ADMIN: Invoice */
router.get("/admin/invoice/:orderId", verifyAdminCookie, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "items.product"
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    generateInvoicePdf(res, order, {
      fileName: `Invoice-${order.orderId}.pdf`,
    });
  } catch (err) {
    console.error("Admin Invoice Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate invoice" });
  }
});

/* ADMIN: update order status */
router.put("/update-status/:orderId", verifyAdminCookie, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowed = [
    "placed",
    "processing",
    "shipping",
    "delivered",
    "cancelled",
  ];

  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  order.status = status;
  await order.save();

  res.json({ success: true, message: "Status updated" });
});

/* ==========================================================
   USER ROUTES (must come LAST)
========================================================== */

router.get("/my-orders", verifyUserCookie, async (req, res) => {
  const orders = await Order.find({ user: req.userId })
    .populate("items.product", "name imageUrl price")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
});

router.get("/:orderId", verifyUserCookie, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.userId,
  }).populate("items.product");

  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order });
});

/* USER: invoice */
// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     }).populate("items.product");

//     if (!order)
//       return res
//         .status(404)
//         .json({ success: false, message: "Invoice not found" });

//     generateInvoicePdf(res, order);
//   } catch (err) {
//     console.error("User invoice error:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.userId,
    })
      .populate("items.product")
      .lean();

    if (!order) return res.status(404).send("Invoice not found");

    generateInvoicePdf(res, order); // streams PDF directly
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate invoice");
  }
});

export default router;

////////////////////////////////////////////////1:50am
// import express from "express";
// import Order from "../models/Order.js";

// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";

// import { generateInvoice } from "../utils/generateInvoice.js";

// const router = express.Router();

// /* -------------------------------------------------------
//    USER — GET All My Orders
// ------------------------------------------------------- */
// router.get("/my-orders", verifyUserCookie, async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.userId })
//       .populate("items.product", "name imageUrl price")
//       .sort({ createdAt: -1 });

//     return res.json({ success: true, orders });
//   } catch (err) {
//     console.error("My Orders Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to load orders" });
//   }
// });

// /* -------------------------------------------------------
//    USER — GET Single Order
// ------------------------------------------------------- */
// router.get("/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     }).populate("items.product", "name imageUrl price");

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     return res.json({ success: true, order });
//   } catch (err) {
//     console.error("Single Order Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to load order" });
//   }
// });

// /* -------------------------------------------------------
//    ADMIN — GET All Orders
// ------------------------------------------------------- */
// router.get("/", verifyAdminCookie, async (_req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email")
//       .populate("items.product", "name imageUrl")
//       .sort({ createdAt: -1 });

//     const mapped = orders.map((o) => ({
//       _id: o._id,
//       user: o.user._id,
//       userName: o.user.name,
//       userEmail: o.user.email,
//       items: o.items,
//       totalAmount: o.totalAmount,
//       status: o.status,
//       paymentStatus: o.paymentStatus,
//       paymentInfo: o.paymentInfo,
//       createdAt: o.createdAt,
//       updatedAt: o.updatedAt,
//     }));

//     return res.json({ success: true, orders: mapped });
//   } catch (err) {
//     console.error("Admin Orders Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch orders" });
//   }
// });

// /* -------------------------------------------------------
//    USER — Cancel Order
// ------------------------------------------------------- */
// router.put("/cancel/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     });

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     if (["delivered", "cancelled"].includes(order.status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Order cannot be cancelled",
//       });
//     }

//     order.status = "cancelled";
//     await order.save();

//     return res.json({ success: true, message: "Order cancelled" });
//   } catch (err) {
//     console.error("Cancel Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to cancel order" });
//   }
// });

// /* -------------------------------------------------------
//    ADMIN — Update Order Status
// ------------------------------------------------------- */
// router.put("/update-status/:orderId", verifyAdminCookie, async (req, res) => {
//   try {
//     const allowed = [
//       "placed",
//       "processing",
//       "shipping",
//       "delivered",
//       "cancelled",
//     ];

//     if (!allowed.includes(req.body.status)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid status" });
//     }

//     const order = await Order.findById(req.params.orderId);
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     order.status = req.body.status;
//     await order.save();

//     return res.json({ success: true, message: "Status updated" });
//   } catch (err) {
//     console.error("Status Update Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to update status" });
//   }
// });

// /* -------------------------------------------------------
//    USER — Download Invoice (their own order)
// ------------------------------------------------------- */
// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     }).populate("items.product", "name price imageUrl");

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invoice not found" });
//     }

//     const pdfBuffer = await generateInvoice(order);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Invoice-${order._id}.pdf`
//     );

//     return res.send(pdfBuffer);
//   } catch (err) {
//     console.error("Invoice Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

// /* -------------------------------------------------------
//    ADMIN — Download ANY Invoice
// ------------------------------------------------------- */
// router.get("/admin/invoice/:orderId", verifyAdminCookie, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.orderId).populate(
//       "items.product",
//       "name price imageUrl"
//     );

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     const pdfBuffer = await generateInvoice(order);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Invoice-${order._id}.pdf`
//     );

//     return res.send(pdfBuffer);
//   } catch (err) {
//     console.error("Admin Invoice Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

// export default router;

// import express from "express";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import Order from "../models/Order.js";

// const router = express.Router();
// // Admin: Update Order Status
// router.put("/admin/update-status/:orderId", async (req, res) => {
//   try {
//     // TODO: Add verifyAdmin middleware
//     const { status } = req.body;

//     const order = await Order.findById(req.params.orderId);
//     if (!order)
//       return res.status(404).json({ success: false, message: "Not found" });

//     order.status = status;
//     await order.save();

//     return res.json({ success: true, message: "Status updated" });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // User must be logged-in
// router.use(verifyUserCookie);

// /* ============================================================
//    GET ALL ORDERS FOR LOGGED-IN USER
//    ============================================================ */
// router.get("/my-orders", async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.userId })
//       .populate("items.product")
//       .sort({ createdAt: -1 });

//     return res.json({ success: true, orders });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ============================================================
//    GET SINGLE ORDER DETAILS
//    ============================================================ */
// router.get("/:orderId", async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     }).populate("items.product");

//     if (!order)
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });

//     return res.json({ success: true, order });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });
// // Cancel Order
// router.put("/cancel/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     });

//     if (!order)
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });

//     if (
//       order.status === "Shipped" ||
//       order.status === "Out for Delivery" ||
//       order.status === "Delivered"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Order can’t be cancelled now",
//       });
//     }

//     order.status = "Cancelled";
//     await order.save();

//     return res.json({ success: true, message: "Order cancelled successfully" });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });
// InVoice
// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   const order = await Order.findById(req.params.orderId).populate(
//     "items.product"
//   );

//   const PDFDocument = require("pdfkit");

//   const doc = new PDFDocument();
//   res.setHeader("Content-Type", "application/pdf");
//   doc.pipe(res);

//   doc.fontSize(24).text("MyAZStore Invoice", { align: "center" });
//   doc.moveDown();

//   doc.fontSize(16).text(`Order ID: ${order._id}`);
//   doc.text(`Amount Paid: ₹${order.totalAmount}`);
//   doc.text(`Status: ${order.status}`);
//   doc.moveDown();

//   order.items.forEach((i) => {
//     doc.fontSize(12).text(`${i.product.name} x ${i.qty} = ₹${i.qty * i.price}`);
//   });

//   doc.end();
// });

// export default router;

////////////////////after validation
// routes/orderRoutes.js
// import express from "express";
// import Order from "../models/Order.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// // const PDFDocument = require("pdfkit");
// import PDFDocument from "pdfkit"; // put at top
// const router = express.Router();

// /* USER: List their orders */
// router.get("/my-orders", verifyUserCookie, async (req, res) => {
//   const orders = await Order.find({ user: req.userId })
//     .populate("items.product", "name imageUrl price")
//     .sort({ createdAt: -1 });

//   res.json({ success: true, orders });
// });

// /* USER: Single order details */
// router.get("/:orderId", verifyUserCookie, async (req, res) => {
//   const { orderId } = req.params;

//   const order = await Order.findOne({
//     _id: orderId,
//     user: req.userId,
//   }).populate("items.product", "name imageUrl price");

//   if (!order)
//     return res.status(404).json({ success: false, message: "Order not found" });

//   res.json({ success: true, order });
// });

// /* ADMIN: all orders */
// router.get("/", verifyAdminCookie, async (_req, res) => {
//   const orders = await Order.find()
//     .populate("user", "name email")
//     .populate("items.product", "name imageUrl")
//     .sort({ createdAt: -1 });

//   const mapped = orders.map((o) => ({
//     _id: o._id,
//     user: o.user._id,
//     userName: o.user.name,
//     userEmail: o.user.email,
//     items: o.items,
//     totalAmount: o.totalAmount,
//     status: o.status,
//     paymentStatus: o.paymentStatus,
//     paymentInfo: o.paymentInfo,
//     createdAt: o.createdAt,
//     updatedAt: o.updatedAt,
//   }));

//   res.json({ success: true, orders: mapped });
// });

// /* USER: cancel */
// router.put("/cancel/:orderId", verifyUserCookie, async (req, res) => {
//   const { orderId } = req.params;

//   const order = await Order.findOne({
//     _id: orderId,
//     user: req.userId,
//   });

//   if (!order)
//     return res.status(404).json({ success: false, message: "Order not found" });

//   if (["delivered", "cancelled"].includes(order.status)) {
//     return res.status(400).json({
//       success: false,
//       message: "Order cannot be cancelled",
//     });
//   }

//   order.status = "cancelled";
//   await order.save();

//   res.json({ success: true, message: "Order cancelled" });
// });

// /* ADMIN: update status */
// router.put("/update-status/:orderId", verifyAdminCookie, async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body;

//   const allowed = [
//     "placed",
//     "processing",
//     "shipping",
//     "delivered",
//     "cancelled",
//   ];
//   if (!allowed.includes(status)) {
//     return res.status(400).json({ success: false, message: "Invalid status" });
//   }

//   const order = await Order.findById(orderId);
//   if (!order)
//     return res.status(404).json({ success: false, message: "Order not found" });

//   order.status = status;
//   await order.save();

//   res.json({ success: true, message: "Status updated" });
// });

// // ==========================
// // INVOICE (User Only)
// // ==========================

// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     // 1. Fetch only if the order belongs to logged-in user
//     const order = await Order.findOne({
//       _id: orderId,
//       user: req.userId,
//     }).populate("items.product");

//     // 2. If order not found
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invoice not found" });
//     }

//     // 3. PDF Setup
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Invoice-${orderId}.pdf`
//     );

//     const doc = new PDFDocument({ margin: 40 });

//     doc.pipe(res);

//     // ---------------- HEADER ----------------
//     doc.rect(0, 0, doc.page.width, 60).fill("#2563eb");
//     doc
//       .fillColor("white")
//       .fontSize(22)
//       .font("Helvetica-Bold")
//       .text("MyAZStore Invoice", 40, 20);

//     doc.fillColor("black").moveDown(2);

//     // ---------------- ORDER INFO ----------------
//     doc.fontSize(14).font("Helvetica-Bold").text("Order Details").moveDown(0.5);

//     doc
//       .fontSize(12)
//       .font("Helvetica")
//       .text(`Order ID: ${order._id}`)
//       .text(`Date: ${new Date(order.createdAt).toLocaleString()}`)
//       .text(`Payment ID: ${order.paymentInfo.paymentId}`)
//       .text(`Status: ${order.status}`)
//       .moveDown(1);

//     // ---------------- CUSTOMER INFO ----------------
//     const a = order.shippingAddress;
//     doc
//       .fontSize(14)
//       .font("Helvetica-Bold")
//       .text("Shipping Address")
//       .moveDown(0.5);

//     doc
//       .fontSize(12)
//       .font("Helvetica")
//       .text(a.fullName)
//       .text(a.phone)
//       .text(`${a.street}`)
//       .text(`${a.city}, ${a.state} - ${a.pincode}`)
//       .text(a.landmark ? `Landmark: ${a.landmark}` : "")
//       .moveDown(1);

//     // ---------------- ITEMS ----------------
//     doc.fontSize(14).font("Helvetica-Bold").text("Items").moveDown(0.5);

//     order.items.forEach((item) => {
//       doc
//         .fontSize(12)
//         .font("Helvetica")
//         .text(
//           `${item.product.name} — Qty: ${item.qty} — ₹${item.price * item.qty}`,
//           { lineGap: 4 }
//         );
//     });

//     doc.moveDown(1);

//     // ---------------- TOTAL ----------------
//     doc.fontSize(14).font("Helvetica-Bold").text("Total Amount:");
//     doc
//       .fontSize(12)
//       .font("Helvetica")
//       .text(`₹${order.totalAmount.toLocaleString()}`);

//     doc.end();
//   } catch (err) {
//     console.error("Invoice error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

// // =============================
// // ADMIN INVOICE (full access)
// // =============================
// router.get("/admin/invoice/:orderId", verifyAdminCookie, async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId).populate("items.product");
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Invoice-${orderId}.pdf`
//     );

//     const doc = new PDFDocument({ margin: 40 });

//     doc.pipe(res);

//     // ---- HEADER ----
//     doc.rect(0, 0, doc.page.width, 60).fill("#2563eb");
//     doc
//       .fillColor("white")
//       .fontSize(22)
//       .font("Helvetica-Bold")
//       .text("MyAZStore Invoice", 40, 20);

//     doc.fillColor("black").moveDown(2);

//     // ---- ORDER INFO ----
//     doc.fontSize(14).font("Helvetica-Bold").text("Order Details").moveDown(0.5);
//     doc.fontSize(12).font("Helvetica");
//     doc.text(`Order ID: ${order._id}`);
//     doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
//     doc.text(`Payment: ${order.paymentInfo.paymentId}`);
//     doc.moveDown();

//     // ---- ITEMS ----
//     doc.fontSize(14).font("Helvetica-Bold").text("Items").moveDown(0.5);

//     order.items.forEach((i) => {
//       doc
//         .fontSize(12)
//         .font("Helvetica")
//         .text(`${i.product.name} — Qty: ${i.qty} — ₹${i.price * i.qty}`, {
//           lineGap: 4,
//         });
//     });

//     doc.moveDown();

//     // ---- TOTAL ----
//     doc.fontSize(14).font("Helvetica-Bold").text("Total Amount:");
//     doc.fontSize(12).font("Helvetica").text(`₹${order.totalAmount}`);

//     doc.end();
//   } catch (err) {
//     console.error("Admin Invoice Error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

// export default router;
////////////////////////////Refactor
// api/routes/orderRoutes.js
