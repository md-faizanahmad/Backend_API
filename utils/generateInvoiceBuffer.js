// utils/generateInvoiceBuffer.js
// Email invoice attachment – FINAL FIXED VERSION

import PDFDocumentWithTables from "pdfkit-table";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INR = "Rs. ";

const COMPANY = {
  name: "AZ-STORE",
  gstin: "27AAHCA1234F1Z5",
  address: "Shop 12, Galaxy Complex, Andheri East, Mumbai - 400069",
  phone: "+91 98765 43210",
  email: "support@myazstore.shop",
  bank: "State Bank of India",
  account: "3987XXXXXX1234",
  ifsc: "SBIN0001234",
};

export async function generateInvoiceBuffer(order) {
  return new Promise(async (resolve, reject) => {
    try {
      const buffers = [];
      const orderId = String(order._id);

      const doc = new PDFDocumentWithTables({
        size: "A4",
        margin: 25,
        bufferPages: true,
      });

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Required writable stream
      doc.pipe(process.stdout);

      /* ================= HEADER ================= */
      try {
        doc.image(path.join(__dirname, "logo.png"), 40, 25, { width: 70 });
      } catch {
        /* logo optional */
      }

      doc.fontSize(20).text(COMPANY.name, 120, 30);
      doc.fontSize(9).text(COMPANY.address, 120, 55);
      doc.text(`${COMPANY.email} • ${COMPANY.phone}`, 120, 70);

      /* ================= INVOICE BOX ================= */
      const invNo = `INV-${new Date(order.createdAt).getFullYear()}-${orderId
        .slice(-6)
        .toUpperCase()}`;

      doc.fontSize(16).text("TAX INVOICE", 400, 30);
      doc
        .fontSize(9)
        .text(`Invoice No: ${invNo}`, 400, 55)
        .text(
          `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
          400,
          68
        )
        .text(`GSTIN: ${COMPANY.gstin}`, 400, 81);

      /* ================= BILL / SHIP ================= */
      const s = order.shippingAddress || {};
      const customerName = s.fullName || "Customer";

      await doc.table(
        {
          headers: ["Bill To", "Ship To"],
          rows: [
            [
              `${customerName}
${s.phone || ""}
${s.street || ""}
${s.city || ""}, ${s.state || ""} - ${s.pincode || ""}`,
              `${customerName}
${s.phone || ""}
${s.street || ""}
${s.city || ""}, ${s.state || ""} - ${s.pincode || ""}`,
            ],
          ],
        },
        { x: 40, y: 120, width: 520, padding: 10 }
      );

      /* ================= ITEMS ================= */
      const rows = order.items.map((it, i) => [
        i + 1,
        it.product?.name || "Product",
        it.qty,
        `${INR}${it.price.toLocaleString("en-IN")}`,
        `${INR}${(it.qty * it.price).toLocaleString("en-IN")}`,
      ]);

      await doc.table(
        {
          headers: ["#", "Item", "Qty", "Rate", "Amount"],
          rows,
        },
        { x: 40, y: doc.y + 20, width: 520 }
      );

      /* ================= TOTAL ================= */
      const subtotal = order.items.reduce((a, i) => a + i.price * i.qty, 0);

      doc
        .fontSize(12)
        .text(
          `Grand Total: ${INR}${subtotal.toLocaleString("en-IN")}`,
          400,
          doc.y + 20
        );

      /* ================= QR (WITH ORDER DETAILS) ================= */
      try {
        const itemsSummary = order.items
          .map((i) => `${i.product?.name} x${i.qty}`)
          .join(", ");

        const qrPayload = `Order:${orderId}
Amount:${subtotal}
Items:${itemsSummary}`;

        const qr = await QRCode.toDataURL(qrPayload, { margin: 1 });
        doc.image(qr, 420, 140, { width: 80 });
      } catch {
        /* QR optional */
      }

      /* ================= FOOTER ================= */
      doc
        .fontSize(8)
        .text(
          "This is a computer-generated invoice. No signature required.",
          40,
          770,
          { width: 520, align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
