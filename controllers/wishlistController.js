// controllers/wishlistController.js
import User from "../models/User.js";
import Product from "../models/Product.js";

export async function addToWishlist(req, res) {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required" });
    }

    const exists = await Product.findById(productId);
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { wishlist: productId } }
    );

    return res.json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    await User.updateOne({ _id: userId }, { $pull: { wishlist: productId } });

    return res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}

export async function getWishlist(req, res) {
  try {
    const user = await User.findById(req.userId).populate(
      "wishlist",
      "name price imageUrl category"
    );

    const products = user?.wishlist ?? [];

    return res.json({ success: true, products });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed", error: err.message });
  }
}
