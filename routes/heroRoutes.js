import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import { getHero, updateHero } from "../controllers/heroController.js";
import imageService from "../utils/imageService.js";

const router = express.Router();

// PUBLIC route
router.get("/", getHero);

router.put(
  "/",
  imageService.multerFields([{ name: "backgroundImage", maxCount: 1 }]),
  verifyAdminCookie,
  updateHero
);

export default router;
