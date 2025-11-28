// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });
// export default upload;
////////////////new

// import multer from "multer";

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// export default upload;

////////////update
// middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional: 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

export default upload;
