// aiRoutes.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/remove-bg", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Image required",
      });
    }

    // Base64 → Binary buffer
    const buffer = Buffer.from(imageBase64, "base64");

    // Use native FormData (Node 18+)
    const form = new FormData();
    form.append("size", "auto");
    form.append(
      "image_file",
      new Blob([buffer], { type: "image/jpeg" }), // native Blob
      "image.jpg"
    );

    // Use Axios to call API
    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      form,
      {
        headers: {
          "X-Api-Key": process.env.AI_TOOL_API_KEY,
          ...form.getHeaders?.(), // for non-native FormData fallback
        },
        responseType: "arraybuffer",
      }
    );

    // Convert result → base64
    const base64 = Buffer.from(response.data).toString("base64");

    return res.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
    });
  } catch (err) {
    console.error("remove-bg error:", err);

    return res.status(500).json({
      success: false,
      message: "Background removal failed",
      error: err?.response?.data || err.message,
    });
  }
});

export default router;
