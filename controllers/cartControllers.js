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

// export async function addToCart(req, res) {
//   try {
//     const userId = req.userId;
//     const { productId, qty } = req.body;
//     const quantity = Number(qty) || 1;

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }
//     if (product.isDeleted) {
//       return res.status(400).json({
//         success: false,
//         message: "This product is no longer available",
//       });
//     }

//     if (!productId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "productId is required" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const existing = user.cart.find(
//       (item) => String(item.product) === String(productId)
//     );

//     if (existing) {
//       existing.qty += quantity;
//     } else {
//       user.cart.push({ product: productId, qty: quantity });
//     }

//     await user.save();

//     return res.json({
//       success: true,
//       message: "Added to cart",
//       cart: user.cart,
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed", error: err.message });
//   }
// }

// export async function updateCartQty(req, res) {
//   try {
//     const userId = req.userId;
//     const { productId, qty } = req.body;
//     const quantity = Number(qty);

//     if (!productId || Number.isNaN(quantity)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "productId & qty required" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const item = user.cart.find((c) => String(c.product) === String(productId));
//     if (!item) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Item not in cart" });
//     }

//     item.qty = quantity;
//     await user.save();

//     return res.json({ success: true, cart: user.cart });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed", error: err.message });
//   }
// }

/////////////// ABOVE CODES ARE WITHOUT CART LIMITS BUT CORRECT
///////// THIS CODES WITH CART LIMIT BASED ON PRODUCT PRICE
import { getMaxQtyForProduct } from "../utils/cartLimits.js";

export async function addToCart(req, res) {
  const { productId, qty } = req.body;
  const quantity = Math.max(1, Number(qty) || 1);

  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Product not available" });
  }

  const user = await User.findById(req.userId);
  const existing = user.cart.find(
    (i) => String(i.product) === String(productId)
  );

  const maxQty = getMaxQtyForProduct(product);
  const currentQty = existing?.qty ?? 0;
  const requestedQty = currentQty + quantity;

  if (requestedQty > maxQty) {
    return res.status(400).json({
      success: false,
      message: `Maximum ${maxQty} units allowed for this product`,
      maxQty,
    });
  }

  if (requestedQty > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} units in stock`,
    });
  }

  if (existing) existing.qty = requestedQty;
  else user.cart.push({ product: productId, qty: quantity });

  await user.save();

  res.json({ success: true, cart: user.cart });
}

//////////// Update
export async function updateCartQty(req, res) {
  try {
    const userId = req.userId;
    const { productId, qty } = req.body;
    const quantity = Number(qty);

    /* ---------------------------
       BASIC VALIDATION
    ---------------------------- */
    if (!productId || Number.isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "productId and qty are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    /* ---------------------------
       LOAD PRODUCT
    ---------------------------- */
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    /* ---------------------------
       APPLY LIMIT RULES
    ---------------------------- */
    const maxQty = getMaxQtyForProduct(product);

    if (quantity > maxQty) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxQty} units allowed for this product`,
        maxQty,
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`,
      });
    }

    /* ---------------------------
       LOAD USER & CART ITEM
    ---------------------------- */
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const item = user.cart.find((c) => String(c.product) === String(productId));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    /* ---------------------------
       UPDATE & SAVE
    ---------------------------- */
    item.qty = quantity;
    await user.save();

    return res.json({
      success: true,
      message: "Cart updated",
      cart: user.cart,
    });
  } catch (err) {
    console.error("updateCartQty:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
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
