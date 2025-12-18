import express from "express";

import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { getCustomersAnalytics } from "../controllers/adminCustomerAnalyticsController.js";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  me,
  updateAdminProfile,
} from "../controllers/admin/adminController.js";
import { getDashboardCharts } from "../controllers/admin/adminChartsController.js";
import {
  clearTrustedDevices,
  disable2FA,
  setup2FA,
  twoFALogin,
  twoFAStatus,
  verify2FA,
} from "../controllers/admin/twoFactorController.js";

// import { verifyAdminAPIKey } from "../middlewares/security/adminApiKey.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30, // max 20 attempts in 10 mins
  message: { success: false, message: "Too many requests. Try later." },
});

/* -------------------------- PUBLIC (No API key needed) -------------------------- */

router.post("/login", loginLimiter, login);
/**
 * These routes handle:
 * 1) Setup - generate QR to scan in Google Authenticator
 * 2) Verify - confirm 6-digit code first time
 * 3) twoFALogin - login step after password success
 */
router.get("/2fa/status", verifyAdminCookie, twoFAStatus);

router.post("/2fa/setup", verifyAdminCookie, setup2FA); // generate QR & secret
router.post("/2fa/verify", verifyAdminCookie, verify2FA); // confirm OTP & enable final
router.post("/2fa/login", loginLimiter, twoFALogin); // 6-digit code during login (after password step)

// router.post("/2fa/recovery-codes", verifyAdminCookie, regenerateRecoveryCodes);
router.post("/2fa/disable", verifyAdminCookie, disable2FA);
router.post("/2fa/clear-trusted", verifyAdminCookie, clearTrustedDevices);
/* --------------------- SECURE ADMIN  ( cookie) --------------------- */

// router.use(verifyAdminAPIKey);

router.post("/logout", logout);
router.get("/me", verifyAdminCookie, me);

// Protected by cookie only (for admin dashboard initial load)

router.put("/update", verifyAdminCookie, updateAdminProfile);

// Dashboard stats
router.get("/dashboard/stats", verifyAdminCookie, getDashboardStats);

// Charts
router.get("/dashboard/charts", verifyAdminCookie, getDashboardCharts);

// Customers analytics
router.get("/customers/analytics", verifyAdminCookie, getCustomersAnalytics);

// User list
router.get("/customers", verifyAdminCookie, async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, users });
});

// User details
router.get("/customers/:id", verifyAdminCookie, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  res.json({ success: true, user });
});

// Admin Invoice
router.get("/orders/:id/invoice", verifyAdminCookie, async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  const buffer = await generateInvoicePdf(order);
  res.setHeader("Content-Type", "application/pdf");
  res.send(buffer);
});

export default router;

// | Route         | What Admin Does                 | Meaning              |
// | ------------- | ------------------------------- | -------------------- |
// | `/2fa/setup`  | scan QR in Google Authenticator | generate secret + QR |
// | `/2fa/verify` | enter code from app             | activates 2FA in DB  |
// | `/2fa/login`  | enter code during login         | returns cookie token |
