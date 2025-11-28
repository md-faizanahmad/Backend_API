// import mongoose from "mongoose";

// const orderItemSchema = new mongoose.Schema({
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Product",
//     required: true,
//   },
//   quantity: { type: Number, required: true },
//   price: { type: Number, required: true },
// });

// const orderSchema = new mongoose.Schema(
//   {
//     customerName: { type: String, required: true },
//     customerEmail: { type: String, required: true },
//     items: [orderItemSchema],
//     totalAmount: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: ["pending", "shipping", "delivered", "cancelled"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);
///////////////////new Updated after payment successs
// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     items: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//         qty: Number,
//         price: Number,
//       },
//     ],

//     // snapshot of address at order time
//     shippingAddress: {
//       fullName: String,
//       phone: String,
//       street: String,
//       city: String,
//       state: String,
//       pincode: String,
//       landmark: String,
//     },

//     totalAmount: Number,

//     // ORDER LIFECYCLE
//     status: {
//       type: String,
//       enum: [
//         "Placed",
//         "Confirmed",
//         "Shipped",
//         "Out for Delivery",
//         "Delivered",
//         "Cancelled",
//       ],
//       default: "Placed",
//     },

//     // PAYMENT
//     paymentStatus: { type: String, default: "Paid" },
//     paymentInfo: {
//       orderId: String,
//       paymentId: String,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);
///////////////////After Validation
// models/Order.js
// import mongoose from "mongoose";

// const shippingAddressSchema = new mongoose.Schema(
//   {
//     fullName: String,
//     phone: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     landmark: String,
//   },
//   { _id: false }
// );

// const orderItemSchema = new mongoose.Schema(
//   {
//     product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//     qty: Number,
//     price: Number,
//   },
//   { _id: false }
// );

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     items: [orderItemSchema],
//     totalAmount: Number,
//     status: {
//       type: String,
//       default: "placed", // normalize lowercase
//       enum: ["placed", "processing", "shipping", "delivered", "cancelled"],
//     },
//     paymentStatus: { type: String, default: "Paid", enum: ["Paid", "Unpaid"] },
//     paymentInfo: {
//       orderId: String,
//       paymentId: String,
//     },
//     shippingAddress: shippingAddressSchema,
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);
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
