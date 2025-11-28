import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import {
  getProfitSummary,
  getMonthlyProfit,
} from "../controllers/profitController.js";

const router = express.Router();

router.get("/summary", verifyAdminCookie, getProfitSummary);
router.get("/monthly", verifyAdminCookie, getMonthlyProfit);

export default router;
