// controllers/adminInventoryController.js
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getInventorySummary = async (req, res) => {
  try {
    // 1) Product-level aggregation
    const products = await Product.find()
      .select("name imageUrl price costPrice stock category slug")
      .lean();

    // compute per-product fields
    const productRows = products.map((p) => {
      const costPrice = Number(p.costPrice || 0);
      const price = Number(p.price || 0);
      const stock = Number(p.stock || 0);
      const profitUnit = Number((price - costPrice).toFixed(2));
      const totalInvestment = Number((costPrice * stock).toFixed(2));
      const totalSellingValue = Number((price * stock).toFixed(2));
      const totalProfit = Number((profitUnit * stock).toFixed(2));
      const margin =
        costPrice > 0 ? Number(((profitUnit / costPrice) * 100).toFixed(2)) : 0;

      return {
        _id: p._id,
        name: p.name,
        imageUrl: p.imageUrl || null,
        price,
        costPrice,
        stock,
        profitUnit,
        totalInvestment,
        totalSellingValue,
        totalProfit,
        margin,
        category: p.category ?? null,
        slug: p.slug ?? null,
      };
    });

    // 2) Summary aggregates from rows
    const totalProducts = productRows.length;
    const totalInvestment = productRows.reduce(
      (s, r) => s + r.totalInvestment,
      0
    );
    const totalSellingValue = productRows.reduce(
      (s, r) => s + r.totalSellingValue,
      0
    );
    const totalProfitPotential = productRows.reduce(
      (s, r) => s + r.totalProfit,
      0
    );

    const marginPercent =
      totalInvestment > 0
        ? Number(((totalProfitPotential / totalInvestment) * 100).toFixed(2))
        : 0;

    const lowStock = productRows.filter(
      (r) => r.stock > 0 && r.stock < 5
    ).length;
    const outOfStock = productRows.filter((r) => r.stock === 0).length;

    // 3) Revenue (delivered orders)
    const revAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);
    const revenue = revAgg[0]?.revenue || 0;

    // 4) Top value products (sorted by totalInvestment)
    const topProducts = [...productRows]
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .slice(0, 10);

    return res.json({
      success: true,
      summary: {
        totalProducts,
        totalInvestment,
        totalSellingValue,
        totalProfitPotential,
        marginPercent,
        lowStock,
        outOfStock,
        revenue,
      },
      products: productRows,
      topProducts,
    });
  } catch (err) {
    console.error("Inventory summary error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
