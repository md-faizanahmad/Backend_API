import Hero from "../models/Hero.js";
import cloudinary from "../config/cloudinary.js";

async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "MyStore/hero", resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/* ======================================================
   GET HERO SECTION (public)
====================================================== */
export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne();
    return res.json({ success: true, hero });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch hero" });
  }
};

/* ======================================================
   UPDATE / CREATE HERO (admin only)
====================================================== */
export const updateHero = async (req, res) => {
  try {
    let hero = await Hero.findOne();

    const {
      liveBadge = "{}",
      headline = "",
      gradientHeadline = "",
      subheadline = "",
      primaryCTA = "{}",
      secondaryCTA = "{}",
      saleBadge = "{}",
    } = req.body;

    // Parse JSON fields
    const parsedLiveBadge = JSON.parse(liveBadge);
    const parsedPrimaryCTA = JSON.parse(primaryCTA);
    const parsedSecondaryCTA = JSON.parse(secondaryCTA);
    const parsedSaleBadge = JSON.parse(saleBadge);

    // HANDLE IMAGE UPLOAD
    let backgroundImage = hero?.backgroundImage;

    if (req.file) {
      const upload = await uploadToCloudinary(req.file.buffer);
      backgroundImage = upload.secure_url;
    }

    // If no hero exists → create
    if (!hero) {
      hero = await Hero.create({
        liveBadge: parsedLiveBadge,
        headline,
        gradientHeadline,
        subheadline,
        primaryCTA: parsedPrimaryCTA,
        secondaryCTA: parsedSecondaryCTA,
        saleBadge: parsedSaleBadge,
        backgroundImage,
      });
    } else {
      // Update existing hero
      hero.liveBadge = parsedLiveBadge;
      hero.headline = headline;
      hero.gradientHeadline = gradientHeadline;
      hero.subheadline = subheadline;
      hero.primaryCTA = parsedPrimaryCTA;
      hero.secondaryCTA = parsedSecondaryCTA;
      hero.saleBadge = parsedSaleBadge;
      hero.backgroundImage = backgroundImage;
      await hero.save();
    }

    return res.json({
      success: true,
      message: "Hero section updated",
      hero,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update hero section",
      error: err.message,
    });
  }
};
