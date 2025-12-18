// import express from "express";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// import { verifyUserCookie } from "../middlewares/verifyUser.js";
// import upload from "../middlewares/upload.js";
// import {
//   addProduct,
//   getProducts,
//   getProductById,
//   updateProduct,
//   searchProducts,
//   addReview,
//   getProductsByCategorySlug,
//   getProductBySlug,
//   restoreProduct,
//   softDeleteProduct,
//   hardDeleteProduct,
//   getProductsByCategory,
// } from "../controllers/productController.js";

// const router = express.Router();

// /* ------------------------------------------------------------------------ */

// // PUBLIC ROUTES
// router.get("/", getProducts);
// router.get("/search", searchProducts);

// // For Category SEO
// router.get("/category/:slug", getProductsByCategorySlug);
// // single product by slug
// router.get("/slug/:slug", getProductBySlug);

// // get product by category
// router.get("/by-category/:id", getProductsByCategory);

// // fallback by id
// router.get("/:id", getProductById);

// // USER REVIEW // reviews need login
// router.post("/:id/review", verifyUserCookie, addReview);

// //-------Admin-------

// router.post(
//   "/create",
//   verifyAdminCookie,
//   upload.array("images", 10),
//   addProduct
// );
// router.put(
//   "/:id",
//   verifyAdminCookie,
//   upload.array("images", 10),
//   updateProduct
// );

// router.delete("/:id", verifyAdminCookie, softDeleteProduct); // soft delete
// router.patch("/:id/restore", verifyAdminCookie, restoreProduct); // restore
// router.delete("/:id/force", verifyAdminCookie, hardDeleteProduct); // hard delete

// export default router;

//// 02-12
import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  searchProducts,
  addReview,
  getProductsByCategorySlug,
  getProductBySlug,
  restoreProduct,
  softDeleteProduct,
  hardDeleteProduct,
  getProductsByCategory,
} from "../controllers/productController.js";
import imageService from "../utils/imageService.js";
import Product from "../models/Product.js";
const router = express.Router();

/* ------------------------------------------------------------------------ */

// PUBLIC ROUTES
router.get("/", getProducts);
router.get("/search", searchProducts);

// For Category SEO
router.get("/category/:slug", getProductsByCategorySlug);

// Product
// single product by slug
router.get("/slug/:slug", getProductBySlug);

// get product by category
router.get("/by-category/:id", getProductsByCategory);

// fallback by id
router.get("/:id", getProductById);

// USER REVIEW // reviews need login
router.post("/:id/review", verifyUserCookie, addReview);

//-------Admin-------
const fields = [
  { name: "images", maxCount: 10 },
  { name: "images[]", maxCount: 10 },
  { name: "existingImages", maxCount: 20 },
];

router.post(
  "/create",
  verifyAdminCookie,
  imageService.multerFields(fields),
  addProduct
);
router.put(
  "/:id",
  verifyAdminCookie,
  imageService.multerFields(fields),
  updateProduct
);

router.delete("/:id", verifyAdminCookie, softDeleteProduct); // soft delete
router.patch("/:id/restore", verifyAdminCookie, restoreProduct); // restore
router.delete("/:id/force", verifyAdminCookie, hardDeleteProduct); // hard delete

router.get("/stock-status", async (req, res) => {
  const products = await Product.find();

  const dead = [];
  const low = [];
  const positive = [];

  products.forEach((p) => {
    const status = p.stockStatus;
    if (status === "dead") dead.push(p);
    else if (status === "low") low.push(p);
    else positive.push(p);
  });

  res.json({
    dead,
    low,
    positive,
    counts: {
      dead: dead.length,
      low: low.length,
      positive: positive.length,
    },
  });
});

export default router;
