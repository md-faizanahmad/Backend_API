// import express from "express";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// import {
//   getInventoryOverview,
//   getInventoryProduct,
// } from "../controllers/inventoryController.js";
// const router = express.Router();

// /* ---------------------------
//    GET INVENTORY STATS
// --------------------------- */
// router.get("/", verifyAdminCookie, getInventoryOverview);
// router.get("/product/:id", verifyAdminCookie, getInventoryProduct);
// export default router;

import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import {
  getInventoryOverview,
  getInventoryProduct,
  getStockStatusGroups,
} from "../controllers/inventoryController.js";

const router = express.Router();

/* ---------------------------
      INVENTORY ROUTES
--------------------------- */

// Global overview (stats + product list)
router.get("/", verifyAdminCookie, getInventoryOverview);

// Grouped stock: dead, low, positive
router.get("/stock-status", verifyAdminCookie, getStockStatusGroups);

// Single product inventory analytics
router.get("/product/:id", verifyAdminCookie, getInventoryProduct);

export default router;
