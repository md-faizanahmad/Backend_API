// controllers/productController.js
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import {
  getIncomingFiles,
  uploadFilesToCloudinary,
  cloudinaryOptimizeUrl,
} from "../utils/imageService.js";

// export const getProductsByCategory = async (req, res) => {
//   try {
//     const categoryId = req.params.id;

//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found" });
//     }

//     let categoryIds = [categoryId];

//     // If main category → include all subcategories
//     if (!category.isSub) {
//       const subcats = await Category.find({ parent: categoryId }).select("_id");
//       categoryIds.push(...subcats.map((c) => c._id.toString()));
//     }

//     const products = await Product.find({
//       category: { $in: categoryIds },
//       isArchived: { $ne: true },
//     })
//       .select("name slug price discountPrice imageUrl stock rating category")
//       .populate("category", "name slug")
//       .sort({ createdAt: -1 });

//     return res.json({ success: true, products });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// update with sub-c
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const baseFilter = { isArchived: { $ne: true } };
    let filter = { ...baseFilter };

    if (category.isSub) {
      // Example: "Fridge" → parent: "Electronic"
      filter.category = category.parent; // parent category id
      filter.subcategory = category._id; // this subcategory
    } else {
      // Main category: show all products under this parent category
      filter.category = category._id;
      // (optional: if you ever decide to store subcategory-only, you'd expand here)
    }

    const products = await Product.find(filter)
      .select(
        "name slug price discountPrice imageUrl stock rating category subcategory"
      )
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, products });
  } catch (err) {
    console.error("GET PRODUCTS BY CATEGORY ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   SEARCH PRODUCTS
   - NO cache (search is query specific)
   - Lightweight projection (no reviews, no heavy specs)
   - Uses regex fallback; if you add a text index you can prefer text search
============================================================ */
export async function searchProducts(req, res) {
  try {
    // search must always be fresh
    res.set("Cache-Control", "no-store");

    const qRaw = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    if (qRaw.length < 2) {
      return res.json({ success: true, products: [] });
    }

    const q = qRaw;
    const isAdmin = req.query.admin === "true";

    const baseFilter = isAdmin ? {} : { isArchived: { $ne: true } };

    const regex = { $regex: q, $options: "i" };

    const filter = {
      ...baseFilter,
      $or: [{ name: regex }, { description: regex }],
    };

    const products = await Product.find(filter)
      .select(
        "name slug price discountPrice imageUrl category rating.average rating.count stock offers"
      )
      .populate("category", "name slug")
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const cleaned = products.map((p) => ({
      ...p,
      imageUrl: cloudinaryOptimizeUrl(p.imageUrl),
      images: (p.images || []).map(cloudinaryOptimizeUrl),
    }));

    return res.json({ success: true, products: cleaned });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: err.message,
    });
  }
}

/* ------------------------------- ADD PRODUCT ------------------------------ */
// export const addProduct = async (req, res) => {
//   try {
//     // -------------------- Extract incoming form fields --------------------
//     // Note: many fields are strings (because FormData) — convert/validate explicitly.
//     const {
//       name,
//       description = "",
//       price,
//       discountPrice = 0,
//       offers = "[]",
//       stock,
//       category,

//       highlights: highlightsJson = "[]",
//       specifications: specsJson = "{}",
//       imageUrl: providedImageUrl,
//     } = req.body;

//     // -------------------- Basic required validation -----------------------
//     if (
//       !name?.trim() ||
//       price === undefined ||
//       stock === undefined ||
//       !category
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, price, stock and category are required",
//       });
//     }

//     // Numeric validation (defensive)
//     if (Number(price) <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Price must be > 0" });
//     }
//     if (Number(discountPrice) < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount price cannot be negative" });
//     }
//     if (Number(discountPrice) >= Number(price)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount must be lower than price" });
//     }
//     if (Number(stock) < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Stock cannot be negative" });
//     }

//     // -------------------- Category validation -----------------------------
//     const cat = await Category.findById(category).lean();
//     if (!cat || cat.isDeleted) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid or deleted category" });
//     }

//     // -------------------- Optional numeric fields -------------------------
//     let costPrice = undefined;
//     if (req.body.costPrice !== undefined && req.body.costPrice !== "") {
//       const cp = Number(req.body.costPrice);
//       if (isNaN(cp) || cp < 0) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid cost price" });
//       }
//       costPrice = cp;
//     }

//     // -------------------- Parse JSON-ish fields safely --------------------
//     // These fields are submitted as JSON strings from the client.
//     let highlights = [];
//     try {
//       const h = JSON.parse(highlightsJson);
//       if (Array.isArray(h)) highlights = h.filter(Boolean);
//     } catch {
//       // ignore parse error -> fallback to empty array
//     }

//     let specifications = {};
//     try {
//       const s = JSON.parse(specsJson);
//       if (s && typeof s === "object") specifications = s;
//     } catch {
//       // ignore parse error
//     }

//     let offersArray = [];
//     try {
//       const o = JSON.parse(offers);
//       if (Array.isArray(o)) offersArray = o.filter(Boolean);
//     } catch {
//       // ignore
//     }

//     // -------------------- Slug (unique-ish) -------------------------------
//     const baseSlug = name
//       .trim()
//       .toLowerCase()
//       .replace(/\s+/g, "-")
//       .replace(/[^\w-]/g, "");
//     const slug = `${baseSlug}-${Date.now()}`;

//     // -------------------- IMAGE HANDLING (centralized) --------------------
//     // Use imageService helpers so this code stays tiny and consistent.
//     // getIncomingFiles normalizes multer req.files shape -> always an array.
//     const files = getIncomingFiles(req);
//     // Helpful debug lines (keeps Vercel logs informative). Remove or reduce in prod.
//     console.log("ADD PRODUCT - incoming files count:", files.length);
//     console.log(
//       "ADD PRODUCT - req.files keys:",
//       req.files ? Object.keys(req.files) : "no req.files"
//     );
//     console.log("ADD PRODUCT - req.body keys:", Object.keys(req.body || {}));

//     let images = [];
//     let imageUrl = null;

//     if (files.length > 0) {
//       // Upload all images to Cloudinary using the shared helper
//       // Expected return shape: [{ url, publicId }, ...]
//       const uploaded = await uploadFilesToCloudinary(files, {
//         folder: "MyStore/products",
//       });

//       // Normalize into DB shape { url, publicId }
//       images = uploaded.map((u) => ({
//         url: u.url,
//         publicId: u.publicId || null,
//       }));
//       imageUrl = images.length > 0 ? images[0].url : null;
//     } else if (providedImageUrl) {
//       // Client provided a direct image URL (keep it, and try not to assume publicId)
//       images = [{ url: providedImageUrl, publicId: null }];
//       imageUrl = providedImageUrl;
//     } else {
//       // No image provided — store placeholder (keeps UI consistent)
//       imageUrl = "https://via.placeholder.com/600x600.png?text=No+Image";
//       images = [{ url: imageUrl, publicId: null }];
//     }

//     // -------------------- Create product -------------------------------
//     const product = await Product.create({
//       name: name.trim(),
//       slug,
//       description: description.trim(),
//       price: Number(price),
//       discountPrice: Number(discountPrice),
//       costPrice: costPrice !== undefined ? costPrice : undefined,
//       offers: offersArray,
//       stock: Number(stock),
//       category,
//       highlights,
//       specifications,
//       imageUrl,
//       images, // array of { url, publicId }
//     });

//     // -------------------- Populate response + optimize URLs --------------
//     const populated = await Product.findById(product._id)
//       .populate("category", "name slug")
//       .lean();
//     if (populated) {
//       populated.imageUrl = cloudinaryOptimizeUrl(populated.imageUrl);
//       populated.images = (populated.images || []).map((img) => ({
//         url: cloudinaryOptimizeUrl(img.url),
//         publicId: img.publicId || null,
//       }));
//     }

//     // -------------------- Respond --------------------------------------
//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product: populated,
//     });
//   } catch (error) {
//     console.error("ADD PRODUCT ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error: " + (error?.message ?? String(error)),
//     });
//   }
// };

/// update with sub-c
export const addProduct = async (req, res) => {
  try {
    // -------------------- Extract incoming form fields --------------------
    const {
      name,
      description = "",
      price,
      discountPrice = 0,
      offers = "[]",
      stock,
      category, // parent category id
      subcategory, // <-- NEW: subcategory id
      highlights: highlightsJson = "[]",
      specifications: specsJson = "{}",
      imageUrl: providedImageUrl,
    } = req.body;

    // -------------------- Basic required validation -----------------------
    if (
      !name?.trim() ||
      price === undefined ||
      stock === undefined ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price, stock and category are required",
      });
    }

    if (Number(price) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be > 0" });
    }
    if (Number(discountPrice) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Discount price cannot be negative" });
    }
    if (Number(discountPrice) >= Number(price)) {
      return res.status(400).json({
        success: false,
        message: "Discount must be lower than price",
      });
    }
    if (Number(stock) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Stock cannot be negative" });
    }

    // -------------------- Category validation -----------------------------
    const cat = await Category.findById(category).lean();
    if (!cat || cat.isDeleted) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or deleted category" });
    }

    // -------------------- Subcategory validation --------------------------
    let subcatDoc = null;
    if (subcategory) {
      subcatDoc = await Category.findById(subcategory).lean();
      if (
        !subcatDoc ||
        subcatDoc.isDeleted ||
        !subcatDoc.isSub ||
        String(subcatDoc.parent) !== String(category)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory for this category",
        });
      }
    }

    // -------------------- Optional numeric fields -------------------------
    let costPrice = undefined;
    if (req.body.costPrice !== undefined && req.body.costPrice !== "") {
      const cp = Number(req.body.costPrice);
      if (isNaN(cp) || cp < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid cost price" });
      }
      costPrice = cp;
    }

    // -------------------- Parse JSON-ish fields safely --------------------
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

    // -------------------- Slug (unique-ish) -------------------------------
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    const slug = `${baseSlug}-${Date.now()}`;

    // -------------------- IMAGE HANDLING ----------------------------------
    const files = getIncomingFiles(req);
    console.log("ADD PRODUCT - incoming files count:", files.length);
    console.log(
      "ADD PRODUCT - req.files keys:",
      req.files ? Object.keys(req.files) : "no req.files"
    );
    console.log("ADD PRODUCT - req.body keys:", Object.keys(req.body || {}));

    let images = [];
    let imageUrl = null;

    if (files.length > 0) {
      const uploaded = await uploadFilesToCloudinary(files, {
        folder: "MyStore/products",
      });

      images = uploaded.map((u) => ({
        url: u.url,
        publicId: u.publicId || null,
      }));
      imageUrl = images.length > 0 ? images[0].url : null;
    } else if (providedImageUrl) {
      images = [{ url: providedImageUrl, publicId: null }];
      imageUrl = providedImageUrl;
    } else {
      imageUrl = "https://via.placeholder.com/600x600.png?text=No+Image";
      images = [{ url: imageUrl, publicId: null }];
    }

    // -------------------- Create product ----------------------------------
    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      discountPrice: Number(discountPrice),
      costPrice: costPrice !== undefined ? costPrice : undefined,
      offers: offersArray,
      stock: Number(stock),
      category,
      subcategory: subcategory || null, // <-- SAVE IT
      highlights,
      specifications,
      imageUrl,
      images,
    });

    // -------------------- Populate response -------------------------------
    const populated = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    if (populated) {
      populated.imageUrl = cloudinaryOptimizeUrl(populated.imageUrl);
      populated.images = (populated.images || []).map((img) => ({
        url: cloudinaryOptimizeUrl(img.url),
        publicId: img.publicId || null,
      }));
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populated,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error?.message ?? String(error)),
    });
  }
};

/* ------------------------------- UPDATE PRODUCT ------------------------------ */
// export const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Fetch existing product first
//     const product = await Product.findById(id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     // Extract fields (FormData -> strings)
//     const {
//       name,
//       description,
//       price,
//       discountPrice,
//       offers,
//       stock,
//       category,
//       highlights: highlightsJson,
//       specifications: specsJson,
//       imageUrl: providedImageUrl,
//     } = req.body;

//     // -------------------- Basic validation ------------------------------
//     if (price !== undefined && Number(price) <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Price must be greater than 0" });
//     }
//     if (discountPrice !== undefined && Number(discountPrice) < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount price invalid" });
//     }
//     if (
//       price !== undefined &&
//       discountPrice !== undefined &&
//       Number(discountPrice) >= Number(price)
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount cannot be >= price" });
//     }
//     if (stock !== undefined && Number(stock) < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Stock cannot be negative" });
//     }

//     // costPrice update
//     if (req.body.costPrice !== undefined) {
//       const cp = Number(req.body.costPrice);
//       if (isNaN(cp) || cp < 0) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid cost price" });
//       }
//       product.costPrice = cp;
//     }

//     // -------------------- Parse JSON fields -----------------------------
//     if (highlightsJson) {
//       try {
//         const parsed = JSON.parse(highlightsJson);
//         if (Array.isArray(parsed)) product.highlights = parsed;
//       } catch {
//         // ignore parse errors - keep old highlights
//       }
//     }

//     if (specsJson) {
//       try {
//         const parsed = JSON.parse(specsJson);
//         if (parsed && typeof parsed === "object")
//           product.specifications = parsed;
//       } catch {
//         // ignore
//       }
//     }

//     if (offers !== undefined) {
//       try {
//         const parsed = JSON.parse(offers);
//         if (Array.isArray(parsed)) product.offers = parsed.filter(Boolean);
//       } catch {
//         // ignore
//       }
//     }

//     // -------------------- Apply scalar updates --------------------------
//     if (name) product.name = name.trim();
//     if (description !== undefined) product.description = description.trim();
//     if (price !== undefined) product.price = Number(price);
//     if (discountPrice !== undefined)
//       product.discountPrice = Number(discountPrice);
//     if (stock !== undefined) product.stock = Number(stock);

//     // -------------------- Category validation --------------------------
//     if (category) {
//       const cat = await Category.findById(category).lean();
//       if (!cat || cat.isDeleted) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid or deleted category" });
//       }
//       product.category = category;
//     }

//     // -------------------- IMAGE HANDLING --------------------------------
//     // Normalize files and upload if any present. If not present and providedImageUrl exists,
//     // replace images with that URL. If neither, keep existing images untouched.
//     const files = getIncomingFiles(req);
//     console.log("UPDATE PRODUCT - incoming files count:", files.length);
//     console.log(
//       "UPDATE PRODUCT - req.files keys:",
//       req.files ? Object.keys(req.files) : "no req.files"
//     );
//     console.log("UPDATE PRODUCT - req.body keys:", Object.keys(req.body || {}));

//     if (files.length > 0) {
//       // Upload new files and replace the product.images with uploaded results
//       const uploaded = await uploadFilesToCloudinary(files, {
//         folder: "MyStore/products",
//       });
//       const images = uploaded.map((u) => ({
//         url: u.url,
//         publicId: u.publicId || null,
//       }));

//       if (images.length > 0) {
//         product.images = images;
//         product.imageUrl = images[0].url;
//       }
//     } else if (providedImageUrl) {
//       // Client provided new external URL to use instead
//       product.images = [{ url: providedImageUrl, publicId: null }];
//       product.imageUrl = providedImageUrl;
//     }
//     // else: keep existing product.images as-is

//     // -------------------- Save & respond -------------------------------
//     await product.save();

//     const populated = await Product.findById(id)
//       .populate("category", "name slug")
//       .lean();
//     if (populated) {
//       populated.imageUrl = cloudinaryOptimizeUrl(populated.imageUrl);
//       populated.images = (populated.images || []).map((img) => ({
//         url: cloudinaryOptimizeUrl(img.url),
//         publicId: img.publicId || null,
//       }));
//     }

//     return res.json({
//       success: true,
//       message: "Product updated successfully",
//       product: populated,
//     });
//   } catch (error) {
//     console.error("UPDATE PRODUCT ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update product: " + (error?.message ?? String(error)),
//     });
//   }
// };

///// Update with sub-c

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------------------
    // 1. Load product
    // ------------------------------------------------------------------
    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // Read scalar fields from body
    const {
      name,
      description,
      price,
      discountPrice,
      offers,
      stock,
      category,
      subcategory,
      highlights: highlightsJson,
      specifications: specsJson,
      imageUrl: providedImageUrl,
    } = req.body;

    // ------------------------------------------------------------------
    // 2. Validate prices, stock
    // ------------------------------------------------------------------
    if (price !== undefined && Number(price) <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Price must be greater than 0" });

    if (discountPrice !== undefined && Number(discountPrice) < 0)
      return res
        .status(400)
        .json({ success: false, message: "Discount price invalid" });

    if (
      price !== undefined &&
      discountPrice !== undefined &&
      Number(discountPrice) >= Number(price)
    )
      return res
        .status(400)
        .json({ success: false, message: "Discount cannot be >= price" });

    if (stock !== undefined && Number(stock) < 0)
      return res
        .status(400)
        .json({ success: false, message: "Stock cannot be negative" });

    // Cost price
    if (req.body.costPrice !== undefined) {
      const cp = Number(req.body.costPrice);
      if (isNaN(cp) || cp < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid cost price" });
      }
      product.costPrice = cp;
    }

    // ------------------------------------------------------------------
    // 3. Parse JSON fields
    // ------------------------------------------------------------------
    if (highlightsJson) {
      try {
        const parsed = JSON.parse(highlightsJson);
        if (Array.isArray(parsed)) product.highlights = parsed;
      } catch {}
    }

    if (specsJson) {
      try {
        const parsed = JSON.parse(specsJson);
        if (parsed && typeof parsed === "object")
          product.specifications = parsed;
      } catch {}
    }

    if (offers !== undefined) {
      try {
        const parsed = JSON.parse(offers);
        if (Array.isArray(parsed)) product.offers = parsed.filter(Boolean);
      } catch {}
    }

    // ------------------------------------------------------------------
    // 4. Apply scalar updates (name, description, price, stock)
    // ------------------------------------------------------------------
    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined)
      product.discountPrice = Number(discountPrice);
    if (stock !== undefined) product.stock = Number(stock);

    // ------------------------------------------------------------------
    // 5. Category + Subcategory validation
    // ------------------------------------------------------------------
    if (category) {
      const cat = await Category.findById(category).lean();
      if (!cat || cat.isDeleted)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or deleted category" });

      product.category = category;

      // If category changed but subcategory not provided → clear subcategory
      if (!subcategory) product.subcategory = null;
    }

    if (subcategory) {
      const parentId = category || product.category;

      const subcatDoc = await Category.findById(subcategory).lean();
      if (
        !subcatDoc ||
        subcatDoc.isDeleted ||
        !subcatDoc.isSub ||
        String(subcatDoc.parent) !== String(parentId)
      )
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory for this category",
        });

      product.subcategory = subcategory;
    }

    // ------------------------------------------------------------------
    // 6. IMAGE HANDLING (THE IMPORTANT FIX)
    // ------------------------------------------------------------------

    // FRONTEND SENDS:
    // - existingImages: URLs user wants to KEEP
    // - images: new files to upload

    // 6.1 Get existingImages from body
    let existingImageUrls = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImageUrls = req.body.existingImages;
      } else {
        // If only 1 item, FormData sends as string
        existingImageUrls = [req.body.existingImages];
      }
    }

    // 6.2 Current images in DB
    const currentImages = Array.isArray(product.images) ? product.images : [];

    // 6.3 Determine which old images to KEEP
    let keptImages;
    if (existingImageUrls.length > 0) {
      // Keep only those URLs that frontend explicitly kept
      keptImages = currentImages.filter((img) =>
        existingImageUrls.includes(img.url)
      );
    } else {
      // If frontend didn’t send existingImages → keep them all
      keptImages = currentImages;
    }

    // 6.4 Upload new files
    const files = getIncomingFiles(req);
    let newImages = [];

    if (files.length > 0) {
      const uploaded = await uploadFilesToCloudinary(files, {
        folder: "MyStore/products",
      });

      newImages = uploaded.map((u) => ({
        url: u.url,
        publicId: u.publicId || null,
      }));
    }

    // 6.5 Final merged image array = kept old + new
    const finalImages = [...keptImages, ...newImages];

    // 6.6 Apply final images
    if (finalImages.length > 0) {
      product.images = finalImages;
      product.imageUrl = finalImages[0].url; // first image is primary
    } else if (providedImageUrl) {
      // No images but fallback provided
      product.images = [{ url: providedImageUrl, publicId: null }];
      product.imageUrl = providedImageUrl;
    } else {
      // No images at all → use placeholder (or allow empty)
      product.images = [];
      product.imageUrl =
        "https://via.placeholder.com/600x600.png?text=No+Image";
    }

    // ------------------------------------------------------------------
    // 7. Save product
    // ------------------------------------------------------------------
    await product.save();

    // ------------------------------------------------------------------
    // 8. Return populated result (optional optimization wrapper)
    // ------------------------------------------------------------------
    const populated = await Product.findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    if (populated) {
      populated.imageUrl = cloudinaryOptimizeUrl(populated.imageUrl);
      populated.images = (populated.images || []).map((img) => ({
        url: cloudinaryOptimizeUrl(img.url),
        publicId: img.publicId || null,
      }));
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
      product: populated,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product: " + (error?.message ?? String(error)),
    });
  }
};

/* ============================================================
   GET ALL PRODUCTS (LIST)
   - Pagination, sorting, price filter, text query, category filter
   - Uses .select() to return only lightweight fields; .lean() for speed
   - Cache-Control: 30 seconds
============================================================ */

// export const getProducts = async (req, res) => {
//   try {
//     const isAdmin = req.query.admin === "true";

//     if (isAdmin) {
//       // Admin should always see the latest data
//       res.set("Cache-Control", "no-store");
//     } else {
//       // Customers can see slightly cached data
//       res.set("Cache-Control", "public, max-age=30");
//     }

//     // Pagination
//     const page = Math.max(1, Number(req.query.page) || 1);
//     const limit = Math.min(Number(req.query.limit) || 20, 100);
//     const skip = (page - 1) * limit;

//     // Base filter — users cannot see archived products
//     const filter = isAdmin ? {} : { isArchived: { $ne: true } };

//     // Category filter
//     if (req.query.category) filter.category = req.query.category;

//     // Price filter
//     const min = req.query.min ? Number(req.query.min) : null;
//     const max = req.query.max ? Number(req.query.max) : null;

//     if (min !== null || max !== null) {
//       filter.price = {};
//       if (!isNaN(min)) filter.price.$gte = min;
//       if (!isNaN(max)) filter.price.$lte = max;
//     }

//     // Stock filter
//     if (req.query.stock === "out") filter.stock = { $lte: 0 };
//     if (req.query.stock === "in") filter.stock = { $gt: 0 };

//     // Search
//     if (req.query.q) {
//       const q = String(req.query.q).trim();
//       const regex = { $regex: q, $options: "i" };
//       filter.$or = [{ name: regex }, { description: regex }];
//     }

//     // Sorting
//     let sort = { createdAt: -1 };
//     const sortMap = {
//       price_asc: { price: 1 },
//       price_desc: { price: -1 },
//       newest: { createdAt: -1 },
//       popular: { "rating.count": -1 },
//       rating_desc: { "rating.average": -1 },
//     };
//     if (req.query.sort && sortMap[req.query.sort]) {
//       sort = sortMap[req.query.sort];
//     }

//     const projection = isAdmin
//       ? null
//       : "name slug price discountPrice imageUrl images stock category rating createdAt";

//     const [total, products] = await Promise.all([
//       Product.countDocuments(filter),
//       Product.find(filter)
//         .select(projection)
//         .populate("category", "name slug")
//         .sort(sort)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//     ]);

//     return res.json({
//       success: true,
//       meta: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//       products,
//     });
//   } catch (error) {
//     console.error("GET PRODUCTS ERROR:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// Update with sub-c
export const getProducts = async (req, res) => {
  try {
    const isAdmin = req.query.admin === "true";

    if (isAdmin) {
      res.set("Cache-Control", "no-store");
    } else {
      res.set("Cache-Control", "public, max-age=30");
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = isAdmin ? {} : { isArchived: { $ne: true } };

    // Category filter (parent)
    if (req.query.category) filter.category = req.query.category;

    // Subcategory filter
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    // Price filter
    const min = req.query.min ? Number(req.query.min) : null;
    const max = req.query.max ? Number(req.query.max) : null;

    if (min !== null || max !== null) {
      filter.price = {};
      if (!isNaN(min)) filter.price.$gte = min;
      if (!isNaN(max)) filter.price.$lte = max;
    }

    // Stock filter
    if (req.query.stock === "out") filter.stock = { $lte: 0 };
    if (req.query.stock === "in") filter.stock = { $gt: 0 };

    // Search
    if (req.query.q) {
      const q = String(req.query.q).trim();
      const regex = { $regex: q, $options: "i" };
      filter.$or = [{ name: regex }, { description: regex }];
    }

    // Sorting
    let sort = { createdAt: -1 };
    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      popular: { "rating.count": -1 },
      rating_desc: { "rating.average": -1 },
    };
    if (req.query.sort && sortMap[req.query.sort]) {
      sort = sortMap[req.query.sort];
    }

    const projection = isAdmin
      ? null
      : "name slug price discountPrice imageUrl images stock category subcategory rating createdAt";

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(projection)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET SINGLE PRODUCT (detail)
   - returns full product including reviews & specs
   - short cache (20s) applied
============================================================ */
// export const getProductById = async (req, res) => {
//   try {
//     res.set("Cache-Control", "public, no-store");

//     const product = await Product.findOne({
//       _id: req.params.id,
//       isArchived: { $ne: true },
//     })
//       .populate("category", "name slug")

//       .lean();

//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     product.imageUrl = cloudinaryOptimizeUrl(product.imageUrl);
//     product.images = (product.images || []).map(cloudinaryOptimizeUrl);

//     return res.json({ success: true, product });
//   } catch (error) {
//     console.error("GET PRODUCT BY ID ERROR:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// update with sub-c
export const getProductById = async (req, res) => {
  try {
    const isAdmin = req.query.admin === "true";

    // Admin should see archived as well, non-admin should not
    const filter = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, isArchived: { $ne: true } };

    res.set("Cache-Control", isAdmin ? "no-store" : "public, max-age=30");

    const product = await Product.findOne(filter)
      .populate("category", "name slug")
      .populate("subcategory", "name slug") // 🔥 THIS WAS MISSING
      .lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.imageUrl = cloudinaryOptimizeUrl(product.imageUrl);
    product.images = (product.images || []).map(cloudinaryOptimizeUrl);

    // update for user cant se this
    if (!isAdmin) {
      delete product.isArchived;
      delete product.archivedAt;
      delete product.isDeleted;
      delete product.deletedAt;
      delete product.costPrice;
      delete product.__v;
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET PRODUCTS BY CATEGORY SLUG
   - uses product list cache rule (30s)
============================================================ */
// export const getProductsByCategorySlug = async (req, res) => {
//   try {
//     res.set("Cache-Control", "public, max-age=30");

//     const category = await Category.findOne({ slug: req.params.slug }).lean();
//     if (!category)
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found" });

//     const isAdmin = req.query.admin === "true";
//     const filter = isAdmin
//       ? { category: category._id }
//       : { category: category._id, isArchived: { $ne: true } };

//     const products = await Product.find(filter)
//       .select(
//         "name slug price discountPrice imageUrl images stock rating.average rating.count"
//       )
//       .populate("category", "name slug")
//       .sort({ createdAt: -1 })
//       .lean();

//     const cleaned = products.map((p) => ({
//       ...p,
//       imageUrl: cloudinaryOptimizeUrl(p.imageUrl),
//       images: (p.images || []).map(cloudinaryOptimizeUrl),
//     }));

//     return res.json({ success: true, products: cleaned });
//   } catch (error) {
//     console.error("GET PRODUCTS BY CATEGORY SLUG ERROR:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

/////////// update with sub-c
export const getProductsByCategorySlug = async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=30");

    const { slug } = req.params;

    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const isAdmin = req.query.admin === "true";

    // base filter - hide archived for public
    const baseFilter = isAdmin ? {} : { isArchived: { $ne: true } };
    let filter = { ...baseFilter };

    if (category.isSub) {
      // This is a SUBCATEGORY, e.g. "TV"
      // Products should have:
      //   category: parent main category id (Electronics)
      //   subcategory: this subcategory id (TV)
      filter.category = category.parent; // parent category _id
      filter.subcategory = category._id; // this subcategory _id
    } else {
      // This is a MAIN CATEGORY, e.g. "Electronics"
      filter.category = category._id;
      // If you ever store only subcategory and not category, you'd expand filter here.
    }

    const products = await Product.find(filter)
      .select(
        "name slug price discountPrice imageUrl images stock rating.average rating.count category subcategory"
      )
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    const cleaned = products.map((p) => ({
      ...p,
      imageUrl: cloudinaryOptimizeUrl(p.imageUrl),
      images: (p.images || []).map(cloudinaryOptimizeUrl),
    }));

    return res.json({ success: true, products: cleaned });
  } catch (error) {
    console.error("GET PRODUCTS BY CATEGORY SLUG ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   GET PRODUCT BY SLUG
============================================================ */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      isArchived: { $ne: true },
      isDeleted: { $ne: true },
    })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Cloudinary optimize
    product.imageUrl = product.imageUrl
      ? cloudinaryOptimizeUrl(product.imageUrl)
      : null;

    product.images = (product.images || []).map((img) => {
      // if you store as array of strings:
      if (typeof img === "string") return cloudinaryOptimizeUrl(img);

      // if you store as objects { url, publicId }
      if (img?.url) {
        return { ...img, url: cloudinaryOptimizeUrl(img.url) };
      }

      return img;
    });

    return res.json({ success: true, product });
  } catch (error) {
    console.error("GET PRODUCT BY SLUG ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/* ============================================================
   SOFT ARCHIVE PRODUCT (admin)
   - mark isArchived true (hide from shop), keep in DB for analytics/orders
============================================================ */
export const softDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    product.isArchived = true;
    product.archivedAt = new Date();
    product.stock = 0;

    await product.save();

    return res.json({
      success: true,
      message: "Product archived (soft-deleted)",
    });
  } catch (error) {
    console.error("SOFT DELETE PRODUCT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   RESTORE PRODUCT
============================================================ */
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // product.isArchived = false;
    // product.archivedAt = null;
    // update for refresh bug
    product.isArchived = false;
    product.archivedAt = null;
    product.isDeleted = false;
    product.deletedAt = null;

    await product.save();

    return res.json({ success: true, message: "Product restored" });
  } catch (error) {
    console.error("RESTORE PRODUCT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   HARD DELETE PRODUCT (permanent) — block if product is in orders
   Update with product image also delete
============================================================ */

export const hardDeleteProduct = async (req, res) => {
  try {
    // 1) Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2) Block permanent delete if orders exist
    const hasOrders = await Order.findOne({ "items.product": product._id });
    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: "Cannot permanently delete: product has orders.",
      });
    }

    // 3) Collect Cloudinary publicIds from product.images[]
    let publicIds = Array.isArray(product.images)
      ? product.images.map((img) => img.publicId).filter(Boolean)
      : [];

    // 4) Fallback: derive publicId from imageUrl (only if needed)
    if (publicIds.length === 0 && product.imageUrl) {
      const publicId = extractPublicIdFromUrl(product.imageUrl);
      if (publicId) publicIds.push(publicId);
    }

    // 5) Delete images from Cloudinary
    let cloudinaryResult = null;
    let cloudinaryError = null;

    if (publicIds.length > 0) {
      try {
        cloudinaryResult = await cloudinary.api.delete_resources(publicIds);
        console.log("Cloudinary deletion:", cloudinaryResult);
      } catch (err) {
        cloudinaryError = err;
        console.error("Cloudinary delete error:", err);
      }
    }

    // 6) Permanently remove product from DB
    await Product.findByIdAndDelete(req.params.id);

    // 7) Craft response
    if (cloudinaryError) {
      return res.json({
        success: true,
        message:
          "Product deleted from DB, but Cloudinary deletion failed. Check logs.",
        cloudinaryError: cloudinaryError.message,
      });
    }

    return res.json({
      success: true,
      message:
        "Product permanently deleted (Cloudinary images removed if found).",
      cloudinaryResult,
    });
  } catch (error) {
    console.error("HARD DELETE PRODUCT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   ADD REVIEW
   - unchanged logic (keeps verifying user & prevents duplicate review)
   - review changes will update product.save() watchers (pre save rating calc)
============================================================ */
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Login required" });

    if (rating < 1 || rating > 5)
      return res
        .status(400)
        .json({ success: false, message: "Rating must be 1–5" });

    const already = product.reviews.find((r) => r.user.toString() === userId);
    if (already)
      return res
        .status(400)
        .json({ success: false, message: "Already reviewed" });

    product.reviews.push({
      user: userId,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    await product.save();

    const updated = await Product.findById(req.params.id)
      .populate("reviews.user", "name")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Review added",
      reviews: updated.reviews,
      rating: updated.rating,
    });
  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add review" });
  }
};
