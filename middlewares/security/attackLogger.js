// 🛡️ attackLogger.js
// Logs NoSQL injection, XSS attempts & suspicious payloads.

export function attackLogger(req, res, next) {
  const body = JSON.stringify(req.body || {});
  const url = req.originalUrl;

  // Detect NoSQL Injection
  if (body.includes("$") || url.includes("$")) {
    console.log("🚨 POSSIBLE NOSQL INJECTION from:", req.ip, url, body);
  }

  // Detect XSS
  if (url.includes("<script") || body.includes("<script")) {
    console.log("🚨 POSSIBLE XSS ATTACK from:", req.ip, url);
  }

  next();
}
