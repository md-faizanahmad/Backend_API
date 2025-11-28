// api/routes/addressRoutes.js
import express from "express";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import {
  addAddress,
  getAddresses,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "../controllers/addressController.js";

import validateAddress from "../validation/addressValidation.js";

const router = express.Router();

router.use(verifyUserCookie);

// Get all addresses
router.get("/", getAddresses);

// Add new
router.post("/add", validateAddress, addAddress);

// Update
router.put("/update/:id", validateAddress, updateAddress);

// Set default
router.put("/default/:addressId", setDefaultAddress);

// Delete
router.delete("/:addressId", deleteAddress);

export default router;
