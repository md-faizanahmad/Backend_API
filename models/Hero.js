import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
  {
    liveBadge: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: "" },
    },

    headline: { type: String, required: true },
    gradientHeadline: { type: String, default: "" },
    subheadline: { type: String, default: "" },

    primaryCTA: {
      text: { type: String, default: "" },
      link: { type: String, default: "/" },
    },

    secondaryCTA: {
      text: { type: String, default: "" },
      link: { type: String, default: "/" },
    },

    saleBadge: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: "" },
    },

    backgroundImage: { type: String, required: true },
  },
  { timestamps: true }
);

// Only allow ONE hero section
export default mongoose.models.Hero || mongoose.model("Hero", heroSchema);
