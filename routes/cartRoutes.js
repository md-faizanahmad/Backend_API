// routes/cartRoutes.js
import express from "express";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import {
  getCart,
  addToCart,
  updateCartQty,
  removeFromCart,
} from "../controllers/cartControllers.js";

const router = express.Router();

router.use(verifyUserCookie);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartQty);
router.delete("/remove/:productId", removeFromCart);

export default router;
