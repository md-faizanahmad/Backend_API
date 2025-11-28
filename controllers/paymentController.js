// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Address from "../models/Address.js";

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

export const createPaymentOrder = async (req, res) => {
  try {
    const sessionData = req.session.checkout;
    if (!sessionData) {
      return res
        .status(400)
        .json({ success: false, message: "Checkout session missing" });
    }

    const { totalAmount } = sessionData;
    if (!totalAmount || typeof totalAmount !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid total amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    });

    return res.json({ success: true, order });
  } catch (err) {
    console.error("createPaymentOrder:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RZP_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const sessionData = req.session.checkout;
    if (!sessionData) {
      return res
        .status(400)
        .json({ success: false, message: "Checkout session expired" });
    }

    const address = await Address.findById(sessionData.addressId).lean();
    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address not found" });
    }

    const created = await Order.create({
      user: sessionData.user,
      items: sessionData.items,
      totalAmount: sessionData.totalAmount,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark,
      },
      paymentStatus: "Paid",
      paymentInfo: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    // clear session
    req.session.checkout = null;

    return res.json({ success: true, order: created });
  } catch (err) {
    console.error("verifyPayment:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
