// controllers/cartController.js
import User from "../models/User.js";
import Product from "../models/Product.js";

export async function getCart(req, res) {
  try {
    const user = await User.findById(req.userId).populate(
      "cart.product",
      "name price imageUrl"
    );

    return res.json({
      success: true,
      items: user?.cart ?? [],
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}

export async function addToCart(req, res) {
  try {
    const userId = req.userId;
    const { productId, qty } = req.body;
    const quantity = Number(qty) || 1;

    if (product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "This product is no longer available",
      });
    }

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existing = user.cart.find(
      (item) => String(item.product) === String(productId)
    );

    if (existing) {
      existing.qty += quantity;
    } else {
      user.cart.push({ product: productId, qty: quantity });
    }

    await user.save();

    return res.json({
      success: true,
      message: "Added to cart",
      cart: user.cart,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}

export async function updateCartQty(req, res) {
  try {
    const userId = req.userId;
    const { productId, qty } = req.body;
    const quantity = Number(qty);

    if (!productId || Number.isNaN(quantity)) {
      return res
        .status(400)
        .json({ success: false, message: "productId & qty required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const item = user.cart.find((c) => String(c.product) === String(productId));
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    item.qty = quantity;
    await user.save();

    return res.json({ success: true, cart: user.cart });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}

export async function removeFromCart(req, res) {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cart = user.cart.filter(
      (item) => String(item.product) !== String(productId)
    );
    await user.save();

    return res.json({ success: true, cart: user.cart });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}
