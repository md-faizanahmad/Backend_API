////// 02-12
// controllers/heroController.js
// Robust Hero controller using centralized image service for upload + deletion.
// Keeps backwards compatibility with previous behavior (backgroundImage stored as URL).
//
// Requires: utils/imageService.js exporting:
//   - uploadBufferToCloudinary(buffer, opts) -> Promise<{ url, publicId }>
//   - deletePublicId(publicId) -> Promise(result)
//   - cloudinaryOptimizeUrl(url) -> string

import Hero from "../models/Hero.js";
import {
  uploadBufferToCloudinary,
  deletePublicId,
  cloudinaryOptimizeUrl,
} from "../utils/imageService.js";

/**
 * GET hero section (public)
 */
export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne().lean();
    // If hero exists and has images, optimize URL for response
    if (hero && hero.backgroundImage) {
      hero.backgroundImage = cloudinaryOptimizeUrl(hero.backgroundImage);
    }
    return res.json({ success: true, hero });
  } catch (err) {
    console.error("GET HERO ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch hero" });
  }
};

/**
 * UPDATE (or create) hero section (admin)
 *
 * Router currently uses:
 *   upload.single("backgroundImage")
 * so req.file.buffer is available. That middleware may remain unchanged.
 *
 * This function:
 * - Parses the JSON fields sent via FormData
 * - If req.file exists -> uploads buffer to Cloudinary via imageService
 * - If there was a previous backgroundPublicId (if model stores it) -> deletes it
 * - Saves backgroundImage (url) and, if model supports backgroundPublicId, saves that too
 */
export const updateHero = async (req, res) => {
  try {
    // Load existing hero doc if present
    let hero = await Hero.findOne();

    // Extract fields (FormData sends strings / JSON)
    const {
      liveBadge = "{}",
      headline = "",
      gradientHeadline = "",
      subheadline = "",
      primaryCTA = "{}",
      secondaryCTA = "{}",
      saleBadge = "{}",
    } = req.body;

    // Parse JSON-ish fields safely
    let parsedLiveBadge = {};
    let parsedPrimaryCTA = {};
    let parsedSecondaryCTA = {};
    let parsedSaleBadge = {};
    try {
      parsedLiveBadge = JSON.parse(liveBadge);
    } catch {}
    try {
      parsedPrimaryCTA = JSON.parse(primaryCTA);
    } catch {}
    try {
      parsedSecondaryCTA = JSON.parse(secondaryCTA);
    } catch {}
    try {
      parsedSaleBadge = JSON.parse(saleBadge);
    } catch {}

    // Prepare new background image variables
    let newBackgroundUrl = hero?.backgroundImage ?? null;
    let newBackgroundPublicId = hero?.backgroundPublicId ?? null; // optional field in model

    // If a file was uploaded, upload it to Cloudinary via shared helper
    if (req.file && req.file.buffer) {
      try {
        // Upload buffer -> normalized { url, publicId }
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
          folder: "MyStore/hero",
        }); // will throw on error

        // Set new values
        newBackgroundUrl = uploaded.url;
        newBackgroundPublicId = uploaded.publicId || null;

        // If there was a previous publicId stored, and it's different, delete it
        // Only attempt deletion if hero existed and reported a publicId
        if (
          hero &&
          hero.backgroundPublicId &&
          hero.backgroundPublicId !== newBackgroundPublicId
        ) {
          // best-effort: don't block the update on deletion failure
          try {
            await deletePublicId(hero.backgroundPublicId);
            console.log(
              "Deleted old hero background publicId:",
              hero.backgroundPublicId
            );
          } catch (delErr) {
            console.warn(
              "Failed to delete old hero background publicId:",
              hero.backgroundPublicId,
              delErr
            );
            // We proceed anyway — at worst old image remains in Cloudinary
          }
        }
      } catch (uploadErr) {
        console.error("Hero image upload failed:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload hero background image",
          error: uploadErr.message || String(uploadErr),
        });
      }
    }

    // If no hero exists, create; otherwise update fields
    if (!hero) {
      hero = await Hero.create({
        liveBadge: parsedLiveBadge,
        headline,
        gradientHeadline,
        subheadline,
        primaryCTA: parsedPrimaryCTA,
        secondaryCTA: parsedSecondaryCTA,
        saleBadge: parsedSaleBadge,
        backgroundImage: newBackgroundUrl,
        // optionally store publicId if the model has the field
        ...(newBackgroundPublicId
          ? { backgroundPublicId: newBackgroundPublicId }
          : {}),
      });
    } else {
      hero.liveBadge = parsedLiveBadge;
      hero.headline = headline;
      hero.gradientHeadline = gradientHeadline;
      hero.subheadline = subheadline;
      hero.primaryCTA = parsedPrimaryCTA;
      hero.secondaryCTA = parsedSecondaryCTA;
      hero.saleBadge = parsedSaleBadge;
      hero.backgroundImage = newBackgroundUrl;
      if (typeof hero.backgroundPublicId !== "undefined") {
        // if model had this field previously or allows it, update it
        hero.backgroundPublicId = newBackgroundPublicId ?? null;
      }
      await hero.save();
    }

    // Optimize URL for response (idempotent)
    const respHero = hero.toObject ? hero.toObject() : hero;
    if (respHero && respHero.backgroundImage)
      respHero.backgroundImage = cloudinaryOptimizeUrl(
        respHero.backgroundImage
      );

    return res.json({
      success: true,
      message: "Hero section updated",
      hero: respHero,
    });
  } catch (err) {
    console.error("UPDATE HERO ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update hero section",
      error: err?.message ?? String(err),
    });
  }
};
