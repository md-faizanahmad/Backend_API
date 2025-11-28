import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // // Determine environment
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".myazstore.shop", // <--- THIS
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      admin: { id: String(admin._id), name: admin.name, email: admin.email },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
}

export async function me(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("name email");
    if (!admin)
      return res.status(401).json({ success: false, message: "Invalid token" });

    return res.json({
      success: true,
      admin: { id: String(admin._id), name: admin.name, email: admin.email },
    });
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export async function logout(_req, res) {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0), path: "/" });
  return res.json({ success: true, message: "Logged out" });
}
export async function updateAdminProfile(req, res) {
  try {
    const adminId = req.adminId;
    const { name, password } = req.body;

    const update = {};
    if (name) update.name = name;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    await Admin.findByIdAndUpdate(adminId, update);
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Update failed" });
  }
}
