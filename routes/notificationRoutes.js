import express from "express";
import {
  listNotifications,
  markNotificationsRead,
} from "../controllers/notificationController.js";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// router.get("/", verifyAdminCookie, listNotifications);
// router.post("/mark-read", verifyAdminCookie, markNotificationsRead);

router.get("/", verifyAdminCookie, async (req, res) => {
  req.isAdmin = true;
  return listNotifications(req, res);
});
router.get("/mark-read", verifyAdminCookie, async (req, res) => {
  req.isAdmin = true;
  return markNotificationsRead(req, res);
});

export default router;
