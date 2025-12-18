// middlewares/corsConfig.js
import cors from "cors";

const allowedOrigins = [
  "https://myazstore.shop",
  "https://admin.myazstore.shop",
  "https://api.myazstore.shop",
  "http://localhost:5173",
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / mobile apps
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-admin-api-key",
  ],
  methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// handles preflight BEFORE hitting auth
export const handlePreflight = (req, res, next) => {
  if (req.method === "OPTIONS") {
    // cors() already adds headers
    return res.sendStatus(200);
  }
  next();
};

// Add headers to prevent CDN CORS mismatch
export const corsCacheFix = (req, res, next) => {
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  next();
};
