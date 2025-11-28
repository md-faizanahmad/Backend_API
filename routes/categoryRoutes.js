import express from "express";
import { verifyAdminCookie } from "../middlewares/verifyAdmin.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", verifyAdminCookie, createCategory);
router.put("/:id", verifyAdminCookie, updateCategory);
router.delete("/:id", verifyAdminCookie, deleteCategory);

export default router;
