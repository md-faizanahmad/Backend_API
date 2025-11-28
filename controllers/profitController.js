import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/**
 * GET /api/admin/profit/summary
 * returns total revenue (delivered), total cost of sold units, total profit, best sellers
 */
export async function getProfitSummary(req, res) {
  try {
    // revenue and sold quantities per product (delivered)
    const soldData = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "completed"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldUnits: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      { $sort: { soldUnits: -1 } },
      { $limit: 20 },
    ]);

    // populate product info for top sellers
    const productIds = soldData
      .map((s) => s._id)
      .filter(Boolean)
      .map(String);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name price costPrice images category")
      .populate("category", "name")
      .lean();

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const bestSelling = soldData.map((s) => {
      const p = productMap.get(String(s._id)) || {};
      const costPrice = p.costPrice ?? p.price ?? 0;
      const profit = ((p.price ?? 0) - costPrice) * (s.soldUnits || 0);
      return {
        productId: s._id,
        name: p.name || "Deleted product",
        soldUnits: s.soldUnits || 0,
        revenue: s.revenue || 0,
        profit,
        imageUrl: p.images?.[0] ?? p.imageUrl ?? null,
        category: p.category?.name ?? null,
      };
    });

    // totals
    const totalsAgg = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "completed"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
          // we'll compute cost in JS by joining with product costs
        },
      },
    ]);

    const totalRevenue = totalsAgg[0]?.totalRevenue || 0;

    // compute total cost for sold items
    // gather sold items across all orders (limit memory: group by product)
    const soldAgg = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "completed"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldUnits: { $sum: "$items.qty" },
        },
      },
    ]);

    const soldIds = soldAgg
      .map((s) => s._id)
      .filter(Boolean)
      .map(String);
    const soldProducts = await Product.find({ _id: { $in: soldIds } })
      .select("costPrice price")
      .lean();

    const soldCostMap = new Map(
      soldProducts.map((p) => [String(p._id), p.costPrice ?? p.price ?? 0])
    );

    let totalCostOfSold = 0;
    for (const s of soldAgg) {
      const cost = soldCostMap.get(String(s._id)) || 0;
      totalCostOfSold += cost * (s.soldUnits || 0);
    }

    const totalProfit = totalRevenue - totalCostOfSold;

    res.json({
      success: true,
      totals: {
        totalRevenue,
        totalCostOfSold,
        totalProfit,
      },
      bestSelling,
    });
  } catch (err) {
    console.error("profit summary error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profit summary" });
  }
}

/**
 * GET /api/admin/profit/monthly?months=12
 * returns monthly revenue & profit for last N months
 */
export async function getMonthlyProfit(req, res) {
  try {
    const months = Number(req.query.months || 12);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // group orders by year-month
    const agg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["delivered", "completed"] },
          createdAt: { $gte: start },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            product: "$items.product",
          },
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          totalQty: { $sum: "$qty" },
          totalRevenue: { $sum: "$revenue" },
          products: { $push: { product: "$_id.product", qty: "$qty" } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // For cost/profit, we need product costs — keep it approximate (lookup top products)
    // Build map of month -> revenue (and compute cost by querying product costs for the listed products)
    const monthsMap = agg.map((m) => {
      const label = `${m._id.year}-${String(m._id.month).padStart(2, "0")}`;
      return {
        month: label,
        totalRevenue: m.totalRevenue || 0,
        totalQty: m.totalQty || 0,
      };
    });

    res.json({ success: true, months: monthsMap });
  } catch (err) {
    console.error("monthly profit error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch monthly profit data" });
  }
}
