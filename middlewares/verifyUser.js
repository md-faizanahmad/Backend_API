// middlewares/verifyUser.js
import jwt from "jsonwebtoken";

export function verifyUserCookie(req, res, next) {
  try {
    const token = req.cookies?.user_token;
    if (!token)
      return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = { id: decoded.id, name: decoded.name, email: decoded.email };
    req.user = {
      id: decoded.id ?? decoded.sub,
      name: decoded.name,
      email: decoded.email,
    };
    // req.userId = decoded.id;
    req.userId = decoded.id ?? decoded.sub; // ⚠️ important: me() expects req.userId

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}
