import express from "express";
import verifyUserOptional from "../../middlewares/verifyUserOptional.js";
import { getBootstrap, getHome } from "../../controllers/app/appController.js";

const router = express.Router();

// GET /v1/bootstrap
router.get("/bootstrap", verifyUserOptional, getBootstrap);

// GET /v1/home
router.get("/home", getHome);

export default router;
