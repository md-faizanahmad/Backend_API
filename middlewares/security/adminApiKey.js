// middlewares/adminApiKey.js

export function verifyAdminAPIKey(req, res, next) {
  const clientKey = req.headers["x-admin-api-key"];
  const serverKey = process.env.ADMIN_API_KEY;

  if (!serverKey) {
    console.warn("⚠ ADMIN_API_KEY missing in backend .env");
    return res.status(500).json({
      success: false,
      message: "Server misconfiguration",
    });
  }

  // Login/Logout/ME should NOT require this
  // So this middleware should NOT run before them

  if (!clientKey || clientKey !== serverKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized admin access",
    });
  }

  next();
}
