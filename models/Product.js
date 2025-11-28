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

const productSchema = new mongoose.Schema(
  {
    // 🟦 SOFT DELETE FIELDS (NEW)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // faster queries
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // Products
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: "text",
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

    /* 🟦 NEW: costPrice (supplier/purchase cost)
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

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
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

    imageUrl: {
      type: String,
      required: [true, "Main image is required"],
    },

    images: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

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

// Auto-generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
