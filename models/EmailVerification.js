// models/EmailVerification.js
import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    purpose: { type: String, required: true },

    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    lastSentAt: { type: Date }, // For cooldown
    resendCount: { type: Number, default: 0 }, // For daily limits
  },
  { timestamps: true }
);

// auto-clean expired docs could be implemented with TTL index if desired:
// emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("EmailVerification", emailVerificationSchema);
