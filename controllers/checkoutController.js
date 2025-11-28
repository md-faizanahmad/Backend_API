// controllers/checkoutController.js
import Address from "../models/Address.js";

export const saveCheckoutSession = async (req, res) => {
  try {
    const { addressId, items, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    if (!addressId) {
      return res
        .status(400)
        .json({ success: false, message: "addressId required" });
    }

    const address = await Address.findById(addressId).lean();
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid totalAmount" });
    }

    // Save into session
    req.session.checkout = {
      user: req.userId || (req.user && req.user._id) || null,
      items,
      totalAmount,
      addressId,
      createdAt: Date.now(),
    };

    return res.json({ success: true });
  } catch (err) {
    console.error("saveCheckoutSession:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
