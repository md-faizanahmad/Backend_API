///////////////////////////////////////////////////////////
////////////////////// update 25--11
import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    qty: Number,
    price: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [orderItemSchema],
    totalAmount: Number,
    status: {
      type: String,
      default: "placed",
      enum: ["placed", "processing", "shipping", "delivered", "cancelled"],
    },
    paymentStatus: { type: String, default: "Paid" },
    paymentInfo: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
    shippingAddress: shippingAddressSchema,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
