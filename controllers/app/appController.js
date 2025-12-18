// controllers/appController.js
import Hero from "../../models/Hero.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import User from "../../models/User.js";
import imageService from "../../utils/imageService.js";

/**
 * GET /v1/bootstrap
 * Returns global app data:
 * - user (if logged in)
 * - wishlist
 * - cart
 * - categories (grouped with subcategories)
 */
export async function getBootstrap(req, res) {
  try {
    const userId = req?.user?.id || null;

    // 1) Categories (same for all users)
    const all = await Category.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();
    const main = all.filter((c) => !c.isSub);
    const subs = all.filter((c) => c.isSub);

    const categories = main.map((m) => ({
      _id: m._id,
      name: m.name,
      slug: m.slug,
      image: m.image ? imageService.cloudinaryOptimizeUrl(m.image) : null,
      subcategories: subs
        .filter((s) => String(s.parent) === String(m._id))
        .map((s) => ({
          _id: s._id,
          name: s.name,
          slug: s.slug,
          image: s.image ? imageService.cloudinaryOptimizeUrl(s.image) : null,
          isDeleted: s.isDeleted,
        })),
    }));

    // 2) If no logged-in user → return only categories
    if (!userId) {
      return res.json({
        success: true,
        data: {
          user: null,
          wishlist: [],
          cart: [],
          categories,
        },
      });
    }

    // 3) Logged-in user data
    const user = await User.findById(userId)
      .select("name email phone wishlist cart")
      .populate("wishlist", "name price imageUrl slug")
      .populate("cart.product", "name price imageUrl slug")
      .lean();

    return res.json({
      success: true,
      data: {
        user: user
          ? {
              id: String(user._id),
              name: user.name,
              email: user.email,
              phone: user.phone,
            }
          : null,
        wishlist: user?.wishlist || [],
        cart: user?.cart || [],
        categories,
      },
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load bootstrap data" });
  }
}

/**
 * GET /v1/home
 * Returns hero + featured products + categories + latest reviews
 */
export async function getHome(req, res) {
  try {
    const hero = await Hero.findOne().lean();
    const optimizedHero =
      hero && hero.backgroundImage
        ? {
            ...hero,
            backgroundImage: imageService.cloudinaryOptimizeUrl(
              hero.backgroundImage
            ),
          }
        : hero;

    // products (new arrivals)
    const products = await Product.find({
      isArchived: { $ne: true },
      isDeleted: { $ne: true },
    })
      .select(
        "name slug price discountPrice imageUrl images stock rating createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    // categories grouped
    const all = await Category.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();
    const main = all.filter((c) => !c.isSub);
    const subs = all.filter((c) => c.isSub);

    const categories = main.map((m) => ({
      _id: m._id,
      name: m.name,
      slug: m.slug,
      image: m.image ? imageService.cloudinaryOptimizeUrl(m.image) : null,
      subcategories: subs
        .filter((s) => String(s.parent) === String(m._id))
        .map((s) => ({
          _id: s._id,
          name: s.name,
          slug: s.slug,
          image: s.image ? imageService.cloudinaryOptimizeUrl(s.image) : null,
          isDeleted: s.isDeleted,
        })),
    }));

    // latest reviews (simple)
    const latestReviews =
      (await Product.aggregate([
        { $match: { "reviews.0": { $exists: true } } },
        { $unwind: "$reviews" },
        {
          $project: {
            user: "$reviews.user",
            name: "$reviews.name",
            rating: "$reviews.rating",
            comment: "$reviews.comment",
            verified: "$reviews.verified",
            createdAt: "$reviews.createdAt",
            productId: "$_id",
            productName: "$name",
            productSlug: "$slug",
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 8 },
      ])) || [];

    return res.json({
      success: true,
      data: {
        hero: optimizedHero,
        featuredProducts: products,
        categories,
        latestReviews,
      },
    });
  } catch (err) {
    console.error("HOME ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to load home" });
  }
}
