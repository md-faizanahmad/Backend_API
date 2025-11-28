// import jwt from "jsonwebtoken";

// export const verifyAdmin = (req, res, next) => {
//   try {
//     const token = req.cookies?.token;
//     if (!token)
//       return res.status(401).json({ success: false, message: "No token" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.adminId = decoded.id;
//     next();
//   } catch (err) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid or expired token" });
//   }
// };
////////////////new

// src/middlewares/verifyAdmin.js
import jwt from "jsonwebtoken";

export function verifyAdminCookie(req, res, next) {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ success: false, message: "No token found" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}
