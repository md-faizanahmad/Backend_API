// import mongoose from "mongoose";

// const reviewSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     name: { type: String, required: true },
//     rating: {
//       type: Number,
//       required: true,
//       min: [1, "Rating must be at least 1"],
//       max: [5, "Rating cannot exceed 5"],
//     },
//     comment: { type: String, required: true },
//     verified: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const productSchema = new mongoose.Schema(
//   {
//     // SOFT ARCHIVE (user-hidden)
//     isArchived: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     archivedAt: {
//       type: Date,
//       default: null,
//     },

//     // HARD DELETE (permanent)
//     isDeleted: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     deletedAt: {
//       type: Date,
//       default: null,
//     },

//     // Products
//     name: {
//       type: String,
//       required: [true, "Product name is required"],
//       trim: true,
//       index: "text",
//     },

//     description: {
//       type: String,
//       trim: true,
//       index: "text",
//     },

//     price: {
//       type: Number,
//       required: [true, "Price is required"],
//       min: [0, "Price cannot be negative"],
//     },

//     /* 🟦 NEW: costPrice (supplier/purchase cost)
//        - optional
//        - defaults to product price
//        - safe for older products
//     */
//     costPrice: {
//       type: Number,
//       min: [0, "Cost price cannot be negative"],
//       default: function () {
//         return this.price;
//       },
//     },

//     slug: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     discountPrice: {
//       type: Number,
//       default: 0,
//       min: [0, "Discount price cannot be negative"],
//     },

//     offers: [{ type: String, trim: true }],

//     stock: {
//       type: Number,
//       required: true,
//       default: 0,
//       min: [0, "Stock cannot be negative"],
//     },

//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: [true, "Category is required"],
//       index: true,
//     },

//     highlights: [{ type: String, trim: true }],

//     specifications: {
//       type: Map,
//       of: String,
//       default: {},
//       set: (v) =>
//         v && !(v instanceof Map) ? new Map(Object.entries(v)) : v || new Map(),
//       get: (v) => (v instanceof Map ? Object.fromEntries(v) : v || {}),
//     },

//     reviews: [reviewSchema],

//     rating: {
//       average: {
//         type: Number,
//         default: 0,
//         min: 0,
//         max: 5,
//         index: -1,
//       },
//       count: { type: Number, default: 0 },
//     },

//     imageUrl: {
//       type: String,
//       required: [true, "Main image is required"],
//     },

//     images: [{ type: String }],
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true, getters: true },
//     toObject: { virtuals: true, getters: true },
//   }
// );

// // Auto-update average rating
// productSchema.pre("save", function (next) {
//   if (this.isModified("reviews")) {
//     const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
//     this.rating.average =
//       this.reviews.length > 0 ? total / this.reviews.length : 0;
//     this.rating.count = this.reviews.length;
//   }
//   next();
// });

// // Auto-generate slug
// productSchema.pre("save", function (next) {
//   if (this.isModified("name")) {
//     this.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "");
//   }
//   next();
// });

// // Add indexes for performance (safe but recommended)
// productSchema.index({ name: "text", description: "text" });
// productSchema.index({ category: 1 });
// productSchema.index({ isArchived: 1 });
// productSchema.index({ createdAt: -1 });

// export default mongoose.models.Product ||
//   mongoose.model("Product", productSchema);

/*--------------------------------------------------------------------------------*/
///// Update with product image delete from cloudinary
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const imageSubSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null }, // <-- store Cloudinary public_id here
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // SOFT ARCHIVE (user-hidden)
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },

    // HARD DELETE (permanent)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    /* ------------------------------------------*/

    // Products
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: "text",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      index: "text",
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    /*  NEW: costPrice (supplier/purchase cost)
       - optional
       - defaults to product price
       - safe for older products
    */
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
      default: function () {
        return this.price;
      },
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Discount price cannot be negative"],
    },

    offers: [{ type: String, trim: true }],

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    highlights: [{ type: String, trim: true }],

    specifications: {
      type: Map,
      of: String,
      default: {},
      set: (v) =>
        v && !(v instanceof Map) ? new Map(Object.entries(v)) : v || new Map(),
      get: (v) => (v instanceof Map ? Object.fromEntries(v) : v || {}),
    },

    reviews: [reviewSchema],

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        index: -1,
      },
      count: { type: Number, default: 0 },
    },

    // main legacy field kept for backward compatibility (optional in future)
    imageUrl: {
      type: String,
      required: [true, "Main image is required"],
    },

    // NEW: store images as objects { url, publicId } to reliably delete from Cloudinary
    images: {
      type: [imageSubSchema],
      validate: {
        validator: function (val) {
          // At least one image object required (ensures main imageUrl matches an images entry)
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one image is required",
      },
    },

    // SEO and ROUTES
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

/* ----------------- Hooks & Helpers ------------------ */

// Auto-update average rating
productSchema.pre("save", function (next) {
  if (this.isModified("reviews")) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating.average =
      this.reviews.length > 0 ? total / this.reviews.length : 0;
    this.rating.count = this.reviews.length;
  }
  next();
});

// Auto-generate slug when name changes
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

/* ----------------- Virtuals ------------------ */

productSchema.virtual("id").get(function () {
  return this._id.toString();
});
productSchema.virtual("thumbnail").get(function () {
  // prefer first images.url if exists; fallback to imageUrl
  if (
    Array.isArray(this.images) &&
    this.images.length > 0 &&
    this.images[0].url
  ) {
    return this.images[0].url;
  }
  return this.imageUrl;
});

productSchema.virtual("isOutOfStock").get(function () {
  return this.stock <= 0;
});

productSchema.virtual("stockStatus").get(function () {
  if (this.stock < 2) return "dead";
  if (this.stock < 5) return "low";
  return "positive";
});

/* ----------------- Indexes ------------------ */

productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ isArchived: 1 });
productSchema.index({ createdAt: -1 });

/* ----------------- Instance / Static helpers ------------------ */

/**
 * Returns an array of publicIds for images that have one (filtered).
 * Useful to pass to cloudinary.api.delete_resources(publicIds)
 */
productSchema.methods.getImagePublicIds = function () {
  if (!Array.isArray(this.images)) return [];
  return this.images.map((i) => i.publicId).filter(Boolean);
};

/**
 * Extract a Cloudinary public_id from a standard Cloudinary secure_url.
 * Works for URLs like:
 * https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.png
 *
 * Returns string publicId (including folder path) or null if can't parse.
 */
productSchema.statics.extractPublicIdFromUrl = function (url) {
  if (!url || typeof url !== "string") return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let after = parts[1];
    // remove version prefix if present
    after = after.replace(/^v\d+\//, "");
    // strip query params
    after = after.split("?")[0];
    // remove file extension
    const dot = after.lastIndexOf(".");
    if (dot > -1) after = after.slice(0, dot);
    return after;
  } catch (e) {
    return null;
  }
};

/**
 * Pragmatic backfill helper:
 * - If images[].publicId is missing but images[].url or imageUrl exists,
 *   it will try to extract publicId and set it.
 *
 * NOTE: this runs on the document instance and saves it.
 * Use carefully for one-off migrations.
 */
productSchema.methods.backfillPublicIdsFromUrls = async function () {
  let changed = false;

  // handle images array
  if (Array.isArray(this.images)) {
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      if (!img.publicId && img.url) {
        const pid = this.constructor.extractPublicIdFromUrl(img.url);
        if (pid) {
          this.images[i].publicId = pid;
          changed = true;
        }
      }
    }
  }

  // if images array empty but imageUrl present, create images[0]
  if (
    (!Array.isArray(this.images) || this.images.length === 0) &&
    this.imageUrl
  ) {
    const pid = this.constructor.extractPublicIdFromUrl(this.imageUrl);
    if (pid) {
      this.images = [{ url: this.imageUrl, publicId: pid }];
      changed = true;
    }
  }

  if (changed) {
    await this.save();
  }
  return changed;
};

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
