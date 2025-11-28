import User from "../models/User.js";
import Order from "../models/Order.js";

export async function getCustomersAnalytics(req, res) {
  try {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const [
      totalCustomersAgg,
      newThisMonthAgg,
      topCustomers,
      cityData,
      aovAgg,
      repeatCustomersAgg,
    ] = await Promise.all([
      // Total customers (non-admin)
      User.aggregate([
        { $match: { role: { $ne: "admin" } } },
        { $count: "total" },
      ]),

      // New customers this month
      User.aggregate([
        {
          $match: {
            role: { $ne: "admin" },
            createdAt: { $gte: startOfMonth },
          },
        },
        { $count: "newThisMonth" },
      ]),

      // Top 20 customers by money spent
      Order.aggregate([
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
            lastOrder: { $max: "$createdAt" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $match: { "user.role": { $ne: "admin" } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 20 },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            spent: "$totalSpent",
            orders: 1,
            lastOrder: 1,
          },
        },
      ]),

      // Cities with most customers
      Order.aggregate([
        { $match: { "shippingAddress.city": { $exists: true } } },
        {
          $group: {
            _id: { $ifNull: ["$shippingAddress.city", "Unknown"] },
            customers: { $addToSet: "$user" },
          },
        },
        {
          $project: { city: "$_id", count: { $size: "$customers" } },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // AOV (Average Order Value)
      Order.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, aov: { $avg: "$totalAmount" } } },
      ]),

      // Returning customers (≥ 2 orders)
      Order.aggregate([
        { $group: { _id: "$user", orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gte: 2 } } },
        { $count: "returning" },
      ]),
    ]);

    const totalCustomers = totalCustomersAgg[0]?.total || 0;
    const newThisMonth = newThisMonthAgg[0]?.newThisMonth || 0;
    const returning = repeatCustomersAgg[0]?.returning || 0;

    const repeatRate =
      totalCustomers > 0 ? Math.round((returning / totalCustomers) * 100) : 0;

    const aov = aovAgg[0]?.aov || 0;

    return res.json({
      success: true,
      data: {
        totalCustomers,
        newThisMonth,
        returningCustomers: returning,
        repeatRate,
        aov: Number(aov.toFixed(2)),
        topCustomers,
        cityData,
      },
    });
  } catch (err) {
    console.error("Customer analytics error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
