import express from "express";
import upload from "../middlewares/upload.js";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import { getHero, updateHero } from "../controllers/heroController.js";

const router = express.Router();

// PUBLIC route
router.get("/", getHero);

// ADMIN route
router.put(
  "/",
  verifyAdminCookie,
  upload.single("backgroundImage"),
  updateHero
);

export default router;
