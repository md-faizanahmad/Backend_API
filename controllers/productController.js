import Product from "../models/Product.js";
import Category from "../models/Category.js";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   CLOUDINARY UPLOAD (BUFFER)
============================================================ */
async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "MyStore/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/* ============================================================
   SEARCH PRODUCTS
============================================================ */
export async function searchProducts(req, res) {
  try {
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, products: [] });
    }

    const searchTerm = q.trim();

    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
      stock: { $gt: 0 },
      isDeleted: { $ne: true },
    })
      .select("name price imageUrl category description")
      .populate("category", "name")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: err.message,
    });
  }
}

/* ============================================================
   CREATE PRODUCT (supports costPrice)
============================================================ */
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description = "",
      price,
      discountPrice = 0,
      offers = "[]",
      stock,
      category,
      highlights: highlightsJson = "[]",
      specifications: specsJson = "{}",
      imageUrl: providedImageUrl,
    } = req.body;

    /* ------------------------------
       REQUIRED VALIDATION
    ------------------------------ */
    if (!name?.trim() || !price || !stock || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price, stock and category are required",
      });
    }

    if (Number(price) <= 0)
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });

    if (Number(discountPrice) < 0)
      return res.status(400).json({
        success: false,
        message: "Discount price cannot be negative",
      });

    if (Number(discountPrice) >= Number(price))
      return res.status(400).json({
        success: false,
        message: "Discount must be lower than price",
      });

    if (Number(stock) < 0)
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });

    const cat = await Category.findById(category);
    if (!cat)
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });

    /* ------------------------------
       costPrice (NEW)
    ------------------------------ */
    let costPrice = undefined;
    if (req.body.costPrice !== undefined && req.body.costPrice !== "") {
      const cp = Number(req.body.costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid cost price",
        });
      }
      costPrice = cp;
    }
    // If undefined → model default uses price automatically

    /* ------------------------------
       PARSE JSON FIELDS
    ------------------------------ */
    let highlights = [];
    try {
      const h = JSON.parse(highlightsJson);
      if (Array.isArray(h)) highlights = h.filter(Boolean);
    } catch {}

    let specifications = {};
    try {
      const s = JSON.parse(specsJson);
      if (s && typeof s === "object") specifications = s;
    } catch {}

    let offersArray = [];
    try {
      const o = JSON.parse(offers);
      if (Array.isArray(o)) offersArray = o.filter(Boolean);
    } catch {}

    /* ------------------------------
       UNIQUE SLUG
    ------------------------------ */
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const slug = `${baseSlug}-${Date.now()}`;

    /* ------------------------------
       IMAGE HANDLING
    ------------------------------ */
    let images = [];
    let imageUrl = null;

    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        const result = await uploadToCloudinary(f.buffer);
        images.push(result.secure_url);
      }
      imageUrl = images[0];
    } else if (providedImageUrl) {
      imageUrl = providedImageUrl;
      images = [providedImageUrl];
    } else {
      imageUrl = "https://via.placeholder.com/600x600.png?text=No+Image";
      images = [imageUrl];
    }

    /* ------------------------------
       CREATE PRODUCT
    ------------------------------ */
    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      discountPrice: Number(discountPrice),

      // NEW
      costPrice: costPrice !== undefined ? costPrice : undefined,

      offers: offersArray,
      stock: Number(stock),
      category,
      highlights,
      specifications,
      imageUrl,
      images,
    });

    const populated = await Product.findById(product._id).populate(
      "category",
      "name slug"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populated,
    });
  } catch (error) {
    console.error("🔥 ADD PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

/* ============================================================
   UPDATE PRODUCT (supports costPrice)
============================================================ */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const {
      name,
      description,
      price,
      discountPrice,
      offers,
      stock,
      category,
      highlights: highlightsJson,
      specifications: specsJson,
      imageUrl: providedImageUrl,
    } = req.body;

    /* ------------------------------
       VALIDATION
    ------------------------------ */
    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    if (discountPrice !== undefined && Number(discountPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount price invalid",
      });
    }

    if (
      price !== undefined &&
      discountPrice !== undefined &&
      Number(discountPrice) >= Number(price)
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be >= price",
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    /* ------------------------------
       NEW: costPrice update
    ------------------------------ */
    if (req.body.costPrice !== undefined) {
      const cp = Number(req.body.costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid cost price",
        });
      }
      product.costPrice = cp;
    }

    /* ------------------------------
       PARSE JSON
    ------------------------------ */
    if (highlightsJson) {
      try {
        const parsed = JSON.parse(highlightsJson);
        if (Array.isArray(parsed)) product.highlights = parsed;
      } catch {}
    }

    if (specsJson) {
      try {
        const parsed = JSON.parse(specsJson);
        if (parsed && typeof parsed === "object") {
          product.specifications = parsed;
        }
      } catch {}
    }

    if (offers !== undefined) {
      try {
        const parsed = JSON.parse(offers);
        if (Array.isArray(parsed)) product.offers = parsed.filter(Boolean);
      } catch {}
    }

    /* ------------------------------
       BASIC UPDATES
    ------------------------------ */
    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined)
      product.discountPrice = Number(discountPrice);
    if (stock !== undefined) product.stock = Number(stock);

    if (category) {
      const cat = await Category.findById(category);
      if (!cat)
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      product.category = category;
    }

    /* ------------------------------
       IMAGE HANDLING
    ------------------------------ */
    if (req.files && req.files.length > 0) {
      const uploaded = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        uploaded.push(result.secure_url);
      }
      product.images = uploaded;
      product.imageUrl = uploaded[0];
    } else if (providedImageUrl) {
      product.images = [providedImageUrl];
      product.imageUrl = providedImageUrl;
    }

    await product.save();

    const populated = await Product.findById(id).populate(
      "category",
      "name slug"
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product: " + error.message,
    });
  }
};

/* ============================================================
   GET ALL PRODUCTS
============================================================ */
export const getProducts = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };

    if (req.query.category) filter.category = req.query.category;

    if (req.query.q) {
      const regex = { $regex: req.query.q, $options: "i" };
      filter.$or = [{ name: regex }, { description: regex }];
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET SINGLE PRODUCT
============================================================ */
export const getProductById = async (req, res) => {
  try {
    // const product = await Product.findById(req.params.id).populate(
    //   "category",
    //   "name slug"
    // );

    // 🟦 SOFT DELETE FILTER
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).populate("category", "name slug");

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET PRODUCTS BY CATEGORY SLUG
============================================================ */
export const getProductsByCategorySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category)
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });

    const products = await Product.find({
      category: category._id,
      isDeleted: { $ne: true },
    }).populate("category", "name slug");

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET PRODUCT BY SLUG
============================================================ */
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isDeleted: { $ne: true },
    }).populate("category", "name slug");

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   DELETE PRODUCT → NOW SOFT DELETE
============================================================ */
export const deleteProduct = async (req, res) => {
  try {
    // 🟦 SOFT DELETE CHANGE — mark deleted instead of remove
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();

    await product.save();

    return res.json({ success: true, message: "Product soft-deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   RESTORE PRODUCT (NEW)
============================================================ */
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Product is not deleted",
      });
    }

    // 🟩 RESTORE CHANGE
    product.isDeleted = false;
    product.deletedAt = null;

    await product.save();

    return res.json({
      success: true,
      message: "Product restored successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to restore product",
      error: error.message,
    });
  }
};

/* ============================================================
   ADD REVIEW
============================================================ */
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Login required",
      });

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be 1–5",
      });
    }

    const already = product.reviews.find((r) => r.user.toString() === userId);

    if (already) {
      return res.status(400).json({
        success: false,
        message: "Already reviewed",
      });
    }

    product.reviews.push({
      user: userId,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    await product.save();

    const updated = await Product.findById(req.params.id).populate(
      "reviews.user",
      "name"
    );

    res.status(201).json({
      success: true,
      message: "Review added",
      reviews: updated.reviews,
      rating: updated.rating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};
