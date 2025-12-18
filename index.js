// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import serverless from "serverless-http";
// import connectDB from "./config/db.js";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";

// // Routes
// import adminRoutes from "./routes/adminRoutes.js";
// import categoryRoutes from "./routes/categoryRoutes.js";
// import productRoutes from "./routes/productRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";
// import aiRoutes from "./routes/aiRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import wishlistRoutes from "./routes/wishlistRoutes.js";
// import cartRoutes from "./routes/cartRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// import invoiceRoutes from "./routes/invoiceRoutes.js";
// import addressRoutes from "./routes/addressRoutes.js";
// import checkoutRoutes from "./routes/checkoutRoutes.js";
// import heroRoutes from "./routes/heroRoutes.js";
// import inventoryRoutes from "./routes/inventoryRoutes.js";
// import profitRoutes from "./routes/profitRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";

// dotenv.config();

// const app = express();

// /* ======================================================
//    1️⃣ GLOBAL CORS (MUST BE FIRST)
// ====================================================== */

// const allowedOrigins = [
//   "https://myazstore.shop",
//   "https://admin.myazstore.shop",
//   "http://localhost:5173",
// ];

// // Disable Vercel CORS caching
// app.use((req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   next();
// });

// app.use(helmet());

// const apiLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000,
//   max: 300, // 300 req/min per IP
// });
// app.use(apiLimiter);

// // REAL CORS Handler
// app.use((req, res, next) => {
//   const origin = req.headers.origin;

//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }

//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE, OPTIONS"
//   );

//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   next();
// });

// /* ======================================================
//    2️⃣ Razorpay webhook — RAW BODY (before JSON)
// ====================================================== */
// app.use("/api/payment/webhook", express.raw({ type: "*/*" }));

// /* ======================================================
//    3️⃣ JSON + Cookies
// ====================================================== */
// app.use(express.json({ limit: "10mb" }));
// // app.use(cookieParser());
// app.use(cookieParser(process.env.JWT_SECRET));

// /* ======================================================
//    4️⃣ Secure cookies on Vercel
// ====================================================== */
// app.set("trust proxy", 1);

// /* ======================================================
//    5️⃣ DB Connect Middleware
// ====================================================== */
// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "DB connect failed",
//     });
//   }
// });

// /* ======================================================
//    6️⃣ ROUTES
// ====================================================== */
// app.use("/api/admin", adminRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/hero", heroRoutes);

// app.use("/api/products", productRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/wishlist", wishlistRoutes);
// app.use("/api/cart", cartRoutes);

// app.use("/api/payment", paymentRoutes);
// app.use("/api/invoice", invoiceRoutes);
// app.use("/api/addresses", addressRoutes);
// app.use("/api/checkout", checkoutRoutes);
// app.use("/api/admin/inventory", inventoryRoutes);
// app.use("/api/admin/profit", profitRoutes);
// app.use("/api/notifications", notificationRoutes);
// /* ======================================================
//    7️⃣ API Welcome Page
// ====================================================== */
// app.get("/", (_req, res) => {
//   res.send(`
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <meta name="description" content="MyAZStore - Modern E-commerce Platform API. Fast, secure, and scalable backend powering myazstore.shop and admin panel." />
//   <meta name="robots" content="index, follow" />
//   <meta name="author" content="MyAZStore Team" />

//   <title>MyAZStore API • Running & Healthy</title>

//   <link rel="icon" href="https://myazstore.shop/favicon.ico" type="image/x-icon" />
//   <link rel="canonical" href="https://api.myazstore.shop" />

//   <!-- Open Graph / Social Sharing -->
//   <meta property="og:title" content="MyAZStore API - Live & Running" />
//   <meta property="og:description" content="The official backend API for MyAZStore e-commerce platform is up and running!" />
//   <meta property="og:type" content="website" />
//   <meta property="og:url" content="https://api.myazstore.shop" />
//   <meta property="og:image" content="https://myazstore.shop/og-image.jpg" />

//   <style>
//     /* Minimal inline styles only for beauty — still counts as clean HTML */
//     body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; margin:0; padding:0; line-height:1.6; }
//     .container { max-width: 800px; margin: 4rem auto; padding: 3rem; text-align: center; background: #1e293b; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid #334155; }
//     h1 { font-size: 3.5rem; margin: 0 0 1rem; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
//     p { font-size: 1.25rem; margin: 1rem 0; color: #94a3b8; }
//     a { color: #93c5fd; text-decoration: none; font-weight: 600; }
//     a:hover { text-decoration: underline; }
//     .status { display: inline-block; padding: 0.75rem 1.5rem; background: #22c55e; color: white; border-radius: 50px; font-weight: bold; font-size: 1.1rem; margin: 1.5rem 0; }
//     .links { margin-top: 2.5rem; }
//     .links a { display: inline-block; margin: 0.8rem 1.2rem; padding: 1rem 2rem; background: #334155; border-radius: 12px; transition: all 0.2s; }
//     .links a:hover { background: #475569; transform: translateY(-2px); }
//     footer { margin-top: 4rem; color: #64748b; font-size: 0.9rem; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <h1>MyAZStore API</h1>
//     <p class="status">ONLINE & RUNNING</p>

//     <p>
//       The backend API for <strong>MyAZStore</strong> e-commerce platform is
//       <strong>healthy</strong> and fully operational.
//     </p>

//     <p>Powered by Node.js • Hosted on Vercel Serverless Functions</p>

//     <div class="links">
//       <a href="https://myazstore.shop" target="_blank" rel="noopener">
//         Customer Store
//       </a>
//       <a href="https://admin.myazstore.shop" target="_blank" rel="noopener">
//         Admin Dashboard
//       </a>
//     </div>

//     <footer>
//       © 2025 MyAZStore • All systems operational • Version 2.1.0
//     </footer>
//   </div>
// </body>
// </html>
//   `);
// });

// /* ======================================================
//    8️⃣ Export for Vercel
// ====================================================== */
// export const handler = serverless(app);

// export default app;

// /* ======================================================
//    9️⃣ Local Dev
// ====================================================== */
// if (!process.env.VERCEL) {
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () =>
//     console.log(`🚀 Server running locally on port ${PORT}`)
//   );
// }

///////////////// Updated with Security
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import serverless from "serverless-http";

import connectDB from "./config/db.js";
import { attackLogger } from "./middlewares/security/attackLogger.js";

// ROUTES
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import heroRoutes from "./routes/heroRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import profitRoutes from "./routes/profitRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import appRoutes from "./routes/app/appRoutes.js";

dotenv.config();

const app = express();

/* ======================================================
   1️⃣ CORS FIRST (allow only trusted domains)
====================================================== */
const allowedOrigins = [
  "https://myazstore.shop",
  "https://admin.myazstore.shop",
  "https://api.myazstore.shop",
  "http://localhost:5173",
];
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, "
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, HEAD ,POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ======================================================
   2️⃣ SECURITY — Helmet + Rate Limit
====================================================== */
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    handler(req) {
      console.log("⚠️ Rate Limit Triggered:", req.ip, req.originalUrl);
      return req.res
        .status(429)
        .json({ success: false, message: "Too many requests" });
    },
  })
);

/* ======================================================
   3️⃣ Body parser + Cookies
====================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser(process.env.JWT_SECRET));

/* ======================================================
   4️⃣ Attack Logger
====================================================== */
app.use(attackLogger);

/* ======================================================
   5️⃣ Connect DB once (optimized for Vercel)
====================================================== */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ success: false, message: "DB connection failed" });
  }
});

/* ======================================================
   6️⃣ Routes
====================================================== */
app.use("/v1", appRoutes);

app.use("/v1/products", productRoutes);
app.use("/v1/categories", categoryRoutes);
app.use("/v1/orders", orderRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/wishlist", wishlistRoutes);
app.use("/v1/cart", cartRoutes);

app.use("/v1/payment", paymentRoutes);
app.use("/v1/invoice", invoiceRoutes);
app.use("/v1/addresses", addressRoutes);
app.use("/v1/checkout", checkoutRoutes);

/*---------- Admin Routes ---------- */

app.use("/v1/hero", heroRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/v1/ai", aiRoutes);
app.use("/v1/admin/inventory", inventoryRoutes);
app.use("/v1/admin/profit", profitRoutes);
app.use("/v1/admin/notifications", notificationRoutes);
/* ======================================================
   7️⃣ Home Route
====================================================== */
app.get("/", (req, res) => {
  res.send("MyAZStore API Running ✔");
});

/* ======================================================
   8️⃣ Export for Vercel
====================================================== */
export const handler = serverless(app);
export default app;

/* ======================================================
   9️⃣ Local Dev
====================================================== */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🔥 Local API on port ${PORT}`));
}
