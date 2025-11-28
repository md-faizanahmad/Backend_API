import express from "express";
import {
  listNotifications,
  markNotificationsRead,
} from "../controllers/notificationController.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";

const router = express.Router();

router.get("/", verifyUserCookie, listNotifications);
router.post("/mark-read", verifyUserCookie, markNotificationsRead);

export default router;
