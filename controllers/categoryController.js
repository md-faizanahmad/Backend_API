// import Category from "../models/Category.js";

// export async function createCategory(req, res) {
//   try {
//     const { name, description = "" } = req.body;
//     if (!name)
//       return res.status(400).json({ success: false, message: "Name required" });

//     const exists = await Category.findOne({ name });
//     if (exists)
//       return res
//         .status(400)
//         .json({ success: false, message: "Category already exists" });

//     const cat = await Category.create({ name, description });
//     return res
//       .status(201)
//       .json({ success: true, message: "Category created", category: cat });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// }

// export async function getCategories(_req, res) {
//   try {
//     const categories = await Category.find().sort({ createdAt: -1 });
//     return res.json({ success: true, categories });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch", error: err.message });
//   }
// }

// export async function updateCategory(req, res) {
//   try {
//     const { id } = req.params;
//     const { name, description = "" } = req.body;

//     const updated = await Category.findByIdAndUpdate(
//       id,
//       { name, description },
//       { new: true }
//     );
//     if (!updated)
//       return res.status(404).json({ success: false, message: "Not found" });

//     return res.json({
//       success: true,
//       message: "Category updated",
//       category: updated,
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Update failed", error: err.message });
//   }
// }

// export async function deleteCategory(req, res) {
//   try {
//     const { id } = req.params;
//     const deleted = await Category.findByIdAndDelete(id);
//     if (!deleted)
//       return res.status(404).json({ success: false, message: "Not found" });

//     return res.json({ success: true, message: "Category deleted" });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Delete failed", error: err.message });
//   }
// }
/////////////////////////////////////////////////////////////////////////
////////////////// update with reviews and all
// controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, parent } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const exists = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      image,
      parent: parent || null,
    });

    res.status(201).json({
      success: true,
      message: "Category created",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { parent } = req.query;

    const query = parent === "null" || !parent ? { parent: null } : { parent };

    const categories = await Category.find(query)
      .select("name slug image parent")
      .populate("children", "name slug image")
      .sort({ name: 1 });

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name) {
      updates.slug = undefined; // will be regenerated
    }

    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("children", "name slug");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Updated", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent delete if products exist
    const hasProducts = await Product.findOne({ category: id });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with products",
      });
    }

    const hasChildren = await Category.findOne({ parent: id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with subcategories",
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
