///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// Updated and Working one
// import Category from "../models/Category.js";
// import Product from "../models/Product.js";
// import Order from "../models/Order.js";

// /* ============================================================
//    CREATE CATEGORY (main or sub)
// ============================================================ */
// export const createCategory = async (req, res) => {
//   try {
//     const { name, image, isSub, parent } = req.body;

//     if (!name?.trim()) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Name is required" });
//     }

//     // Subcategory must have a parent
//     if (isSub && !parent) {
//       return res.status(400).json({
//         success: false,
//         message: "Parent category is required for subcategory",
//       });
//     }

//     // Check name duplicate
//     const exists = await Category.findOne({
//       name: new RegExp(`^${name.trim()}$`, "i"),
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Category with this name already exists",
//       });
//     }

//     // If subcategory → ensure parent exists
//     if (isSub) {
//       const parentCat = await Category.findById(parent).lean();
//       if (!parentCat || parentCat.isDeleted) {
//         return res.status(400).json({
//           success: false,
//           message: "Parent category not found",
//         });
//       }
//     }

//     const category = await Category.create({
//       name: name.trim(),
//       image: image || null,
//       isSub: Boolean(isSub),
//       parent: isSub ? parent : null,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Category created",
//       category,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    GET CATEGORIES (Admin / Shop)
// ============================================================ */

// // export const getCategories = async (req, res) => {
// //   try {
// //     const isAdmin = req.query.admin === "true";
// //     if (!isAdmin) {
// //       res.set("Cache-Control", "public, max-age=60");
// //     }

// //     const filter = isAdmin ? {} : { isDeleted: false };

// //     const all = await Category.find(filter).sort({ name: 1 }).lean();

// //     const main = all.filter((c) => !c.isSub);
// //     const subs = all.filter((c) => c.isSub);

// //     const grouped = main.map((m) => ({
// //       ...m,
// //       subcategories: subs
// //         .filter((s) => s.parent?.toString() === m._id.toString())
// //         .map((s) => ({
// //           _id: s._id,
// //           name: s.name,
// //           slug: s.slug,
// //           isDeleted: s.isDeleted,
// //         })),
// //     }));

// //     return res.json({ success: true, categories: grouped });
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// export const getCategories = async (req, res) => {
//   try {
//     const isAdmin = req.query.admin === "true";

//     // Use cache only for store users (not admin)
//     const cacheKey = "categories:public";

//     const filter = isAdmin ? {} : { isDeleted: false };

//     const all = await Category.find(filter).sort({ name: 1 }).lean();

//     const main = all.filter((c) => !c.isSub);
//     const subs = all.filter((c) => c.isSub);

//     const grouped = main.map((m) => ({
//       ...m,
//       subcategories: subs
//         .filter((s) => s.parent?.toString() === m._id.toString())
//         .map((s) => ({
//           _id: s._id,
//           name: s.name,
//           slug: s.slug,
//           isDeleted: s.isDeleted,
//         })),
//     }));

//     const response = { success: true, categories: grouped };

//     return res.json(response);
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    UPDATE CATEGORY
// ============================================================ */
// export const updateCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, image, isSub, parent } = req.body;

//     // Prevent making a category its own parent
//     if (parent && parent === id) {
//       return res.status(400).json({
//         success: false,
//         message: "A category cannot be its own parent",
//       });
//     }

//     const updates = {
//       name,
//       image: image || null,
//       isSub: Boolean(isSub),
//       parent: isSub ? parent : null,
//     };

//     const category = await Category.findByIdAndUpdate(id, updates, {
//       new: true,
//       runValidators: true,
//     }).lean();

//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found" });
//     }

//     return res.json({ success: true, category });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    SOFT DELETE CATEGORY (Cascade)
// ============================================================ */
// export const softDeleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const now = new Date();

//     // Soft delete main category
//     await Category.findByIdAndUpdate(id, {
//       isDeleted: true,
//       deletedAt: now,
//     });

//     // Soft delete subcategories
//     await Category.updateMany(
//       { parent: id },
//       { isDeleted: true, deletedAt: now }
//     );

//     // Soft delete child products
//     await Product.updateMany(
//       { category: id },
//       { isArchived: true, archivedAt: now, stock: 0 }
//     );

//     // Also soft delete products of subcategories
//     const subIds = (await Category.find({ parent: id }).lean()).map(
//       (c) => c._id
//     );

//     if (subIds.length > 0) {
//       await Product.updateMany(
//         { category: { $in: subIds } },
//         { isArchived: true, archivedAt: now, stock: 0 }
//       );
//     }

//     return res.json({
//       success: true,
//       message:
//         "Category, subcategories and their products soft-deleted successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    RESTORE CATEGORY (Cascade)
// ============================================================ */
// export const restoreCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Restore main
//     await Category.findByIdAndUpdate(id, {
//       isDeleted: false,
//       deletedAt: null,
//     });

//     // Restore subcategories
//     await Category.updateMany(
//       { parent: id },
//       { isDeleted: false, deletedAt: null }
//     );

//     // Restore products
//     await Product.updateMany(
//       { category: id },
//       { isArchived: false, archivedAt: null }
//     );

//     const subIds = (await Category.find({ parent: id })).map((c) => c._id);

//     if (subIds.length > 0) {
//       await Product.updateMany(
//         { category: { $in: subIds } },
//         { isArchived: false, archivedAt: null }
//       );
//     }

//     return res.json({
//       success: true,
//       message: "Category, subcategories and products restored successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    HARD DELETE CATEGORY (Cascade)
// ============================================================ */
// export const hardDeleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const mainCat = await Category.findById(id);
//     if (!mainCat) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     // Collect subcategories
//     const subcats = await Category.find({ parent: id }).select("_id");
//     const subIds = subcats.map((s) => s._id);

//     // Collect products in main + subcategories
//     const products = await Product.find({
//       category: { $in: [id, ...subIds] },
//     }).select("_id");

//     const productIds = products.map((p) => p._id);

//     // Prevent deleting if any product is part of an order
//     if (productIds.length > 0) {
//       const used = await Order.findOne({
//         "items.product": { $in: productIds },
//       });

//       if (used) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot permanently delete: Some products exist in orders.",
//         });
//       }
//     }

//     // Safe to delete permanently
//     await Product.deleteMany({ category: { $in: [id, ...subIds] } });
//     await Category.deleteMany({ parent: id });
//     await Category.findByIdAndDelete(id);

//     return res.json({
//       success: true,
//       message: "Category, subcategories, and products permanently deleted",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

/////////////////////////// New with validation and normalize category name-
// controllers/categoryController.js

// import Category from "../models/Category.js";
// import Product from "../models/Product.js";
// import Order from "../models/Order.js";
// import { validateCategoryInput } from "../validation/validateCategoryInput.js";

// /* ============================================================
//    CREATE CATEGORY (main or sub)
//    - Validates and normalizes name
//    - Enforces case-insensitive uniqueness
//    - Ensures subcategory has a valid parent
// ============================================================ */
// export const createCategory = async (req, res) => {
//   try {
//     const { name, image, isSub, parent } = req.body;

//     // 1) Validate + normalize category name
//     const { isValid, errors, normalizedName } = validateCategoryInput(name);
//     if (!isValid) {
//       return res.status(400).json({
//         success: false,
//         message: errors[0], // return first error as main message
//         errors,
//       });
//     }

//     // 2) Subcategory must have a parent
//     if (isSub && !parent) {
//       return res.status(400).json({
//         success: false,
//         message: "Parent category is required for subcategory",
//       });
//     }

//     // 3) Case-insensitive duplicate check using normalized name
//     const exists = await Category.findOne({
//       name: new RegExp(`^${normalizedName}$`, "i"),
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Category with this name already exists",
//       });
//     }

//     // 4) If subcategory → ensure parent exists and is not deleted
//     if (isSub) {
//       const parentCat = await Category.findById(parent).lean();
//       if (!parentCat || parentCat.isDeleted) {
//         return res.status(400).json({
//           success: false,
//           message: "Parent category not found",
//         });
//       }
//     }

//     // 5) Create category with normalized name
//     const category = await Category.create({
//       name: normalizedName,
//       image: image || null,
//       isSub: Boolean(isSub),
//       parent: isSub ? parent : null,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Category created",
//       category,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    GET CATEGORIES
//    - If ?admin=true → returns all (including deleted)
//    - Else → only non-deleted
//    - Groups subcategories under their main category
// ============================================================ */
// export const getCategories = async (req, res) => {
//   try {
//     const isAdmin = req.query.admin === "true";

//     // For store users, you *could* add caching later (e.g. Redis)
//     // const cacheKey = "categories:public";

//     const filter = isAdmin ? {} : { isDeleted: false };

//     // Sorted by name for predictable ordering
//     const all = await Category.find(filter).sort({ name: 1 }).lean();

//     const main = all.filter((c) => !c.isSub);
//     const subs = all.filter((c) => c.isSub);

//     // Attach subcategories to each main category
//     const grouped = main.map((m) => ({
//       ...m,
//       subcategories: subs
//         .filter((s) => s.parent?.toString() === m._id.toString())
//         .map((s) => ({
//           _id: s._id,
//           name: s.name,
//           slug: s.slug,
//           isDeleted: s.isDeleted,
//         })),
//     }));

//     const response = { success: true, categories: grouped };

//     return res.json(response);
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    UPDATE CATEGORY
//    - Optional update of: name, image, isSub, parent
//    - Validates + normalizes name if provided
//    - Enforces case-insensitive uniqueness on name
//    - Ensures parent exists when converting to subcategory
//    - Prevents category from being its own parent
// ============================================================ */
// export const updateCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, image, isSub, parent } = req.body;

//     // 1) Prevent making a category its own parent
//     if (parent && parent === id) {
//       return res.status(400).json({
//         success: false,
//         message: "A category cannot be its own parent",
//       });
//     }

//     const updates = {};

//     // 2) If name is provided, validate + normalize + check duplicates
//     if (name !== undefined) {
//       const { isValid, errors, normalizedName } = validateCategoryInput(name);

//       if (!isValid) {
//         return res.status(400).json({
//           success: false,
//           message: errors[0],
//           errors,
//         });
//       }

//       // Duplicate check excluding the current category
//       const exists = await Category.findOne({
//         _id: { $ne: id },
//         name: new RegExp(`^${normalizedName}$`, "i"),
//       });

//       if (exists) {
//         return res.status(400).json({
//           success: false,
//           message: "Category with this name already exists",
//         });
//       }

//       updates.name = normalizedName;
//     }

//     // 3) Always allow updating image and isSub/parent
//     updates.image = image || null;
//     updates.isSub = Boolean(isSub);
//     updates.parent = isSub ? parent : null;

//     // 4) If converting to subcategory, parent must exist and not be deleted
//     if (isSub && parent) {
//       const parentCat = await Category.findById(parent).lean();
//       if (!parentCat || parentCat.isDeleted) {
//         return res.status(400).json({
//           success: false,
//           message: "Parent category not found",
//         });
//       }
//     }

//     // 5) Apply updates
//     const category = await Category.findByIdAndUpdate(id, updates, {
//       new: true,
//       runValidators: true,
//     }).lean();

//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found" });
//     }

//     return res.json({ success: true, category });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    SOFT DELETE CATEGORY (Cascade)
//    - Marks main category + its subcategories as deleted
//    - Archives all products under main + subcategories
// ============================================================ */
// export const softDeleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const now = new Date();

//     // 1) Soft delete main category
//     await Category.findByIdAndUpdate(id, {
//       isDeleted: true,
//       deletedAt: now,
//     });

//     // 2) Soft delete subcategories
//     await Category.updateMany(
//       { parent: id },
//       { isDeleted: true, deletedAt: now }
//     );

//     // 3) Soft delete products directly under this category
//     await Product.updateMany(
//       { category: id },
//       { isArchived: true, archivedAt: now, stock: 0 }
//     );

//     // 4) Soft delete products under subcategories
//     const subIds = (await Category.find({ parent: id }).lean()).map(
//       (c) => c._id
//     );

//     if (subIds.length > 0) {
//       await Product.updateMany(
//         { category: { $in: subIds } },
//         { isArchived: true, archivedAt: now, stock: 0 }
//       );
//     }

//     return res.json({
//       success: true,
//       message:
//         "Category, subcategories and their products soft-deleted successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    RESTORE CATEGORY (Cascade)
//    - Restores main category + its subcategories
//    - Unarchives all products under main + subcategories
// ============================================================ */
// export const restoreCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 1) Restore main category
//     await Category.findByIdAndUpdate(id, {
//       isDeleted: false,
//       deletedAt: null,
//     });

//     // 2) Restore subcategories
//     await Category.updateMany(
//       { parent: id },
//       { isDeleted: false, deletedAt: null }
//     );

//     // 3) Restore products directly under this category
//     await Product.updateMany(
//       { category: id },
//       { isArchived: false, archivedAt: null }
//     );

//     // 4) Restore products under subcategories
//     const subIds = (await Category.find({ parent: id })).map((c) => c._id);

//     if (subIds.length > 0) {
//       await Product.updateMany(
//         { category: { $in: subIds } },
//         { isArchived: false, archivedAt: null }
//       );
//     }

//     return res.json({
//       success: true,
//       message: "Category, subcategories and products restored successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// /* ============================================================
//    HARD DELETE CATEGORY (Cascade)
//    - Permanently deletes category, its subcategories, and products
//    - BUT only if none of those products are used in any order
// ============================================================ */
// export const hardDeleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 1) Ensure main category exists
//     const mainCat = await Category.findById(id);
//     if (!mainCat) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     // 2) Collect subcategories
//     const subcats = await Category.find({ parent: id }).select("_id");
//     const subIds = subcats.map((s) => s._id);

//     // 3) Collect all product IDs under main + subcategories
//     const products = await Product.find({
//       category: { $in: [id, ...subIds] },
//     }).select("_id");

//     const productIds = products.map((p) => p._id);

//     // 4) Block deletion if any product is used in orders
//     if (productIds.length > 0) {
//       const used = await Order.findOne({
//         "items.product": { $in: productIds },
//       });

//       if (used) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot permanently delete: Some products exist in orders.",
//         });
//       }
//     }

//     // 5) Safe to permanently delete:
//     //    - products under main + subcategories
//     //    - subcategories
//     //    - main category itself
//     await Product.deleteMany({ category: { $in: [id, ...subIds] } });
//     await Category.deleteMany({ parent: id });
//     await Category.findByIdAndDelete(id);

//     return res.json({
//       success: true,
//       message: "Category, subcategories, and products permanently deleted",
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// NEW UPDATE WITH IMAGE
// controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { validateCategoryInput } from "../validation/validateCategoryInput.js";
import imageService from "../utils/imageService.js";

/* ============================================================================
  NOTES:
  - imageService must expose:
      * resolveIncomingFile(req)
      * uploadSingleFileToCloudinary(file, folder)
      * safeDeletePublicId(publicId)
      * cloudinaryOptimizeUrl(url)
      * getIncomingFiles(req)  (used internally by resolveIncomingFile)
  - Category schema expected to have `image` (String) and `imagePublicId` (String).
  - Category and subcategory images are optional.
  ============================================================================ */

/* ============================================================
   CREATE CATEGORY (main or sub)
   - Validates name, enforces uniqueness, ensures parent for sub
   - Accepts optional uploaded image (req.file) OR body.image (URL)
   - Stores image URL in `image` and cloudinary public_id in `imagePublicId`
   ============================================================ */
export const createCategory = async (req, res) => {
  try {
    // Accept file if middleware provided it (supports single, array, fields)
    const file = imageService.resolveIncomingFile(req);

    const { name, isSub, parent } = req.body;

    // 1) Validate + normalize category name
    const { isValid, errors, normalizedName } = validateCategoryInput(name);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // 2) If subcategory required parent
    if (isSub === "true" || isSub === true) {
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category is required for subcategory",
        });
      }
    }

    // 3) Duplicate check (case-insensitive)
    const exists = await Category.findOne({
      name: new RegExp(`^${normalizedName}$`, "i"),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // 4) Ensure parent exists if subcategory
    if (isSub === "true" || isSub === true) {
      const parentCat = await Category.findById(parent).lean();
      if (!parentCat || parentCat.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    // 5) Image handling (file preferred; otherwise accept body.image as URL)
    let imageUrl = null;
    let imagePublicId = null;

    if (file) {
      // Upload buffer to Cloudinary (folder "categories")
      const uploaded = await imageService.uploadSingleFileToCloudinary(
        file,
        "categories"
      );
      if (uploaded) {
        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
      }
    } else if (req.body.image) {
      // Accept external URL (and optional imagePublicId)
      imageUrl = req.body.image || null;
      imagePublicId = req.body.imagePublicId || null;
    }

    // 6) Create category
    const category = await Category.create({
      name: normalizedName,
      image: imageUrl,
      imagePublicId: imagePublicId,
      isSub: Boolean(isSub === "true" || isSub === true),
      parent: isSub === "true" || isSub === true ? parent : null,
    });

    return res.status(201).json({
      success: true,
      message: "Category created",
      category,
    });
  } catch (error) {
    console.error("createCategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET CATEGORIES
   - admin flag controls deleted vs non-deleted
   - groups subcategories under main categories
   - includes image URLs for both main and subcategories
   ============================================================ */
export const getCategories = async (req, res) => {
  try {
    const isAdmin = req.query.admin === "true";
    const filter = isAdmin ? {} : { isDeleted: false };

    const all = await Category.find(filter).sort({ name: 1 }).lean();

    const main = all.filter((c) => !c.isSub);
    const subs = all.filter((c) => c.isSub);

    const grouped = main.map((m) => {
      const mappedSubs = subs
        .filter((s) => s.parent?.toString() === m._id.toString())
        .map((s) => ({
          _id: s._id,
          name: s.name,
          slug: s.slug,
          isDeleted: s.isDeleted,
          image: s.image ? imageService.cloudinaryOptimizeUrl(s.image) : null,
        }));

      return {
        ...m,
        image: m.image ? imageService.cloudinaryOptimizeUrl(m.image) : null,
        subcategories: mappedSubs,
      };
    });

    return res.json({ success: true, categories: grouped });
  } catch (error) {
    console.error("getCategories error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   UPDATE CATEGORY
   - Supports: name, image (upload or url), image removal, isSub, parent
   - When replacing or removing images we attempt to delete old publicId
   ============================================================ */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const file = imageService.resolveIncomingFile(req);
    const { name, image, isSub, parent, imageRemoved } = req.body;

    // Prevent self-parenting
    if (parent && parent === id) {
      return res.status(400).json({
        success: false,
        message: "A category cannot be its own parent",
      });
    }

    const updates = {};

    // Name validation & uniqueness
    if (name !== undefined) {
      const { isValid, errors, normalizedName } = validateCategoryInput(name);
      if (!isValid) {
        return res
          .status(400)
          .json({ success: false, message: errors[0], errors });
      }

      const exists = await Category.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${normalizedName}$`, "i"),
      });

      if (exists) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Category with this name already exists",
          });
      }

      updates.name = normalizedName;
    }

    // Fetch current doc for cleanup decisions
    const current = await Category.findById(id).lean();
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Image handling:
    // priority -> uploaded file -> explicit remove -> body.image URL -> keep existing
    if (file) {
      const uploaded = await imageService.uploadSingleFileToCloudinary(
        file,
        "categories"
      );
      if (uploaded) {
        updates.image = uploaded.url;
        updates.imagePublicId = uploaded.publicId;
      }
    } else if (
      imageRemoved === "true" ||
      imageRemoved === true ||
      image === ""
    ) {
      // explicit removal request
      updates.image = null;
      updates.imagePublicId = null;
    } else if (image) {
      // set external URL and optional public id from client
      updates.image = image;
      if (req.body.imagePublicId)
        updates.imagePublicId = req.body.imagePublicId;
    }

    // isSub / parent handling with validation
    if (isSub !== undefined) {
      updates.isSub = Boolean(isSub === "true" || isSub === true);
      updates.parent = updates.isSub ? parent : null;

      if (updates.isSub && updates.parent) {
        const parentCat = await Category.findById(updates.parent).lean();
        if (!parentCat || parentCat.isDeleted) {
          return res
            .status(400)
            .json({ success: false, message: "Parent category not found" });
        }
      }
    }

    // Apply updates
    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Cleanup old image(s) when replaced/removed (best-effort)
    if (file && current.imagePublicId) {
      // If we uploaded a new file and there was an old publicId -> delete old
      await imageService.safeDeletePublicId(current.imagePublicId);
    }
    if (
      (imageRemoved === "true" || imageRemoved === true || image === "") &&
      current.imagePublicId
    ) {
      // If client requested image removal -> delete old publicId
      await imageService.safeDeletePublicId(current.imagePublicId);
    }

    return res.json({ success: true, category });
  } catch (error) {
    console.error("updateCategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   SOFT DELETE CATEGORY (Cascade)
   - Marks main category + its subcategories as deleted
   - Archives all products under main + subcategories
   - Images are retained (so restore keeps them)
   ============================================================ */
export const softDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    await Category.findByIdAndUpdate(id, { isDeleted: true, deletedAt: now });
    await Category.updateMany(
      { parent: id },
      { isDeleted: true, deletedAt: now }
    );

    await Product.updateMany(
      { category: id },
      { isArchived: true, archivedAt: now, stock: 0 }
    );

    const subIds = (await Category.find({ parent: id }).lean()).map(
      (c) => c._id
    );

    if (subIds.length > 0) {
      await Product.updateMany(
        { category: { $in: subIds } },
        { isArchived: true, archivedAt: now, stock: 0 }
      );
    }

    return res.json({
      success: true,
      message:
        "Category, subcategories and their products soft-deleted successfully",
    });
  } catch (error) {
    console.error("softDeleteCategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   RESTORE CATEGORY (Cascade)
   - Restores main + subcategories and unarchives products
   ============================================================ */
export const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await Category.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null });
    await Category.updateMany(
      { parent: id },
      { isDeleted: false, deletedAt: null }
    );

    await Product.updateMany(
      { category: id },
      { isArchived: false, archivedAt: null }
    );

    const subIds = (await Category.find({ parent: id })).map((c) => c._id);
    if (subIds.length > 0) {
      await Product.updateMany(
        { category: { $in: subIds } },
        { isArchived: false, archivedAt: null }
      );
    }

    return res.json({
      success: true,
      message: "Category, subcategories and products restored successfully",
    });
  } catch (error) {
    console.error("restoreCategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   HARD DELETE CATEGORY (Cascade)
   - Permanently deletes category, its subcategories, and products
   - Only allowed if none of those products are used in any order
   - Attempts to delete images (main + subcategories) from Cloudinary
   ============================================================ */
export const hardDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const mainCat = await Category.findById(id);
    if (!mainCat) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // collect subcategories (with imagePublicId) and their ids
    const subcats = await Category.find({ parent: id }).select(
      "_id imagePublicId image"
    );
    const subIds = subcats.map((s) => s._id);

    // collect product ids under main + subcategories
    const products = await Product.find({
      category: { $in: [id, ...subIds] },
    }).select("_id");
    const productIds = products.map((p) => p._id);

    // block if any product used in orders
    if (productIds.length > 0) {
      const used = await Order.findOne({
        "items.product": { $in: productIds },
      });
      if (used) {
        return res.status(400).json({
          success: false,
          message: "Cannot permanently delete: Some products exist in orders.",
        });
      }
    }

    // safe to delete products and categories
    await Product.deleteMany({ category: { $in: [id, ...subIds] } });
    await Category.deleteMany({ parent: id });
    await Category.findByIdAndDelete(id);

    // best-effort: delete images from Cloudinary
    try {
      if (mainCat.imagePublicId) {
        await imageService.safeDeletePublicId(mainCat.imagePublicId);
      }
      for (const sc of subcats) {
        if (sc.imagePublicId) {
          await imageService.safeDeletePublicId(sc.imagePublicId);
        }
      }
    } catch (err) {
      console.warn(
        "hardDeleteCategory image cleanup warning:",
        err.message || err
      );
    }

    return res.json({
      success: true,
      message: "Category, subcategories, and products permanently deleted",
    });
  } catch (error) {
    console.error("hardDeleteCategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
