// import Product from "../models/Product.js";
// import Category from "../models/Category.js";
// import cloudinary from "../config/cloudinary.js";

// // helper: upload buffer (multer memory) to cloudinary
// async function uploadBufferToCloudinary(buffer, folder) {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.v2.uploader.upload_stream(
//       { folder },
//       (err, result) => {
//         if (err) return reject(err);
//         resolve(result);
//       }
//     );
//     stream.end(buffer);
//   });
// }

// // Create product
// export async function addProduct(req, res) {
//   try {
//     const {
//       name,
//       description = "",
//       price,
//       stock,
//       category,
//       imageUrl,
//     } = req.body;

//     if (!name || price == null || stock == null || !category) {
//       return res.status(400).json({
//         success: false,
//         message: "name, price, stock, category required",
//       });
//     }

//     const cat = await Category.findById(category);
//     if (!cat)
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid category" });

//     let finalImageUrl = imageUrl;

//     // if no imageUrl but file exists (multipart), upload via Cloudinary
//     if (!finalImageUrl && req.file?.buffer) {
//       if (
//         !process.env.CLOUDINARY_CLOUD_NAME ||
//         !process.env.CLOUDINARY_API_KEY ||
//         !process.env.CLOUDINARY_API_SECRET
//       ) {
//         return res
//           .status(500)
//           .json({ success: false, message: "Cloudinary env missing" });
//       }
//       const folder = process.env.CLOUDINARY_FOLDER || "MyStore";
//       const uploaded = await uploadBufferToCloudinary(req.file.buffer, folder);
//       finalImageUrl = uploaded.secure_url;
//     }

//     if (!finalImageUrl) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Image required" });
//     }

//     const product = await Product.create({
//       name,
//       description,
//       price: Number(price),
//       stock: Number(stock),
//       category,
//       imageUrl: finalImageUrl,
//     });

//     return res
//       .status(201)
//       .json({ success: true, message: "Product added", product });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// }

// // Get products
// // export async function getProducts(_req, res) {
// //   try {
// //     const products = await Product.find()
// //       .populate("category", "name")
// //       .sort({ createdAt: -1 });
// //     return res.json({ success: true, products });
// //   } catch (err) {
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch products",
// //       error: err.message,
// //     });
// //   }
// // }

// export async function getProducts(req, res) {
//   try {
//     const filter = {};

//     if (req.query.category) {
//       filter.category = req.query.category;
//     }
//     // NEW: Search filter (partial match on name/description/category.name)
//     if (req.query.q) {
//       const searchTerm = req.query.q;
//       filter.$or = [
//         { name: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//         { "category.name": { $regex: searchTerm, $options: "i" } },
//       ];
//     }
//     const products = await Product.find(filter)
//       .populate("category", "name")
//       .sort({ createdAt: -1 });

//     return res.json({ success: true, products });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch products",
//       error: err.message,
//     });
//   }
// }

// // Product Search
// // productController.js

// export async function searchProducts(req, res) {
//   try {
//     const { q, limit = 50 } = req.query; // Get search query (e.g., q=Mobiles)

//     if (!q || typeof q !== "string" || q.trim().length < 2) {
//       return res.json({ success: true, products: [] }); // No query? Return empty
//     }

//     const searchTerm = q.trim(); // Clean query

//     // MongoDB $regex for case-insensitive partial match on name, description, or category.name
//     const products = await Product.find({
//       $or: [
//         { name: { $regex: searchTerm, $options: "i" } }, // 'i' = case-insensitive
//         { description: { $regex: searchTerm, $options: "i" } },
//         { "category.name": { $regex: searchTerm, $options: "i" } }, // Search in category too
//       ],
//       stock: { $gt: 0 }, // Optional: Only in-stock products
//     })
//       .select("name price imageUrl category description") // Only send needed fields
//       .populate("category", "name") // Populate category name
//       .limit(parseInt(limit)) // Limit results
//       .sort({ createdAt: -1 }) // Newest first
//       .lean(); // Faster for read-only

//     return res.json({ success: true, products });
//   } catch (err) {
//     console.error("Search error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Search failed",
//       error: err.message,
//     });
//   }
// }

// // ... rest of your existing exports (getProducts, etc.) ...

// export async function getProductById(req, res) {
//   try {
//     const product = await Product.findById(req.params.id).populate(
//       "category",
//       "name"
//     );

//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     res.json({ success: true, product });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// }

// // Update product
// export async function updateProduct(req, res) {
//   try {
//     const { id } = req.params;
//     const existing = await Product.findById(id);
//     if (!existing)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     const update = {};
//     const { name, description, price, stock, category, imageUrl } = req.body;

//     if (name != null) update.name = name;
//     if (description != null) update.description = description;
//     if (price != null) {
//       if (Number.isNaN(Number(price)))
//         return res
//           .status(400)
//           .json({ success: false, message: "price must be number" });
//       update.price = Number(price);
//     }
//     if (stock != null) {
//       if (Number.isNaN(Number(stock)))
//         return res
//           .status(400)
//           .json({ success: false, message: "stock must be number" });
//       update.stock = Number(stock);
//     }
//     if (category != null) {
//       const cat = await Category.findById(category);
//       if (!cat)
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid category" });
//       update.category = category;
//     }

//     let finalImageUrl = imageUrl ?? existing.imageUrl;
//     if (!imageUrl && req.file?.buffer) {
//       const folder = process.env.CLOUDINARY_FOLDER || "MyStore";
//       const uploaded = await uploadBufferToCloudinary(req.file.buffer, folder);
//       finalImageUrl = uploaded.secure_url;
//     }
//     update.imageUrl = finalImageUrl;

//     const updated = await Product.findByIdAndUpdate(id, update, {
//       new: true,
//     }).populate("category", "name");
//     return res.json({
//       success: true,
//       message: "Product updated",
//       product: updated,
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Update failed", error: err.message });
//   }
// }

// // Delete product
// export async function deleteProduct(req, res) {
//   try {
//     const { id } = req.params;
//     const deleted = await Product.findByIdAndDelete(id);
//     if (!deleted)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     return res.json({ success: true, message: "Product deleted" });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Delete failed", error: err.message });
//   }
// }
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////// Update with rviews and alll and this is working------
// controllers/productController.js
// import Product from "../models/Product.js";
// import Category from "../models/Category.js";
// import cloudinary from "../config/cloudinary.js";

// // Inside productController.js or a helper file
// async function uploadToCloudinary(buffer) {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: "MyStore/products", resource_type: "image" },
//       (error, result) => {
//         if (error) {
//           console.error("Cloudinary upload error:", error);
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//     stream.end(buffer);
//   });
// }

// /// Search
// export async function searchProducts(req, res) {
//   try {
//     const { q, limit = 50 } = req.query; // Get search query (e.g., q=Mobiles)

//     if (!q || typeof q !== "string" || q.trim().length < 2) {
//       return res.json({ success: true, products: [] }); // No query? Return empty
//     }

//     const searchTerm = q.trim(); // Clean query

//     // MongoDB $regex for case-insensitive partial match on name, description, or category.name
//     const products = await Product.find({
//       $or: [
//         { name: { $regex: searchTerm, $options: "i" } }, // 'i' = case-insensitive
//         { description: { $regex: searchTerm, $options: "i" } },
//         { "category.name": { $regex: searchTerm, $options: "i" } }, // Search in category too
//       ],
//       stock: { $gt: 0 }, // Optional: Only in-stock products
//     })
//       .select("name price imageUrl category description") // Only send needed fields
//       .populate("category", "name") // Populate category name
//       .limit(parseInt(limit)) // Limit results
//       .sort({ createdAt: -1 }) // Newest first
//       .lean(); // Faster for read-only

//     return res.json({ success: true, products });
//   } catch (err) {
//     console.error("Search error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Search failed",
//       error: err.message,
//     });
//   }
// }

// // CREATE PRODUCT
// export const addProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       description = "",
//       price,
//       stock,
//       category,
//       highlights: highlightsJson = "[]",
//       specifications: specsJson = "{}",
//       imageUrl: providedImageUrl,
//     } = req.body;

//     // Parse safely
//     let highlights = [];
//     let specifications = {};

//     try {
//       const h = JSON.parse(highlightsJson);
//       if (Array.isArray(h)) highlights = h.filter(Boolean);
//     } catch {}

//     try {
//       const s = JSON.parse(specsJson);
//       if (s && typeof s === "object" && !Array.isArray(s)) specifications = s;
//     } catch {}

//     // Required
//     if (!name?.trim() || !price || !stock || !category) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, price, stock and category required",
//       });
//     }

//     const cat = await Category.findById(category);
//     if (!cat) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid category" });
//     }

//     // ──────────────── REAL IMAGE UPLOAD TO CLOUDINARY (WORKING 100%) ────────────────
//     let imageUrl = null;
//     let images = [];

//     const imageFiles = Array.isArray(req.files)
//       ? req.files.filter((file) => file?.mimetype?.startsWith("image/"))
//       : [];

//     if (imageFiles.length > 0) {
//       for (const file of imageFiles) {
//         const result = await uploadToCloudinary(file.buffer);
//         images.push(result.secure_url);
//       }
//       imageUrl = images[0];
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "At least one image is required",
//       });
//     }
//     // ─────────────────────────────────────────────────────────────────────

//     // If no files uploaded → use placeholder (optional fallback)
//     if (!imageUrl) {
//       imageUrl =
//         "https://via.placeholder.com/600x600/cccccc/666666?text=No+Image";
//       images = [imageUrl];
//     }

//     const product = await Product.create({
//       name: name.trim(),
//       description: description.trim(),
//       price: Number(price),
//       stock: Number(stock),
//       category,
//       highlights,
//       specifications,
//       imageUrl,
//       images,
//     });

//     const populated = await Product.findById(product._id).populate(
//       "category",
//       "name slug"
//     );

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully (image upload disabled)",
//       product: populated,
//     });
//   } catch (error) {
//     console.error("Add product error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error: " + error.message,
//     });
//   }
// };

// // UPDATE PRODUCT

// export const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const product = await Product.findById(id);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     const {
//       name,
//       description,
//       price,
//       stock,
//       category,
//       highlights: highlightsJson,
//       specifications: specsJson,
//     } = req.body;

//     // Parse JSON safely
//     let highlights = product.highlights || [];
//     let specifications = product.specifications || {};

//     if (highlightsJson) {
//       try {
//         const parsed = JSON.parse(highlightsJson);
//         highlights = Array.isArray(parsed) ? parsed : highlights;
//       } catch {}
//     }

//     if (specsJson) {
//       try {
//         const parsed = JSON.parse(specsJson);
//         if (
//           typeof parsed === "object" &&
//           parsed !== null &&
//           !Array.isArray(parsed)
//         ) {
//           specifications = parsed;
//         }
//       } catch {}
//     }

//     // Update fields
//     if (name) product.name = name.trim();
//     if (description !== undefined) product.description = description.trim();
//     if (price) product.price = Number(price);
//     if (stock) product.stock = Number(stock);
//     if (category) {
//       const cat = await Category.findById(category);
//       if (!cat)
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid category" });
//       product.category = category;
//     }

//     product.highlights = highlights;
//     product.specifications = specifications; // auto-converted to Map

//     // Handle new images
//     if (req.files && req.files.length > 0) {
//       const uploaded = [];
//       for (const file of req.files) {
//         const result = await uploadToCloudinary(file.buffer);
//         uploaded.push(result.secure_url);
//       }
//       product.images = uploaded;
//       product.imageUrl = uploaded[0];
//     }

//     await product.save(); // Triggers Map conversion + rating update

//     const populated = await Product.findById(id).populate(
//       "category",
//       "name slug"
//     );

//     res.json({
//       success: true,
//       message: "Product updated successfully",
//       product: populated,
//     });
//   } catch (error) {
//     console.error("Update product error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update product",
//       error: error.message,
//     });
//   }
// };

// // GET ALL PRODUCTS
// export const getProducts = async (req, res) => {
//   try {
//     const filter = {};
//     if (req.query.category) filter.category = req.query.category;
//     if (req.query.q) {
//       const regex = { $regex: req.query.q, $options: "i" };
//       filter.$or = [
//         { name: regex },
//         { description: regex },
//         { "category.name": regex },
//       ];
//     }

//     const products = await Product.find(filter)
//       .populate("category", "name slug")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json({ success: true, products });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // GET SINGLE PRODUCT
// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id).populate(
//       "category",
//       "name slug"
//     );

//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     res.json({ success: true, product });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // DELETE PRODUCT
// export const deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }
//     res.json({ success: true, message: "Product deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// export const addReview = async (req, res) => {
//   try {
//     const { rating, comment } = req.body;
//     const userId = req.user?.id;
//     const product = await Product.findById(req.params.id);

//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     if (!userId)
//       return res
//         .status(401)
//         .json({ success: false, message: "Login required" });

//     if (rating < 1 || rating > 5) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Rating must be 1-5" });
//     }

//     const alreadyReviewed = product.reviews.find(
//       (r) => r.user.toString() === userId
//     );
//     if (alreadyReviewed) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Already reviewed" });
//     }

//     product.reviews.push({
//       user: userId,
//       name: req.user.name,
//       rating: Number(rating),
//       comment,
//     });

//     await product.save(); // Triggers rating update

//     const updated = await Product.findById(req.params.id).populate(
//       "reviews.user",
//       "name"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Review added",
//       reviews: updated.reviews,
//       rating: updated.rating,
//     });
//   } catch (error) {
//     console.error("Review error:", error);
//     res.status(500).json({ success: false, message: "Failed to add review" });
//   }
// };
////////////////////////////////// Updated with discount and offer and validation---
// import Product from "../models/Product.js";
// import Category from "../models/Category.js";
// import cloudinary from "../config/cloudinary.js";

// // Upload buffer to Cloudinary
// async function uploadToCloudinary(buffer) {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: "MyStore/products",
//         resource_type: "image",
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );
//     stream.end(buffer);
//   });
// }

// /* ============================================
//    SEARCH PRODUCTS
// ============================================ */
// export async function searchProducts(req, res) {
//   try {
//     const { q, limit = 50 } = req.query;

//     if (!q || q.trim().length < 2) {
//       return res.json({ success: true, products: [] });
//     }

//     const searchTerm = q.trim();

//     const products = await Product.find({
//       $or: [
//         { name: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//         { "category.name": { $regex: searchTerm, $options: "i" } },
//       ],
//       stock: { $gt: 0 },
//     })
//       .select("name price imageUrl category description")
//       .populate("category", "name")
//       .limit(parseInt(limit))
//       .sort({ createdAt: -1 })
//       .lean();

//     return res.json({ success: true, products });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Search failed",
//       error: err.message,
//     });
//   }
// }

// /* ============================================
//    CREATE PRODUCT (Images Optional)
// ============================================ */
// export const addProduct = async (req, res) => {
//   try {
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

//     /* ------------------------------
//        VALIDATION
//     ------------------------------ */

//     if (!name?.trim() || !price || !stock || !category) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, price, stock and category required",
//       });
//     }

//     if (Number(price) <= 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Price must be greater than 0" });

//     if (Number(discountPrice) < 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount price cannot be negative" });

//     if (Number(discountPrice) >= Number(price))
//       return res.status(400).json({
//         success: false,
//         message: "Discount price must be lower than actual price",
//       });

//     if (Number(stock) < 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Stock cannot be negative" });

//     const cat = await Category.findById(category);
//     if (!cat)
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid category" });

//     /* ------------------------------
//        PARSE JSON FIELDS
//     ------------------------------ */

//     let highlights = [];
//     try {
//       const h = JSON.parse(highlightsJson);
//       if (Array.isArray(h)) highlights = h.filter(Boolean);
//     } catch {}

//     let specifications = {};
//     try {
//       const s = JSON.parse(specsJson);
//       if (s && typeof s === "object" && !Array.isArray(s)) specifications = s;
//     } catch {}

//     let offersArray = [];
//     try {
//       const o = JSON.parse(offers);
//       if (Array.isArray(o)) offersArray = o.filter(Boolean);
//     } catch {}

//     /* ------------------------------
//        GENERATE UNIQUE SLUG
//     ------------------------------ */

//     const baseSlug = name
//       .trim()
//       .toLowerCase()
//       .replace(/\s+/g, "-")
//       .replace(/[^\w-]/g, "");

//     const slug = `${baseSlug}-${Date.now()}`;

//     /* ------------------------------
//        IMAGE HANDLING (OPTIONAL)
//     ------------------------------ */

//     let images = [];
//     let imageUrl = null;

//     // Case 1: Real images uploaded
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const result = await uploadToCloudinary(file.buffer);
//         images.push(result.secure_url);
//       }
//       imageUrl = images[0];
//     }

//     // Case 2: Provided URL
//     else if (providedImageUrl) {
//       imageUrl = providedImageUrl;
//       images = [providedImageUrl];
//     }

//     // Case 3: No images at all → fallback
//     else {
//       imageUrl = "https://via.placeholder.com/600x600.png?text=No+Image";
//       images = [imageUrl];
//     }

//     /* ------------------------------
//        CREATE PRODUCT
//     ------------------------------ */

//     const product = await Product.create({
//       name: name.trim(),
//       slug,
//       description: description.trim(),
//       price: Number(price),
//       discountPrice: Number(discountPrice),
//       offers: offersArray,
//       stock: Number(stock),
//       category,
//       highlights,
//       specifications,
//       imageUrl,
//       images,
//     });

//     const populated = await Product.findById(product._id).populate(
//       "category",
//       "name slug"
//     );

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product: populated,
//     });
//   } catch (error) {
//     console.error("🔥 ADD PRODUCT ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error: " + error.message,
//     });
//   }
// };

// /* ============================================
//    UPDATE PRODUCT
// ============================================ */
// export const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const product = await Product.findById(id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

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

//     /* ------------------------------
//        VALIDATION
//     ------------------------------ */

//     if (price !== undefined && Number(price) <= 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Price must be greater than 0" });

//     if (discountPrice !== undefined && Number(discountPrice) < 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Discount price cannot be negative" });

//     if (
//       price !== undefined &&
//       discountPrice !== undefined &&
//       Number(discountPrice) >= Number(price)
//     )
//       return res.status(400).json({
//         success: false,
//         message: "Discount price must be lower than actual price",
//       });

//     if (stock !== undefined && Number(stock) < 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Stock cannot be negative" });

//     /* ------------------------------
//        PARSE JSON FIELDS
//     ------------------------------ */

//     if (highlightsJson) {
//       try {
//         const parsed = JSON.parse(highlightsJson);
//         if (Array.isArray(parsed)) product.highlights = parsed;
//       } catch {}
//     }

//     if (specsJson) {
//       try {
//         const parsed = JSON.parse(specsJson);
//         if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
//           product.specifications = parsed;
//         }
//       } catch {}
//     }

//     if (offers !== undefined) {
//       try {
//         const parsed = JSON.parse(offers);
//         if (Array.isArray(parsed)) product.offers = parsed.filter(Boolean);
//       } catch {}
//     }

//     /* ------------------------------
//        APPLY BASIC UPDATES
//     ------------------------------ */

//     if (name) product.name = name.trim();
//     if (description !== undefined) product.description = description.trim();
//     if (price !== undefined) product.price = Number(price);
//     if (discountPrice !== undefined)
//       product.discountPrice = Number(discountPrice);
//     if (stock !== undefined) product.stock = Number(stock);

//     if (category) {
//       const cat = await Category.findById(category);
//       if (!cat)
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid category" });
//       product.category = category;
//     }

//     /* ------------------------------
//        IMAGE HANDLING (OPTIONAL)
//     ------------------------------ */

//     if (req.files && req.files.length > 0) {
//       const uploaded = [];
//       for (const file of req.files) {
//         const result = await uploadToCloudinary(file.buffer);
//         uploaded.push(result.secure_url);
//       }
//       product.images = uploaded;
//       product.imageUrl = uploaded[0];
//     } else if (providedImageUrl) {
//       product.images = [providedImageUrl];
//       product.imageUrl = providedImageUrl;
//     }

//     await product.save();

//     const populated = await Product.findById(id).populate(
//       "category",
//       "name slug"
//     );

//     res.json({
//       success: true,
//       message: "Product updated successfully",
//       product: populated,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update product: " + error.message,
//     });
//   }
// };

// /* ============================================
//    GET ALL / SINGLE / DELETE
// ============================================ */

// export const getProducts = async (req, res) => {
//   try {
//     const filter = {};

//     if (req.query.category) filter.category = req.query.category;

//     if (req.query.q) {
//       const regex = { $regex: req.query.q, $options: "i" };
//       filter.$or = [
//         { name: regex },
//         { description: regex },
//         { "category.name": regex },
//       ];
//     }

//     const products = await Product.find(filter)
//       .populate("category", "name slug")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json({ success: true, products });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id).populate(
//       "category",
//       "name slug"
//     );

//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     res.json({ success: true, product });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getProductsByCategorySlug = async (req, res) => {
//   try {
//     const { slug } = req.params;

//     const category = await Category.findOne({ slug });

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     const products = await Product.find({ category: category._id }).populate(
//       "category",
//       "name slug"
//     );

//     res.json({
//       success: true,
//       products,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const getProductBySlug = async (req, res) => {
//   try {
//     const product = await Product.findOne({ slug: req.params.slug }).populate(
//       "category",
//       "name slug"
//     );

//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     res.json({ success: true, product });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     res.json({ success: true, message: "Product deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const addReview = async (req, res) => {
//   try {
//     const { rating, comment } = req.body;
//     const userId = req.user?.id;

//     const product = await Product.findById(req.params.id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     if (!userId)
//       return res
//         .status(401)
//         .json({ success: false, message: "Login required" });

//     if (rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Rating must be between 1 and 5",
//       });
//     }

//     const alreadyReviewed = product.reviews.find(
//       (r) => r.user.toString() === userId
//     );
//     if (alreadyReviewed) {
//       return res.status(400).json({
//         success: false,
//         message: "Already reviewed",
//       });
//     }

//     product.reviews.push({
//       user: userId,
//       name: req.user.name,
//       rating: Number(rating),
//       comment,
//     });

//     await product.save();

//     const updated = await Product.findById(req.params.id).populate(
//       "reviews.user",
//       "name"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Review added",
//       reviews: updated.reviews,
//       rating: updated.rating,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to add review" });
//   }
// };
/////////////////////////////////////////////////////////////////////////
//////////////////////////// Update with Cost Price
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
    const filter = {};

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
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );

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

    const products = await Product.find({ category: category._id }).populate(
      "category",
      "name slug"
    );

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
   DELETE PRODUCT
============================================================ */
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
