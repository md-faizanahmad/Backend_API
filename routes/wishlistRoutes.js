// routes/wishlistRoutes.js
import express from "express";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// GET all wishlist items
router.get("/", verifyUserCookie, getWishlist);

// ADD product to wishlist
router.post("/add/:productId", verifyUserCookie, addToWishlist);

// REMOVE product from wishlist
router.delete("/remove/:productId", verifyUserCookie, removeFromWishlist);

export default router;
