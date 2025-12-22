// // updated with admin all accesss
// import express from "express";
// import Order from "../models/Order.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";

// const router = express.Router();

// /* ==========================================================
//    ADMIN ROUTES (put FIRST — prevents collision with user routes)
// ========================================================== */

// //// Updated with 505 error
// // routes/orderRoutes.js — ADMIN GET ALL (SAFE FOREVER)
// router.get("/", verifyAdminCookie, async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email")
//       .populate("items.product", "name imageUrl")
//       .sort({ createdAt: -1 })
//       .lean(); // ← makes it 2–3x faster + safer

//     // SAFE MAPPING — handles ALL null cases
//     const safeOrders = orders.map((order) => {
//       // Safe user
//       const user = order.user || {
//         name: "Deleted User",
//         email: "N/A",
//         _id: null,
//       };

//       // Safe items
//       const safeItems = (order.items || []).map((item) => {
//         const product = item.product || {
//           name: "Product Deleted",
//           imageUrl: "/placeholder.jpg",
//         };
//         return {
//           productId: product._id || null,
//           productName: product.name,
//           productImage: product.imageUrl,
//           qty: item.qty || 0,
//           price: item.price || 0,
//         };
//       });

//       return {
//         _id: order._id.toString(),
//         user: user._id,
//         userName: user.name,
//         userEmail: user.email,
//         items: safeItems,
//         totalAmount: Number(order.totalAmount) || 0, // ← SAFE NUMBER
//         status: order.status || "pending",
//         paymentStatus: order.paymentStatus || "Unpaid",
//         paymentInfo: order.paymentInfo || null,
//         shippingAddress: order.shippingAddress || {},
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//       };
//     });

//     res.json({
//       success: true,
//       count: safeOrders.length,
//       orders: safeOrders,
//     });
//   } catch (error) {
//     console.error("Admin orders error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });

// //   res.json({ success: true, orders: mapped });
// // });

// /* ADMIN: Get Single Order (fix for order manage page) */
// router.get("/admin/order/:orderId", verifyAdminCookie, async (req, res) => {
//   const order = await Order.findById(req.params.orderId).populate(
//     "items.product"
//   );

//   if (!order) {
//     return res.status(404).json({ success: false, message: "Order not found" });
//   }

//   res.json({ success: true, order });
// });

// /* Admin Dashboard Status */

// /* ADMIN: Invoice */
// router.get("/admin/invoice/:orderId", verifyAdminCookie, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.orderId).populate(
//       "items.product"
//     );

//     if (!order)
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });

//     generateInvoicePdf(res, order, {
//       fileName: `Invoice-${order.orderId}.pdf`,
//     });
//   } catch (err) {
//     console.error("Admin Invoice Error:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to generate invoice" });
//   }
// });

// /* ADMIN: update order status */
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

// /* ==========================================================
//    USER ROUTES (must come LAST)
// ========================================================== */

// router.get("/my-orders", verifyUserCookie, async (req, res) => {
//   const orders = await Order.find({ user: req.userId })
//     .populate("items.product", "name imageUrl price")
//     .sort({ createdAt: -1 });

//   res.json({ success: true, orders });
// });

// router.get("/:orderId", verifyUserCookie, async (req, res) => {
//   const order = await Order.findOne({
//     _id: req.params.orderId,
//     user: req.userId,
//   }).populate("items.product");

//   if (!order)
//     return res.status(404).json({ success: false, message: "Order not found" });

//   res.json({ success: true, order });
// });

// /* USER: invoice */

// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.orderId,
//       user: req.userId,
//     })
//       .populate("items.product")
//       .lean();

//     if (!order) return res.status(404).send("Invoice not found");

//     generateInvoicePdf(res, order); // streams PDF directly
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to generate invoice");
//   }
// });

// export default router;

/////////////////////// all working above just pagination adding properly
/**
 * orderRoutes.js
 * Updated on: 14 Dec 2025
 *
 * Change summary:
 * - Added server-side pagination for ADMIN orders and USER orders
 * - No change to access control, route structure, or existing logic
 * - Existing UI will continue to work
 * - Pagination metadata added for future UI use
 */

import express from "express";
import Order from "../models/Order.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";

const router = express.Router();

/* ==========================================================
   ADMIN ROUTES (put FIRST — prevents collision with user routes)
========================================================== */

/**
 * ADMIN: Get all orders (PAGINATED)
 * - page (default: 1)
 * - limit (default: 10, max: 50)
 */
router.get("/", verifyAdminCookie, async (req, res) => {
  try {
    // Pagination params
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Fetch paginated orders + total count
    const [orders, totalCount] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .populate("items.product", "name imageUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // faster + safer
      Order.countDocuments(),
    ]);

    // SAFE MAPPING — handles ALL null cases (unchanged logic)
    const safeOrders = orders.map((order) => {
      const user = order.user || {
        name: "Deleted User",
        email: "N/A",
        _id: null,
      };

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
        totalAmount: Number(order.totalAmount) || 0,
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
      orders: safeOrders,
      page,
      limit,
      totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ==========================================================
   ADMIN: Get Single Order
========================================================== */
router.get("/admin/order/:orderId", verifyAdminCookie, async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate("items.product", "name imageUrl price")
    .populate("user", "name email");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({ success: true, order });
});

/* ==========================================================
   ADMIN: Invoice
========================================================== */
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

/* ==========================================================
   ADMIN: Update Order Status
========================================================== */
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

/**
 * USER: My Orders (PAGINATED)
 * - page (default: 1)
 * - limit (default: 10, max: 20)
 */
router.get("/my-orders", verifyUserCookie, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      Order.find({ user: req.userId })
        .populate("items.product", "name imageUrl price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: req.userId }),
    ]);

    res.json({
      success: true,
      orders,
      page,
      limit,
      totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    console.error("User orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ==========================================================
   USER: Get Single Order
========================================================== */
// router.get("/:orderId", verifyUserCookie, async (req, res) => {
//   const order = await Order.findOne({
//     _id: req.params.orderId,
//     user: req.userId,
//   }).populate("items.product");

//   if (!order)
//     return res.status(404).json({ success: false, message: "Order not found" });

//   res.json({ success: true, order });
// });
//// Fixed user with id cant see all fields
router.get("/:orderId", verifyUserCookie, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.userId,
  }).populate({
    path: "items.product",
    select:
      "-isArchived -archivedAt -isDeleted -deletedAt -costPrice  -isOutOfStock -stockStatus",
  });

  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order });
});

/* ==========================================================
   USER: Invoice
========================================================== */
router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.userId,
    })
      .populate("items.product")
      .lean();

    if (!order) return res.status(404).send("Invoice not found");

    generateInvoicePdf(res, order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate invoice");
  }
});

export default router;
