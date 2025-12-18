// import Order from "../models/Order.js";
// import Product from "../models/Product.js";
// import Category from "../models/Category.js";
// import User from "../models/User.js";

// export async function getDashboardStats(req, res) {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const [result] = await Order.aggregate([
//       {
//         $facet: {
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
//                     ],
//                     default: "unknown",
//                   },
//                 },
//                 count: { $sum: 1 },
//               },
//             },
//           ],
//         },
//       },
//     ]);

//     /// new// Inventory aggregations
//     const inventoryAgg = await Product.aggregate([
//       {
//         $group: {
//           _id: null,
//           inventoryValue: { $sum: { $multiply: ["$price", "$stock"] } }, // selling value
//           costValue: { $sum: { $multiply: ["$costPrice", "$stock"] } }, // investment
//         },
//       },
//     ]);

//     const inventoryValue = inventoryAgg[0]?.inventoryValue || 0;
//     const totalInvestment = inventoryAgg[0]?.costValue || 0;

//     // Revenue: delivered orders
//     const revAgg = await Order.aggregate([
//       { $match: { status: "delivered" } },
//       { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
//     ]);
//     const revenue = revAgg[0]?.revenue || 0;

//     // Profit = revenue - totalInvestment
//     const profit = revenue - totalInvestment;

//     const orders = result.orders[0] || {};
//     const statusMap = Object.fromEntries(
//       (result.status || []).map((s) => [s._id, s.count])
//     );

//     const [productsCount, categoriesCount, usersCount] = await Promise.all([
//       Product.countDocuments(),
//       Category.countDocuments(),
//       User.countDocuments({ role: { $ne: "admin" } }),
//     ]);

//     res.json({
//       success: true,
//       data: {
//         ...orders,
//         pending: statusMap.pending || 0,
//         processing: statusMap.processing || 0,
//         shipped: statusMap.shipped || 0,
//         delivered: statusMap.delivered || 0,
//         cancelled: statusMap.cancelled || 0,
//         totalProducts: productsCount,
//         totalCategories: categoriesCount,
//         totalUsers: usersCount,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

////// update with sub-c
// controllers/adminDashboardStats.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/User.js";

export async function getDashboardStats(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Orders facet (same as before)
    const [result] = await Order.aggregate([
      {
        $facet: {
          orders: [
            { $match: {} },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                todayOrders: {
                  $sum: { $cond: [{ $gte: ["$createdAt", today] }, 1, 0] },
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$paymentStatus", "Paid"] },
                      "$totalAmount",
                      0,
                    ],
                  },
                },
              },
            },
          ],
          status: [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$status", "shipping"] },
                        then: "shipped",
                      },
                      {
                        case: { $eq: ["$status", "processing"] },
                        then: "processing",
                      },
                      {
                        case: { $eq: ["$status", "delivered"] },
                        then: "delivered",
                      },
                      {
                        case: { $eq: ["$status", "cancelled"] },
                        then: "cancelled",
                      },
                    ],
                    default: "unknown",
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Inventory aggregations (same as before)
    const inventoryAgg = await Product.aggregate([
      {
        $group: {
          _id: null,
          inventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
          costValue: { $sum: { $multiply: ["$costPrice", "$stock"] } },
        },
      },
    ]);
    const inventoryValue = inventoryAgg[0]?.inventoryValue || 0;
    const totalInvestment = inventoryAgg[0]?.costValue || 0;

    // Revenue: delivered orders
    const revAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);
    const revenue = revAgg[0]?.revenue || 0;

    // Profit = revenue - totalInvestment
    const profit = revenue - totalInvestment;

    const orders = result.orders[0] || {};
    const statusMap = Object.fromEntries(
      (result.status || []).map((s) => [s._id, s.count])
    );

    // Core counts: products, users (non-admin)
    const [productsCount, usersCount] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: { $ne: "admin" } }),
    ]);

    // Category counts split into mains & subs
    const [totalMainCategories, totalSubcategories] = await Promise.all([
      Category.countDocuments({ isSub: false, isDeleted: false }),
      Category.countDocuments({ isSub: true, isDeleted: false }),
    ]);

    // Build main categories with sub-count (only non-deleted subs)
    // We include name, slug and image for quick UI cards.
    const categoriesWithSubCount = await Category.aggregate([
      { $match: { isSub: false, isDeleted: false } }, // only active main categories
      {
        $lookup: {
          from: "categories", // same collection - Mongo uses the collection name
          let: { parentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$parent", "$$parentId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "subs",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          image: 1,
          subCount: { $size: "$subs" },
        },
      },
      { $sort: { subCount: -1, name: 1 } }, // sort by most subs first
    ]);

    // Top categories by number of subcategories (pick top 6)
    const topCategoriesBySubcount = categoriesWithSubCount.slice(0, 6);

    res.json({
      success: true,
      data: {
        ...orders,
        pending: statusMap.pending || 0,
        processing: statusMap.processing || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
        totalProducts: productsCount,
        totalMainCategories,
        totalSubcategories,
        totalUsers: usersCount,
        inventoryValue,
        totalInvestment,
        revenue,
        profit,
        categoriesWithSubCount, // array for UI breakdown
        topCategoriesBySubcount,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
