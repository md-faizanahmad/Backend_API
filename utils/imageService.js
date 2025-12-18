/* ------------------------------------------ 
This file contains:

1-upload — multer instance (memoryStorage) you can import for routes;
2-getIncomingFiles(req) — normalize req.files to an array;
3-normalizeCloudinaryResult(result) — returns { url, publicId } for any Cloudinary response or legacy string;
4-uploadBufferToCloudinary(buffer, options) — uploads a single buffer and returns normalized result;
5-uploadFilesToCloudinary(files, options) — uploads array of files (parallel with concurrency control);
6-cloudinaryOptimizeUrl(url) — injects q_auto,f_auto transforms safely;
7-deletePublicId(publicId) — remove image from Cloudinary by publicId;
8-small helpers: multerFields(fields) to create fields middleware, and multerArray(fieldName, maxCount) 

------------------------------------------------------------------------------------*/
// utils/imageService.js
import multer from "multer";
import cloudinary from "../config/cloudinary.js"; // the cloudinary v2 instance
import pLimit from "p-limit"; // optional small concurrency limiter; install if needed

// ----- Multer (memory storage) -----
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB default; adjust
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Helper factories for routes
export const multerArray = (fieldName, maxCount = 10) =>
  upload.array(fieldName, maxCount);
export const multerFields = (fieldsArray) => upload.fields(fieldsArray);

// ----- Normalize incoming files -----
// Accepts multer shapes: array (upload.array) or object (upload.fields)
export function getIncomingFiles(req) {
  if (!req || !req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  // prefer common keys
  const keysToTry = ["images", "images[]", "file", "files", "photos", "photo"];
  for (const k of keysToTry) {
    if (req.files[k]) return req.files[k];
  }
  // flatten any arrays in req.files object
  const flattened = Object.values(req.files).flat().filter(Boolean);
  return Array.isArray(flattened) ? flattened : [];
}

// ----- Normalize Cloudinary results -----
export function normalizeCloudinaryResult(result) {
  if (!result) return null;
  if (typeof result === "string") {
    return { url: result, publicId: null };
  }
  const url = result.secure_url || result.secureUrl || result.url || null;
  const publicId =
    result.public_id || result.publicId || result.publicid || null;
  if (!url) return null;
  return { url, publicId };
}

// ----- Upload helpers -----
// single buffer upload -> returns normalized { url, publicId } or throws
export async function uploadBufferToCloudinary(buffer, options = {}) {
  if (!buffer)
    throw new Error("No buffer provided to uploadBufferToCloudinary");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "MyStore/products",
        resource_type: "image",
        use_filename: options.use_filename ?? true,
        unique_filename: options.unique_filename ?? true,
        overwrite: options.overwrite ?? false,
        transformation: options.transformation ?? undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        try {
          const norm = normalizeCloudinaryResult(result);
          if (!norm)
            return reject(new Error("Cloudinary: empty upload result"));
          resolve(norm);
        } catch (e) {
          reject(e);
        }
      }
    );
    stream.end(buffer);
  });
}

// array upload (with concurrency limiting), returns array of { url, publicId }
export async function uploadFilesToCloudinary(files = [], options = {}) {
  if (!Array.isArray(files) || files.length === 0) return [];
  const concurrency = options.concurrency ?? 3;
  const limit = pLimit ? pLimit(concurrency) : (fn) => fn();

  const tasks = files.map((f) =>
    limit(async () => {
      // file may be multer file object -> buffer available
      const buffer = f.buffer;
      if (!buffer) throw new Error("File has no buffer");
      return await uploadBufferToCloudinary(buffer, options);
    })
  );

  // run all
  return Promise.all(tasks);
}

// ----- Delete helper -----
// delete by Cloudinary public id
export async function deletePublicId(publicId) {
  if (!publicId) throw new Error("No publicId provided");
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

// ----- URL optimization -----
// Insert Cloudinary transformation safely after /upload/
export function cloudinaryOptimizeUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!/res\.cloudinary\.com/.test(url)) return url;
  // don't inject twice
  if (/q_auto|f_auto/.test(url)) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_auto,dpr_auto/");
}

////////////////////////////// NEW UPDATE for Categories Image
/* --------------------------
   Additional helper utilities
   - resolveIncomingFile(req): pick first incoming multer file (fields/array/single)
   - uploadSingleFileToCloudinary(file, folder): wrapper that accepts multer file object
     and delegates to uploadBufferToCloudinary (returns { url, publicId } or throws)
   - safeDeletePublicId(publicId): best-effort deletion wrapper
   -------------------------- */

function resolveIncomingFile(req) {
  // Normalize incoming req.files (supports upload.array, upload.fields)
  try {
    const incoming = getIncomingFiles(req); // existing helper in this module
    if (Array.isArray(incoming) && incoming.length > 0) return incoming[0];
    // fallback to req.file if upload.single used
    if (req && req.file) return req.file;
    return null;
  } catch (err) {
    // never throw here — controller should handle upload failures separately
    console.warn("resolveIncomingFile warning:", err.message || err);
    return null;
  }
}

/**
 * uploadSingleFileToCloudinary(file, folder)
 * - file: multer file object (must have buffer)
 * - folder: Cloudinary folder (default "categories")
 * returns normalized { url, publicId } or throws
 *
 * NOTE: you mentioned you already added uploadSingleFileToCloudinary into
 * imageService.js — keep this implementation or replace with your existing one.
 */
async function uploadSingleFileToCloudinary(file, folder = "categories") {
  if (!file) return null;
  if (!file.buffer) {
    // If file doesn't have buffer, it might be a file descriptor object from other middlewares.
    // We won't try to read from disk here — expect multer memoryStorage or similar.
    throw new Error("uploadSingleFileToCloudinary: file has no buffer");
  }
  // Delegate to existing helper that uploads buffer to cloudinary
  const result = await uploadBufferToCloudinary(file.buffer, { folder });
  // normalizeCloudinaryResult already used by uploadBufferToCloudinary, so result is { url, publicId }
  return result;
}

/**
 * safeDeletePublicId(publicId)
 * - best-effort deletion of a Cloudinary publicId
 * - logs but does not throw (controller-level error handling preferred)
 */
async function safeDeletePublicId(publicId) {
  if (!publicId) return;
  try {
    await deletePublicId(publicId);
  } catch (err) {
    console.warn("safeDeletePublicId warning:", publicId, err.message || err);
  }
}

// export default convenience object
const imageService = {
  upload,
  multerArray,
  multerFields,
  getIncomingFiles,
  normalizeCloudinaryResult,
  uploadBufferToCloudinary,
  uploadFilesToCloudinary,
  deletePublicId,
  cloudinaryOptimizeUrl,
  resolveIncomingFile,
  safeDeletePublicId,
  uploadSingleFileToCloudinary,
};

export default imageService;
