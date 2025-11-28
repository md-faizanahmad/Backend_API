// controllers/otpController.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import EmailVerification from "../models/EmailVerification.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const OTP_LENGTH = 6;
const OTP_SECRET = process.env.OTP_SECRET;
const OTP_EXPIRE_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 5);

// Prevent brute force
const MAX_ATTEMPTS = 5;

/** Generate secure alphanumeric OTP */
function generateAlphanumericOtp(length = OTP_LENGTH) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) code += chars[bytes[i] % chars.length];
  return code;
}

/**
 * SEND OTP for Signup or Login
 * purpose = "signup" or "login"
 */
export async function sendOtp(req, res) {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose)
      return res
        .status(400)
        .json({ success: false, message: "Email & purpose required" });

    const normalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalized });

    // 🔐 SECURITY CHECKS
    if (purpose === "signup" && user) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in.",
      });
    }

    if (purpose === "login" && !user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please sign up first.",
      });
    }

    // Generate OTP
    const otp = generateAlphanumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    // Store OTP for this email + purpose
    await EmailVerification.findOneAndUpdate(
      { email: normalized },
      { otpHash, expiresAt, attempts: 0, verified: false, purpose },
      { upsert: true }
    );

    // Email template
    const html = `
      <div style="font-family: Arial; line-height:1.5">
        <h2>Your ${purpose.toUpperCase()} verification code</h2>
        <p style="font-size:20px; font-weight:bold; letter-spacing:2px">${otp}</p>
        <p>This OTP expires in ${OTP_EXPIRE_MINUTES} minutes.</p>
      </div>
    `;

    await sendEmail({
      to: normalized,
      subject: `Your ${purpose.toUpperCase()} OTP`,
      html,
    });

    return res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
}

/**
 * VERIFY OTP for Signup or Login
 * signup → return otpToken for account creation
 * login → perform login immediately (issue cookie)
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const normalized = email.trim().toLowerCase();
    const record = await EmailVerification.findOne({ email: normalized });

    if (!record)
      return res.status(404).json({ success: false, message: "OTP not found" });

    // Purpose mismatch → attacker trying to reuse OTP
    if (record.purpose !== purpose) {
      return res
        .status(401)
        .json({ success: false, message: "Purpose mismatch. OTP invalid." });
    }

    if (record.attempts >= MAX_ATTEMPTS)
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request new OTP.",
      });

    if (new Date() > record.expiresAt)
      return res.status(410).json({ success: false, message: "OTP expired" });

    const match = await bcrypt.compare(otp.trim(), record.otpHash);
    if (!match) {
      record.attempts++;
      await record.save();
      return res.status(401).json({ success: false, message: "Incorrect OTP" });
    }

    // Mark verified
    record.verified = true;
    await record.save();

    // SIGNUP FLOW
    if (purpose === "signup") {
      // Return token to be used in signup
      const otpToken = jwt.sign(
        { email: normalized, otpVerified: true },
        OTP_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({
        success: true,
        message: "OTP verified",
        otpToken,
      });
    }

    // LOGIN FLOW
    if (purpose === "login") {
      const user = await User.findOne({ email: normalized });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Issue login cookie (reuse your login cookie method)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("user_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: ".myazstore.shop",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    }

    return res.status(400).json({ success: false, message: "Invalid purpose" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: "OTP verification failed" });
  }
}
