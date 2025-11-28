import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import {
  getInventoryOverview,
  getInventoryProduct,
} from "../controllers/inventoryController.js";
const router = express.Router();

/* ---------------------------
   GET INVENTORY STATS
--------------------------- */
router.get("/", verifyAdminCookie, getInventoryOverview);
router.get("/product/:id", verifyAdminCookie, getInventoryProduct);
export default router;
