// import mongoose from "mongoose";
// import slugify from "slugify";

// const categorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Category name is required"],
//       trim: true,
//       unique: true,
//     },
//     slug: {
//       type: String,
//       unique: true,
//       lowercase: true,
//       index: true, // Creates { slug: 1 }
//     },
//     description: {
//       type: String,
//       trim: true,
//     },
//     image: {
//       type: String,
//     },
//     parent: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       default: null,
//       index: true, // Creates { parent: 1 }
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Auto-generate slug
// categorySchema.pre("save", function (next) {
//   if (this.isModified("name")) {
//     this.slug = slugify(this.name, { lower: true, strict: true });
//   }
//   next();
// });

// // Virtual: subcategories
// categorySchema.virtual("children", {
//   ref: "Category",
//   localField: "_id",
//   foreignField: "parent",
// });

// export default mongoose.models.Category ||
//   mongoose.model("Category", categorySchema);

/// new Update with Sub-Category
// import mongoose from "mongoose";
// import slugify from "slugify";

// const categorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Category name is required"],
//       trim: true,
//       unique: true,
//     },

//     slug: {
//       type: String,
//       unique: true,
//       lowercase: true,
//       index: true,
//     },

//     // Optional image for category
//     image: {
//       type: String,
//       default: null,
//     },

//     // ✔ Main Category = parent:null, isSub:false
//     // ✔ Subcategory = parent:CategoryID, isSub:true
//     isSub: {
//       type: Boolean,
//       default: false,
//     },

//     parent: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       default: null,
//       index: true,
//     },

//     // Soft delete fields
//     isDeleted: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },

//     deletedAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Auto slug from name
// categorySchema.pre("save", function (next) {
//   if (this.isModified("name")) {
//     this.slug = slugify(this.name, { lower: true, strict: true });
//   }
//   next();
// });

// export default mongoose.models.Category ||
//   mongoose.model("Category", categorySchema);
///////////////////// new update 1am 30-11
import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    image: {
      type: String,
      default: null,
    },
    imagePublicId: { type: String, default: null }, // cloudinary public_id for deletion

    isSub: {
      type: Boolean,
      default: false,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto slug
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.index({ parent: 1 });
categorySchema.index({ isDeleted: 1 });
categorySchema.index({ slug: 1 });

// Virtual children list (useful for admin UI)
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

export default mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
