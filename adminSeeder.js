import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ----------------------
// 1) MongoDB Connection
// ----------------------
const MONGO_URI =
  "mongodb+srv://mdahmaddev_db_user:nQtOvZY9bnR5bT70@mystorebackend.nfckxvo.mongodb.net/MyStore_DB?appName=MyStoreBackend"; // <-- paste your Atlas URI

// ----------------------
// 2) Admin Schema
// ----------------------
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

// ----------------------
// 3) Seeder Function
// ----------------------
async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    const name = "Md Ahmad";
    const email = "admin@myazstore.com";
    const plainPassword = "admin123";

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Remove existing admin (optional but safer)
    await Admin.deleteMany({ email });

    // Insert new admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("✅ Admin Created:");
    console.log(admin);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdmin();
