// middlewares/verifyUserOptional.js
import jwt from "jsonwebtoken";

export default function verifyUserOptional(req, res, next) {
  try {
    const token = req.cookies?.user_token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, name: decoded.name, email: decoded.email };

    return next();
  } catch (err) {
    // If invalid token → treat as unauthenticated, DO NOT block
    req.user = null;
    return next();
  }
}
