import Product from "../models/Product.js";
import Order from "../models/Order.js";

/**
 * GET /api/admin/inventory/overview
 * returns inventory summary & lowStock products
 */
export async function getInventoryOverview(req, res) {
  try {
    const products = await Product.find().populate("category", "name").lean();

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((s, p) => s + (p.stock || 0), 0);

    const totalInventoryValue = products.reduce(
      (s, p) => s + (p.costPrice ?? p.price) * (p.stock || 0),
      0
    );

    const totalPotentialRevenue = products.reduce(
      (s, p) => s + (p.price || 0) * (p.stock || 0),
      0
    );

    const totalPotentialProfit = totalPotentialRevenue - totalInventoryValue;

    // low stock products (< threshold)
    const LOW_LIMIT = Number(process.env.LOW_STOCK_LIMIT ?? 5);
    const lowStockProducts = products
      .filter((p) => (p.stock ?? 0) < LOW_LIMIT)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        costPrice: p.costPrice ?? p.price,
        imageUrl: p.imageUrl,
        category: p.category?.name ?? "Uncategorized",
      }));

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalStockUnits,
        totalInventoryValue,
        totalPotentialRevenue,
        totalPotentialProfit,
      },
      lowStockProducts,
      products, // small list for client (if you want full list remove or paginate)
    });
  } catch (err) {
    console.error("inventory overview error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch inventory overview" });
  }
}

/**
 * GET /api/admin/inventory/product/:id
 * returns product-level inventory detail (uses product + orders)
 */
export async function getInventoryProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .lean();
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // sold units from orders (delivered or completed)
    const soldAgg = await Order.aggregate([
      {
        $match: {
          "items.product": product._id,
          status: { $in: ["delivered", "completed"] },
        },
      },
      { $unwind: "$items" },
      { $match: { "items.product": product._id } },
      {
        $group: {
          _id: "$items.product",
          soldUnits: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
    ]);

    const sold = soldAgg[0] || { soldUnits: 0, revenue: 0 };

    res.json({
      success: true,
      product: {
        ...product,
        costPrice: product.costPrice ?? product.price,
        profitPerUnit: product.price - (product.costPrice ?? product.price),
        soldUnits: sold.soldUnits || 0,
        revenue: sold.revenue || 0,
      },
    });
  } catch (err) {
    console.error("inventory product error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch product inventory details",
      });
  }
}
