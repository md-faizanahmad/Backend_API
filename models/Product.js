// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     description: String,
//     price: { type: Number, required: true },
//     stock: { type: Number, required: true, default: 0 },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     highlights: [String],
//     specifications: {
//       type: Map,
//       of: String,
//     },

//     reviews: [
//       {
//         user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         name: String,
//         rating: { type: Number, min: 1, max: 5 },
//         comment: String,
//         verified: { type: Boolean, default: false },
//         createdAt: { type: Date, default: Date.now },
//       },
//     ],
//     rating: {
//       average: { type: Number, default: 0 },
//       count: { type: Number, default: 0 },
//     },

//     imageUrl: { type: String, required: true },
//   },

//   { timestamps: true }
// );

// export default mongoose.model("Product", productSchema);
/////////////////////////////////////////////////////////////////////////////////////////
//////////////// Updated with reviews
// models/Product.js

// const productSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Product name is required"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       trim: true,
//     },
//     price: {
//       type: Number,
//       required: [true, "Price is required"],
//       min: [0, "Price cannot be negative"],
//     },
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
//     highlights: [
//       {
//         type: String,
//         trim: true,
//       },
//     ],
//     specifications: {
//       type: Map,
//       of: String,
//       default: new Map(),
//       // THIS IS THE KEY FIX — Converts plain object → Map
//       set: function (value) {
//         if (value && !(value instanceof Map)) {
//           return new Map(Object.entries(value));
//         }
//         return value || new Map();
//       },
//       // Converts Map → plain object when sending to frontend
//       get: function (value) {
//         if (value instanceof Map) {
//           return Object.fromEntries(value);
//         }
//         return value || {};
//       },
//     },
//     reviews: [reviewSchema],

//     rating: {
//       average: {
//         type: Number,
//         default: 0,
//         min: 0,
//         max: 5,
//       },
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//     imageUrl: {
//       type: String,
//       required: [true, "Main image is required"],
//     },
//     images: [
//       {
//         type: String,
//       },
//     ],
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true, getters: true },
//     toObject: { virtuals: true, getters: true },
//   }
// );

// Update After Test
// models/Product.js
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
//     name: {
//       type: String,
//       required: [true, "Product name is required"],
//       trim: true,
//       index: "text", // ← text search on name
//     },
//     description: {
//       type: String,
//       trim: true,
//       index: "text", // ← text search on description
//     },
//     price: {
//       type: Number,
//       required: [true, "Price is required"],
//       min: [0, "Price cannot be negative"],
//     },
//     // slug 25--11
//     slug: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     /// Discount Price new add 24-11 evening
//     discountPrice: {
//       type: Number,
//       default: 0,
//       min: [0, "Discount price cannot be negative"],
//     },

//     offers: [
//       {
//         type: String,
//         trim: true,
//       },
//     ],

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
//       index: true, // ← { category: 1 }
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
//         index: -1, // ← { "rating.average": -1 } for fast sorting
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

// // Auto-generate slug from name
// productSchema.pre("save", function (next) {
//   if (this.isModified("name")) {
//     this.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "");
//   }
//   next();
// });

// export default mongoose.models.Product ||
//   mongoose.model("Product", productSchema);

//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Update with Cost
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
