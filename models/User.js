// // models/User.js
// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String },
//     phone: { type: String },
//     googleId: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("User", userSchema);
///////////////new for wishlist-
// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },

    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },

    password: { type: String },
    phone: { type: String },
    googleId: { type: String },
    addresses: [
      {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        isDefault: { type: Boolean, default: false },
      },
    ],

    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number, default: 1 },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
