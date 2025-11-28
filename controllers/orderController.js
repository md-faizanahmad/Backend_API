// import Order from "../models/Order.js";

// export async function getOrders(_req, res) {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 });
//     res.json({ success: true, orders });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to fetch orders" });
//   }
// }

// export async function createOrder(req, res) {
//   try {
//     const order = await Order.create(req.body);
//     res.status(201).json({ success: true, order });
//   } catch (err) {
//     res.status(400).json({ success: false, message: "Invalid order data" });
//   }
// }
///////////////////////////////////////////////////////////
////////////// updated
// controllers/orderController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createNotification } from "../utils/createNotification.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";

/* =====================================================
   ADMIN — GET ALL ORDERS
===================================================== */
export async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name imageUrl")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = orders.map((order) => {
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
        shippingAddress: order.shippingAddress || {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    res.json({ success: true, count: mapped.length, orders: mapped });
  } catch (err) {
    console.error("Admin Orders Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =====================================================
   CREATE ORDER (USER)
   + New Order Notification
===================================================== */
export async function createOrder(req, res) {
  try {
    const order = await Order.create(req.body);

    // 🔔 NOTIFICATION — NEW ORDER
    createNotification({
      type: "new_order",
      title: "New Order Received",
      message: `Order #${order.orderId} was placed`,
      link: `/dashboard/orders/${order._id}`,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid order data" });
  }
}

/* =====================================================
   ADMIN — GET SINGLE ORDER
===================================================== */
export async function getSingleOrder(req, res) {
  const order = await Order.findById(req.params.orderId).populate(
    "items.product"
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({ success: true, order });
}

/* =====================================================
   ADMIN — UPDATE STATUS
   + Status Change Notification
   + Low Stock Notifications
===================================================== */
export async function updateOrderStatus(req, res) {
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

  // 🔔 NOTIFICATION — ORDER STATUS UPDATE
  createNotification({
    type: "order_status",
    title: "Order Status Updated",
    message: `Order #${order.orderId} → ${status.toUpperCase()}`,
    link: `/dashboard/orders/${order._id}`,
  });

  // 🔥 LOW STOCK CHECK
  if (status === "delivered") {
    for (const item of order.items) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.stock = Math.max(product.stock - item.qty, 0);
      await product.save();

      if (product.stock < LOW_LIMIT) {
        createNotification({
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.name} stock is ${product.stock}`,
          link: `/dashboard/products/edit/${product._id}`,
        });
      }
    }
  }

  res.json({ success: true, message: "Status updated" });
}

/* =====================================================
   USER — MY ORDERS
===================================================== */
export async function getUserOrders(req, res) {
  const orders = await Order.find({ user: req.userId })
    .populate("items.product", "name imageUrl price")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
}

/* =====================================================
   USER — GET SINGLE ORDER
===================================================== */
export async function getMyOrder(req, res) {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.userId,
  }).populate("items.product");

  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order });
}

/* =====================================================
   INVOICE (ADMIN + USER)
===================================================== */
export async function getInvoice(req, res) {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("items.product")
      .lean();

    if (!order) return res.status(404).send("Invoice not found");

    generateInvoicePdf(res, order);
  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).send("Failed to generate invoice");
  }
}
