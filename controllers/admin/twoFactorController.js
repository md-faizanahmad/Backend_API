import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import Admin from "../../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * AES Encryption helpers
 */
function encryptSecret(secret) {
  return CryptoJS.AES.encrypt(secret, process.env.TOTP_SECRET_KEY).toString();
}

function decryptSecret(cipher) {
  const bytes = CryptoJS.AES.decrypt(cipher, process.env.TOTP_SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * STEP 1: Generate new QR + Base32 secret
 */
export async function setup2FA(req, res) {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ success: false });

    // Generate a new secret
    const secret = new OTPAuth.Secret({ size: 20 });

    // ✅ Correct: use the base32 property, NOT toString("base32")
    const base32 = secret.base32;

    console.log("📌 Generated Base32:", base32);

    const totp = new OTPAuth.TOTP({
      issuer: "MyAZStore",
      label: admin.email,
      secret, // Secret object is fine for generating the URI
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const uri = OTPAuth.URI.stringify(totp);
    const qr = await QRCode.toDataURL(uri);

    // Store encrypted Base32 string
    admin.twoFactorSecret = encryptSecret(base32);
    admin.twoFactorEnabled = false; // will flip after first valid verification
    admin.recoveryCodes = [];
    admin.trustedDevices = [];

    await admin.save();

    return res.json({ success: true, qr, setupKey: base32 });
  } catch (err) {
    console.log("❌ setup2FA FAIL:", err);
    return res.status(500).json({ success: false, message: "QR Gen Failed" });
  }
}

/**
 * STEP 2: Verify first OTP from Google Auth
 */
export async function verify2FA(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false });

    const admin = await Admin.findById(req.adminId);
    if (!admin?.twoFactorSecret) {
      return res
        .status(400)
        .json({ success: false, message: "Setup not done" });
    }

    const decryptedBase32 = decryptSecret(admin.twoFactorSecret);

    console.log("📌 Decrypted Base32:", decryptedBase32);
    console.log("📌 OTP Entered:", code);

    // ✅ Just pass Base32 string directly; OTPAuth will handle it
    const totp = new OTPAuth.TOTP({
      issuer: "MyAZStore",
      label: admin.email,
      secret: decryptedBase32,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    console.log("📌 Validation delta:", delta);

    if (delta === null) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    admin.twoFactorEnabled = true;
    await admin.save();

    return res.json({ success: true, message: "2FA Enabled" });
  } catch (err) {
    console.log("❌ verify2FA FAIL:", err);
    return res.status(500).json({ success: false, message: "Verify Failed" });
  }
}

/**
 * STEP 3: Login OTP after password success
 */
export async function twoFALogin(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false });

    const admin = await Admin.findOne({ email });
    if (!admin?.twoFactorEnabled) {
      return res.status(400).json({ success: false });
    }

    const decryptedBase32 = decryptSecret(admin.twoFactorSecret);
    console.log("📌 Login Base32:", decryptedBase32);

    const totp = new OTPAuth.TOTP({
      issuer: "MyAZStore",
      label: admin.email,
      secret: decryptedBase32, // ✅ Base32 string
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    console.log("📌 delta during login:", delta);

    if (delta === null) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".myazstore.shop",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    console.log("❌ twoFALogin FAIL:", err);
    return res
      .status(500)
      .json({ success: false, message: "2FA login failed" });
  }
}

/**
 * EXTRA: Reset trusted devices
 */
export async function clearTrustedDevices(req, res) {
  await Admin.findByIdAndUpdate(req.adminId, { trustedDevices: [] });
  return res.json({ success: true, message: "Trusted devices cleared" });
}

/**
 * EXTRA: Disable 2FA fully
 */
export async function disable2FA(req, res) {
  await Admin.findByIdAndUpdate(req.adminId, {
    twoFactorEnabled: false,
    twoFactorSecret: null,
    trustedDevices: [],
    recoveryCodes: [],
  });
  return res.json({ success: true, message: "2FA disabled" });
}

// GET /v1/admin/2fa/status
export async function twoFAStatus(req, res) {
  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ enabled: false });
  return res.json({ enabled: !!admin.twoFactorEnabled });
}
