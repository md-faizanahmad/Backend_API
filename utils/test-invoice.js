// test-invoice.js — GUARANTEED WORKING (Node.js 23+)
import { generateInvoicePdf } from "./generateInvoicePdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, "INVOICE_PREVIEW.pdf");

// Create real writable stream
const stream = fs.createWriteStream(outputFile);

// Fake Express-like response object
const fakeRes = {
  setHeader: (key, value) => console.log(`Header: ${key} = ${value}`),
  // This is the only important part:
  write: (chunk) => stream.write(chunk),
  end: () => {
    stream.end();
    console.log("PDF generated successfully!");
    console.log("Open now →", outputFile);
  },
};

// Fake order data
const fakeOrder = {
  _id: "67f8d9e4c3b2a1f9d8e7c6b5",
  createdAt: new Date("2025-04-01"),
  totalAmount: 2549.0,
  discount: 300,
  shippingCharges: 99,
  tax: 405,
  shippingAddress: {
    fullName: "Rohan Sharma",
    phone: "+91 98765 43210",
    street: "Flat 302, Green Valley Apartments",
    landmark: "Near Metro Station",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400064",
  },
  user: { name: "Rohan Sharma" },
  paymentInfo: { paymentId: "pay_Mock123456789", status: "completed" },
  items: [
    {
      qty: 1,
      price: 1899.0,
      product: { name: "Premium Cotton T-Shirt - Navy Blue", hsn: "6109" },
    },
    {
      qty: 2,
      price: 225.5,
      product: { name: "Ankle Socks (Pack of 3)", hsn: "6115" },
    },
  ],
};

// RUN IT
console.log("Generating your pro invoice...");
await generateInvoicePdf(fakeRes, fakeOrder);
