// // src/models/Admin.js
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const adminSchema = new mongoose.Schema(
//   {
//     name: { type: String, default: "Admin" },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// adminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// export default mongoose.model("Admin", adminSchema);
////////////////////new

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // ⭐ NEW
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },

    recoveryCodes: [
      {
        codeHash: { type: String, required: true },
        used: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        usedAt: { type: Date },
      },
    ],

    // ⭐ New: Trusted devices
    trustedDevices: [
      {
        deviceId: { type: String, required: true },
        userAgent: { type: String },
        ip: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],

    // ⭐ New: OTP lockout
    otpFailedAttempts: { type: Number, default: 0 },
    otpLockUntil: { type: Date, default: null },
  },

  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("Admin", adminSchema);
