import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import upload from "../middlewares/upload.js";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  addReview,
  getProductsByCategorySlug,
  getProductBySlug,
  restoreProduct,
} from "../controllers/productController.js";

const router = express.Router();

/* ------------------------------------------------------------------------ */

// PUBLIC ROUTES
router.get("/", getProducts);
router.get("/search", searchProducts);

// For Category SEO
router.get("/category/:slug", getProductsByCategorySlug);
// single product by slug
router.get("/slug/:slug", getProductBySlug);

// fallback by id
router.get("/:id", getProductById);

//-------Admin-------
router.post("/create", verifyAdminCookie, upload.array("images"), addProduct);
router.put("/:id", verifyAdminCookie, upload.array("images"), updateProduct);

router.delete("/:id", verifyAdminCookie, deleteProduct);
router.patch("/:id/restore", verifyAdminCookie, restoreProduct);

// USER REVIEW
router.post("/:id/review", addReview);

export default router;
