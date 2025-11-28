import express from "express";
// import PDFDocument from "pdfkit";
import { verifyUserCookie } from "../middlewares/verifyUser.js";
import Order from "../models/Order.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
const router = express.Router();

// GET /api/orders/invoice/:orderId
// router.get("/invoice/:orderId", verifyUserCookie, async (req, res) => {
//   const order = await Order.findById(req.params.orderId)
//     .populate("items.product")
//     .populate("user", "name email");

//   if (!order) return res.status(404).json({ success: false });

//   const pdfBuffer = await generateInvoice(order, order.user);

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename=Invoice_${order._id}.pdf`
//   );

//   return res.end(pdfBuffer);
// });
router.get("/orders/:id/invoice", verifyUserCookie, async (req, res) => {
  const order = await Order.findById(req.params.orderId).lean();
  if (!order) return res.status(404).send("Order not found");

  // optional company overrides
  const company = {
    name: "AZ-Store shop.",
    tag: "myazstore.shop",
    addr: "Shop-Nagmatia, PS-Madanpur, Dist-Aurangabad, Bihar - 824208",
    email: "support@myazstore.shop",
    phone: "+91 7563092029",
  };

  // choose style via query ?style=amazon or ?style=flipkart
  const style = req.query.style === "amazon" ? "amazon" : "flipkart";

  await generateInvoicePdf(res, order, {
    style,
    logoUrl: `${req.protocol}://${req.get("host")}/assets/logo.png`, // serve logo publicly
    company,
    footerNote: "Please keep this invoice for your records.",
  });
});

export default router;

// router.get(
//   "/api/orders/invoice/:orderId",
//   verifyUserCookie,
//   async (req, res) => {
//     try {
//       const { orderId } = req.params;

//       const order = await Order.findById(orderId)
//         .populate("items.product")
//         .populate("user");

//       if (!order)
//         return res
//           .status(404)
//           .json({ success: false, message: "Order not found" });

//       // Setup PDF Stream
//       const doc = new PDFDocument({ margin: 40 });

//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=Invoice-${orderId}.pdf`
//       );

//       doc.pipe(res);

//       /* =============================
//        HEADER SECTION
//     ============================== */
//       doc.rect(0, 0, doc.page.width, 60).fill("#2563eb");
//       doc
//         .fontSize(20)
//         .font("Helvetica-Bold")
//         .text("MyAZStore", { align: "center" })
//         .moveDown(0.3);

//       doc
//         .fontSize(12)
//         .font("Helvetica")
//         .text("Official Invoice", { align: "center" })
//         .moveDown(1);

//       /* =============================
//        ORDER INFO
//     ============================== */
//       doc
//         .fontSize(12)
//         .font("Helvetica-Bold")
//         .text("Order Details")
//         .moveDown(0.5);

//       doc.font("Helvetica").fontSize(11);
//       doc.text(`Order ID: ${order._id}`);
//       doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
//       doc.text(`Payment ID: ${order.paymentInfo.paymentId}`);
//       doc.text(`Status: ${order.status}`);
//       doc.moveDown(1);

//       /* =============================
//        CUSTOMER INFO
//     ============================== */
//       doc.fontSize(12).font("Helvetica-Bold").text("Customer").moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .fontSize(11)
//         .text(`${order.user.name}`)
//         .text(`${order.user.email}`)
//         .moveDown(1);

//       /* =============================
//        ITEMS TABLE
//     ============================== */
//       doc.font("Helvetica-Bold").text("Items", { underline: true });
//       doc.moveDown(0.5);

//       doc.fontSize(11).font("Helvetica");

//       order.items.forEach((item) => {
//         doc.text(`${item.product.name} — Qty: ${item.qty} — ₹${item.price}`, {
//           lineGap: 4,
//         });
//       });

//       doc.moveDown(1);

//       /* =============================
//        TOTAL SUMMARY
//     ============================== */
//       doc.font("Helvetica-Bold").text("Total Amount:");
//       doc.font("Helvetica").text(`₹${order.totalAmount}`);

//       doc.end();
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ success: false, message: "PDF creation failed" });
//     }
//   }
// );

// export default router;
