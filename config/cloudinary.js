// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";
// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export default cloudinary;

// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";
// dotenv.config();

// cloudinary.config({
//   cloud_name: "daqb5wglu",
//   api_key: "121556272218283",
//   api_secret: "HFrVON_biKhAn1wVdhHj4KZzhTA",
// });

// export default cloudinary;
//////////////////new

// src/config/cloudinary.js
// src/config/cloudinary.js   ← This file must be exactly like this
import { v2 as cloudinary } from "cloudinary";

// THIS LINE IS CRITICAL — DO NOT USE cloudinary.v2.config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
