import Order from "../../models/Order.js";

export async function getDashboardCharts(req, res) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [last7Days, statusBreakdown, monthlyTotal] = await Promise.all([
      Order.aggregate([
        {
          $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: "Paid" },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
            paymentStatus: "Paid",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        last7Days: last7Days.map((d) => ({ date: d._id, revenue: d.revenue })),
        statusBreakdown,
        monthlyRevenue: monthlyTotal?.[0]?.total || 0,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Chart data error" });
  }
}
