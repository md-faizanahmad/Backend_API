// generateInvoicePdf.js — FIXED ALIGNMENT (2025)
import PDFDocument from "pdfkit";
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

// MAKE THIS FUNCTION async — call with await generateInvoicePdf(res, order)
export async function generateInvoicePdf(res, order) {
  const orderId = order._id.toString();
  const doc = new PDFDocumentWithTables({
    size: "A4",
    margin: 25,
    bufferPages: true,
  });

  // Headers for download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${orderId}.pdf`
  );
  doc.pipe(res);

  // page metrics (dynamic instead of many magic numbers)
  const pageWidth = doc.page.width;
  const pageMargin = doc.page.margins.left; // left and right margins are same
  const usableWidth = pageWidth - pageMargin * 2;

  // header positions
  const leftX = pageMargin + 10; // logo / left column
  const rightBoxWidth = 180;
  const rightBoxX = pageMargin + usableWidth - rightBoxWidth; // right aligned box
  const headerTop = 25;

  // ===================== HEADER =====================
  // Logo (left)
  try {
    doc.image(path.join(__dirname, "logo.png"), leftX, headerTop, {
      width: 70,
    });
  } catch (err) {
    // ignore missing logo
  }

  // Company name (placed left of logo vertically centered with logo)
  doc
    .font("Times-Roman")
    .fontSize(20)
    .fillColor("#1a1a1a")
    .text(COMPANY.name, leftX + 60, headerTop + 8);

  // Tagline / small info
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666")
    .text("Fashion • Electronics • Lifestyle", leftX + 60, headerTop + 30);

  // Company address & contact (stacked)
  doc
    .fontSize(9)
    .fillColor("#444")
    .text(COMPANY.address, leftX + 60, headerTop + 45, { width: 260 })
    .text(`${COMPANY.email} • ${COMPANY.phone}`, leftX + 60, headerTop + 66, {
      width: 260,
    });

  // TAX INVOICE Box (Right) — draw filled rect then stroke for consistent look
  doc
    .save()
    .rect(rightBoxX, headerTop - 2, rightBoxWidth, 100)
    .fill("#f8f9fa")
    .stroke("#e0e0e0")
    .restore();

  // TAX INVOICE title inside the box (left padding inside box)
  doc
    .font("Courier")
    .fontSize(18)
    .fillColor("#d32f2f")
    .text("TAX INVOICE", rightBoxX + 10, headerTop + 6, {
      width: rightBoxWidth - 20,
      align: "left",
    });

  // Compute invoice values
  const invNo = `INV-${new Date(order.createdAt).getFullYear()}-${orderId
    .slice(-6)
    .toUpperCase()}`;

  // Put Invoice labels & values in the box, right aligned within a defined width
  const infoX = rightBoxX + 10;
  const infoWidth = rightBoxWidth - 20;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#333")
    .text("Invoice No:", infoX, headerTop + 36, {
      width: infoWidth,
      align: "left",
    })
    .text("Date:", infoX, headerTop + 50, { width: infoWidth, align: "left" })
    .text("GSTIN:", infoX, headerTop + 64, { width: infoWidth, align: "left" });

  doc
    .font("Helvetica")
    .fillColor("#000")
    // right-align the values by using the same width but align:'right'
    .text(invNo, infoX, headerTop + 36, { width: infoWidth, align: "right" })
    .text(
      new Date(order.createdAt).toLocaleDateString("en-IN"),
      infoX,
      headerTop + 50,
      {
        width: infoWidth,
        align: "right",
      }
    )
    .text(COMPANY.gstin, infoX, headerTop + 64, {
      width: infoWidth,
      align: "right",
    });

  // Divider Line (full width under header)
  const dividerY = headerTop + 105;
  doc
    .moveTo(pageMargin + 10, dividerY)
    .lineTo(pageWidth - pageMargin - 10, dividerY)
    .lineWidth(2)
    .strokeColor("#1976d2")
    .stroke();

  // ===================== BILL TO / SHIP TO =====================
  const s = order.shippingAddress || {};
  const customerName = order.user?.name || s.fullName || "Customer";

  // We'll let pdfkit-table manage vertical placement but supply a clean y that sits under divider
  const billY = dividerY + 20;
  await doc.table(
    {
      headers: ["Bill To", "Ship To"],
      rows: [
        [
          `${customerName}\n${s.phone || "N/A"}\n${s.street || ""}\n${
            s.city || ""
          }, ${s.state || ""} - ${s.pincode || ""}`,
          `${s.fullName || customerName}\n${s.phone || "N/A"}\n${
            s.street || ""
          }${s.landmark ? "\nLandmark: " + s.landmark : ""}\n${s.city || ""}, ${
            s.state || ""
          } - ${s.pincode || ""}`,
        ],
      ],
    },
    {
      x: 40, // ← Add this line
      y: billY,
      width: 500, // ← Add this line
      padding: 10,
      headerBackgroundColor: "#1976d2",
      headerTextColor: "#fff",
      fontSize: 10,
      // Remove columnWidths completely → auto 50-50 split
    }
  );

  let currY = doc.y + 18;

  // ===================== ORDER DETAILS =====================
  await doc.table(
    {
      headers: [
        "Order ID",
        "Order Date",
        "Payment ID",
        "Status",
        "Expected Delivery",
      ],
      rows: [
        [
          `#${orderId}`,
          new Date(order.createdAt).toLocaleDateString("en-IN"),
          order.paymentInfo?.paymentId || "N/A",
          order.paymentInfo?.status === "completed" ? "Paid" : "Paid",
          estimateDelivery(order.createdAt),
        ],
      ],
    },
    {
      y: currY,
      padding: 8,
      columnWidths: [110, 50, 120, 40, null], // null = auto stretch last column
      headerBackgroundColor: "#444",
      headerTextColor: "#fff",
      fontSize: 9.5,
    }
  );

  currY = doc.y + 18;

  // ===================== ITEMS TABLE =====================
  const itemsRows = order.items.map((it, i) => {
    const p = typeof it.product === "object" ? it.product : {};
    const rate = Number(it.price).toFixed(2);
    const amount = (it.qty * it.price).toFixed(2);
    return [
      (i + 1).toString(),
      p.name || "Product Name",
      p.hsn || "9999",
      it.qty.toString(),
      `${INR}${parseFloat(rate).toLocaleString("en-IN")}`,
      `${INR}${parseFloat(amount).toLocaleString("en-IN")}`,
    ];
  });

  await doc.table(
    {
      headers: ["S.No", "Description", "HSN", "Qty", "Rate", "Amount"],
      rows: itemsRows,
    },
    {
      y: currY,
      padding: 8,
      columnWidths: [20, usableWidth * 0.45, 60, 42, 70, 90],
      align: ["center", "left", "center", "center", "right", "right"],
      headerBackgroundColor: "#1565c0",
      headerColor: "#fff",
      fontSize: 9,
    }
  );

  currY = doc.y + 18;

  // ===================== PAYMENT SUMMARY (Right Side) =====================
  const subtotal = order.items.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = order.discount || 0;
  const shipping = order.shippingCharges || 0;
  const tax =
    typeof order.tax === "number" ? order.tax : Math.round(subtotal * 0.18);
  const total = order.totalAmount ?? subtotal + shipping + tax - discount;

  const summaryRows = [
    [
      "Subtotal",
      `${INR}${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ],
    ...(discount > 0
      ? [
          [
            "Discount",
            `-${INR}${discount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`,
          ],
        ]
      : []),
    ...(shipping > 0
      ? [
          [
            "Shipping Charges",
            `${INR}${shipping.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`,
          ],
        ]
      : []),
    [
      "GST (18%)",
      `${INR}${tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ],
    ["", ""],
    [
      "Grand Total",
      `${INR}${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ],
  ];

  // Place summary on the right half of the page, aligned to the right margin
  // QR
  // QR Code (UPI) — place below invoice text but inside the right box if space allows
  try {
    const upiLink = `upi://pay?pa=azstore@oksbi&pn=AZStore&am=${order.totalAmount}&cu=INR&tn=Payment%20for%20Order%20${orderId}`;
    const qrData = await QRCode.toDataURL(upiLink, {
      margin: 10,
      left: 10,
      width: 256,
    });
    // place QR on the right edge, but leave padding
    const qrSize = 76;
    const qrX = rightBoxX + (rightBoxWidth - qrSize) / 2;
    const qrY = headerTop + 120;
    doc.image(qrData, qrX, qrY, { width: qrSize, height: qrSize });
    doc
      .fontSize(7)
      .fillColor("#555")
      .text("Scan & Pay", qrX, qrY + qrSize + 4, {
        width: qrSize,
        align: "center",
      });
  } catch (err) {
    // fallback: small stroked box and label — positioned inside right box area
    const fbX = rightBoxX + (rightBoxWidth - 60) / 2;
    const fbY = headerTop + 78;
    doc.rect(fbX, fbY, 60, 60).stroke("#ccc");
    doc
      .fontSize(8)
      .text("QR Error", fbX, fbY + 24, { width: 60, align: "center" });
  }

  const summaryX = pageMargin + usableWidth - 320;
  await doc.table(
    {
      headers: ["Tax", "Amount"],
      rows: summaryRows,
    },
    {
      x: summaryX,
      y: currY,
      padding: 8,
      columnWidths: [180, 120],
      align: ["left", "right"],
      headerBackgroundColor: "#d32f2f",
      headerColor: "#fff",
      fontSize: 10,
      rowOptions: (rowIndex) =>
        rowIndex === summaryRows.length - 1
          ? {
              fontSize: 14,
              bold: true,
              backgroundColor: "#fff8f8",
              color: "#d32f2f",
            }
          : {},
    }
  );

  currY = doc.y + 30;

  // ===================== BANK DETAILS & TERMS =====================
  doc
    .fontSize(9)
    .fillColor("#333")
    .text("Payment Details:", pageMargin + 10, currY)
    .font("Helvetica-Bold")
    .text(
      `${COMPANY.bank} | A/c: ${COMPANY.account} | IFSC: ${COMPANY.ifsc}`,
      pageMargin + 10,
      currY + 14,
      {
        width: usableWidth - 20,
      }
    );

  currY += 50;

  doc
    .fontSize(8.5)
    .fillColor("#555")
    .text(
      "• Goods once sold will not be taken back or exchanged.",
      pageMargin + 10,
      currY,
      { width: usableWidth - 20 }
    )
    .text(
      "• Subject to Mumbai Jurisdiction only.",
      pageMargin + 10,
      currY + 12,
      { width: usableWidth - 20 }
    )
    .text(
      "• This is a computer-generated invoice. No signature required.",
      pageMargin + 10,
      currY + 24,
      { width: usableWidth - 20 }
    );

  // ===================== FOOTER ON EVERY PAGE (Multi-page safe) =====================
  const footerText1 = "Thank you for shopping with AZ-Store!";
  const footerText2 =
    "For queries: support@myazstore.shop • This is a computer-generated invoice.";

  const addFooter = () => {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 55;
    doc
      .fontSize(9)
      .fillColor("#666")
      // center the footer by giving a width and align center
      .text(footerText1, pageMargin, footerY, {
        width: usableWidth,
        align: "center",
      })
      .text(footerText2, pageMargin, footerY + 12, {
        width: usableWidth,
        align: "center",
      });
  };

  // Add footer to existing buffered pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    addFooter();
  }

  // Add footer to any new page
  doc.on("pageAdded", addFooter);

  // Finalize
  doc.end();
}

// Helper
function estimateDelivery(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
