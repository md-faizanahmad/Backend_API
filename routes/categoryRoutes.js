// import express from "express";
// import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
// import {
//   createCategory,
//   getCategories,
//   updateCategory,
//   deleteCategory,
// } from "../controllers/categoryController.js";

// const router = express.Router();

// router.get("/", getCategories);
// router.post("/", verifyAdminCookie, createCategory);
// router.put("/:id", verifyAdminCookie, updateCategory);
// router.delete("/:id", verifyAdminCookie, deleteCategory);

// export default router;

////////////////////////---- new with subcategories

import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  hardDeleteCategory,
} from "../controllers/categoryController.js";
import imageService from "../utils/imageService.js";

const router = express.Router();

router.get("/", getCategories);

// router.post("/", verifyAdminCookie, createCategory);
// router.put("/:id", verifyAdminCookie, updateCategory);

/// new
router.post(
  "/",
  verifyAdminCookie,
  imageService.upload.single("image"),
  createCategory
);
router.put(
  "/:id",
  verifyAdminCookie,
  imageService.upload.single("image"),
  updateCategory
);

router.delete("/:id", verifyAdminCookie, softDeleteCategory);
router.patch("/:id/restore", verifyAdminCookie, restoreCategory);
router.delete("/:id/force", verifyAdminCookie, hardDeleteCategory);

export default router;
