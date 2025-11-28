// routes/userRoutes.js
import express from "express";
import {
  signup,
  login,
  googleLogin,
  me,
  logout,
  loginWithOtp,
} from "../controllers/userController.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";
const router = express.Router();

router.post("/login", login);
router.post("/send-otp", sendOtp); // same endpoint for signup & login
router.post("/verify-otp", verifyOtp); // same endpoint for signup & login
router.post("/login-otp", loginWithOtp); // NEW for login using otpToken

router.post("/google-login", googleLogin);

// new 27-11 signup
router.post("/signup", signup);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// old
router.get("/me", verifyUserCookie, me);
router.post("/logout", logout);
// router.post("/google-login", googleLogin);

export default router;
