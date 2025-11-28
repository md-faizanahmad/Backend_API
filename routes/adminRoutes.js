import express from "express";
import {
  login,
  logout,
  me,
  updateAdminProfile,
} from "../controllers/adminController.js";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import { getDashboardCharts } from "../controllers/adminChartsController.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { getCustomersAnalytics } from "../controllers/adminCustomerAnalyticsController.js";
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyAdminCookie, me);
router.put("/update", verifyAdminCookie, updateAdminProfile);

// Dashboard stats
router.get("/dashboard/stats", verifyAdminCookie, getDashboardStats);

// Charts
router.get("/dashboard/charts", verifyAdminCookie, getDashboardCharts);

// Customers analytics
router.get("/customers/analytics", verifyAdminCookie, getCustomersAnalytics);

// User list
router.get("/customers", verifyAdminCookie, async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, users });
});

// User details
router.get("/customers/:id", verifyAdminCookie, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  res.json({ success: true, user });
});

// Admin Invoice
router.get("/orders/:id/invoice", verifyAdminCookie, async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  const buffer = await generateInvoicePdf(order);
  res.setHeader("Content-Type", "application/pdf");
  res.send(buffer);
});

//// news
// Admin Order Stats
// In your adminRoutes.js → replace the old route with this
// adminRoutes.js → replace your current route with this masterpiece
// router.get("/dashboard/stats", verifyAdminCookie, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const [result] = await Order.aggregate([
//       {
//         $facet: {
//           // 1. Orders
//           orders: [
//             { $match: {} },
//             {
//               $group: {
//                 _id: null,
//                 totalOrders: { $sum: 1 },
//                 todayOrders: {
//                   $sum: { $cond: [{ $gte: ["$createdAt", today] }, 1, 0] },
//                 },
//                 totalRevenue: {
//                   $sum: {
//                     $cond: [
//                       { $eq: ["$paymentStatus", "Paid"] },
//                       "$totalAmount",
//                       0,
//                     ],
//                   },
//                 },
//               },
//             },
//           ],

//           // 2. Order status counts (with "shipping" → "shipped")
//           status: [
//             {
//               $group: {
//                 _id: {
//                   $switch: {
//                     branches: [
//                       {
//                         case: { $eq: ["$status", "shipping"] },
//                         then: "shipped",
//                       },
//                       {
//                         case: { $eq: ["$status", "processing"] },
//                         then: "processing",
//                       },
//                       {
//                         case: { $eq: ["$status", "delivered"] },
//                         then: "delivered",
//                       },
//                       {
//                         case: { $eq: ["$status", "cancelled"] },
//                         then: "cancelled",
//                       },
//                       {
//                         case: { $eq: ["$status", "pending"] },
//                         then: "pending",
//                       },
//                     ],
//                     default: "unknown",
//                   },
//                 },
//                 count: { $sum: 1 },
//               },
//             },
//           ],

//           // 3. Products, Categories, Users → just counts!
//           counts: [
//             {
//               $group: {
//                 _id: null,
//                 totalProducts: { $sum: 0 }, // we'll get from separate models
//                 totalCategories: { $sum: 0 },
//                 totalUsers: { $sum: 0 },
//               },
//             },
//           ],
//         },
//       },
//     ]);

//     // Get real counts from their collections (fast!)
//     const [productsCount, categoriesCount, usersCount] = await Promise.all([
//       Product.countDocuments(),
//       Category.countDocuments(),
//       User.countDocuments(), // exclude admins
//     ]);

//     const orders = result.orders[0] || {
//       totalOrders: 0,
//       todayOrders: 0,
//       totalRevenue: 0,
//     };
//     const statusMap = Object.fromEntries(
//       (result.status || []).map((s) => [s._id, s.count])
//     );

//     res.json({
//       success: true,
//       data: {
//         totalOrders: orders.totalOrders,
//         todayOrders: orders.todayOrders,
//         totalRevenue: orders.totalRevenue,

//         pending: statusMap.pending || 0,
//         processing: statusMap.processing || 0,
//         shipped: statusMap.shipped || 0,
//         delivered: statusMap.delivered || 0,
//         cancelled: statusMap.cancelled || 0,

//         // NEW: Fast counts — no full data!
//         totalProducts: productsCount,
//         totalCategories: categoriesCount,
//         totalUsers: usersCount,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// ///Admin Charts
// // routes/adminRoutes.js → add this route
// router.get("/dashboard/charts", verifyAdminCookie, async (req, res) => {
//   try {
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     const [last7Days, statusBreakdown, monthlyTotal] = await Promise.all([
//       Order.aggregate([
//         {
//           $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: "Paid" },
//         },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             revenue: { $sum: "$totalAmount" },
//           },
//         },
//         { $sort: { _id: 1 } },
//       ]),

//       Order.aggregate([
//         {
//           $group: {
//             _id: "$status",
//             count: { $sum: 1 },
//           },
//         },
//       ]),

//       Order.aggregate([
//         {
//           $match: {
//             createdAt: {
//               $gte: new Date(
//                 new Date().getFullYear(),
//                 new Date().getMonth(),
//                 1
//               ),
//             },
//             paymentStatus: "Paid",
//           },
//         },
//         { $group: { _id: null, total: { $sum: "$totalAmount" } } },
//       ]),
//     ]);

//     res.json({
//       success: true,
//       data: {
//         last7Days: last7Days.map((d) => ({ date: d._id, revenue: d.revenue })),
//         statusBreakdown: statusBreakdown.map((s) => ({
//           status: s._id === "shipping" ? "shipped" : s._id,
//           count: s.count,
//         })),
//         monthlyRevenue: monthlyTotal[0]?.total || 0,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Chart data error" });
//   }
// });

// // routes/adminRoutes.js
// // router.get("/customers/analytics", verifyAdminCookie, async (req, res) => {
// //   const thirtyDaysAgo = subDays(new Date(), 30);

// //   const [total, newThisMonth, topCustomers, cityData] = await Promise.all([
// //     User.countDocuments({ role: { $ne: "admin" } }),
// //     User.countDocuments({
// //       createdAt: { $gte: new Date(new Date().setDate(1)) },
// //     }),
// //     Order.aggregate([
// //       {
// //         $group: {
// //           _id: "$user",
// //           totalSpent: { $sum: "$totalAmount" },
// //           orders: { $sum: 1 },
// //           lastOrder: { $max: "$createdAt" },
// //         },
// //       },
// //       {
// //         $lookup: {
// //           from: "users",
// //           localField: "_id",
// //           foreignField: "_id",
// //           as: "user",
// //         },
// //       },
// //       { $unwind: "$user" },
// //       { $sort: { totalSpent: -1 } },
// //       { $limit: 20 },
// //       {
// //         $project: {
// //           name: "$user.name",
// //           spent: "$totalSpent",
// //           orders: 1,
// //           lastOrder: 1,
// //         },
// //       },
// //     ]),
// //     Order.aggregate([
// //       {
// //         $group: {
// //           _id: "$shippingAddress.city",
// //           customers: { $addToSet: "$user" },
// //         },
// //       },
// //       { $project: { city: "$_id", customers: { $size: "$customers" } } },
// //       { $sort: { customers: -1 } },
// //     ]),
// //   ]);

// //   const returning = total - newThisMonth;
// //   const aov = await Order.aggregate([
// //     { $match: { paymentStatus: "Paid" } },
// //     { $group: { _id: null, aov: { $avg: "$totalAmount" } } },
// //   ]);

// //   res.json({
// //     success: true,
// //     data: {
// //       totalCustomers: total,
// //       newThisMonth,
// //       returning,
// //       aov: aov[0]?.aov || 0,
// //       clv: aov[0]?.aov * 3.5 || 0, // rough estimate
// //       repeatRate: total > 0 ? Math.round((returning / total) * 100) : 0,
// //       topCustomers,
// //       cityData,
// //     },
// //   });
// // });

// //// Updated
// router.get("/customers/analytics", verifyAdminCookie, async (req, res) => {
//   try {
//     const startOfMonth = new Date(
//       new Date().getFullYear(),
//       new Date().getMonth(),
//       1
//     );

//     const [
//       [{ total = 0 }],
//       [{ newThisMonth = 0 }],
//       topCustomers,
//       cityData,
//       aovResult,
//       repeatData,
//     ] = await Promise.all([
//       // Total non-admin customers
//       User.aggregate([
//         { $match: { role: { $ne: "admin" } } },
//         { $count: "total" },
//       ]),

//       // New customers this month (non-admin)
//       User.aggregate([
//         {
//           $match: {
//             role: { $ne: "admin" },
//             createdAt: { $gte: startOfMonth },
//           },
//         },
//         { $count: "newThisMonth" },
//       ]),

//       // Top 20 customers by spend
//       Order.aggregate([
//         {
//           $group: {
//             _id: "$user",
//             totalSpent: { $sum: "$totalAmount" },
//             orders: { $sum: 1 },
//             lastOrder: { $max: "$createdAt" },
//           },
//         },
//         {
//           $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//         { $unwind: "$user" },
//         { $match: { "user.role": { $ne: "admin" } } },
//         { $sort: { totalSpent: -1 } },
//         { $limit: 20 },
//         {
//           $project: {
//             name: "$user.name",
//             email: "$user.email",
//             spent: "$totalSpent",
//             orders: 1,
//             lastOrder: 1,
//           },
//         },
//       ]),

//       // Customers by city
//       Order.aggregate([
//         { $match: { "shippingAddress.city": { $exists: true } } },
//         {
//           $group: {
//             _id: { $ifNull: ["$shippingAddress.city", "Unknown"] },
//             customers: { $addToSet: "$user" },
//           },
//         },
//         { $project: { city: "$_id", count: { $size: "$customers" } } },
//         { $sort: { count: -1 } },
//         { $limit: 15 },
//       ]),

//       // Average Order Value
//       Order.aggregate([
//         { $match: { paymentStatus: "Paid" } },
//         { $group: { _id: null, aov: { $avg: "$totalAmount" } } },
//       ]),

//       // Repeat customers (at least 2 orders)
//       Order.aggregate([
//         { $group: { _id: "$user", orderCount: { $sum: 1 } } },
//         { $match: { orderCount: { $gte: 2 } } },
//         { $count: "returning" },
//       ]),
//     ]);

//     const aov = aovResult[0]?.aov || 0;
//     const returning = repeatData[0]?.returning || 0;
//     const repeatRate = total > 0 ? Math.round((returning / total) * 100) : 0;

//     res.json({
//       success: true,
//       data: {
//         totalCustomers: total,
//         newThisMonth,
//         returningCustomers: returning,
//         repeatRate,
//         aov: Number(aov.toFixed(2)),
//         // Remove fake CLV or calculate properly
//         topCustomers,
//         cityData,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.get("/api/users", verifyAdminCookie, async (req, res) => {
//   try {
//     const customers = await User.find()
//       .select("-password")
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       count: customers.length,
//       users: customers,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // GET single customer by ID
// router.get("/api/users/:id", verifyAdminCookie, async (req, res) => {
//   try {
//     const customer = await User.findById(req.params.id).select("-password");
//     if (!customer) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     res.json({ success: true, user: customer });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });
export default router;
