import nodemailer from "nodemailer";

export async function sendInvoiceEmail(to, orderId, pdfBuffer) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS, // App Password
    },
  });

  await transporter.sendMail({
    from: `"MyAZStore" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `Invoice for Order #${orderId}`,
    text: "Please find attached your order invoice.",
    attachments: [
      {
        filename: `Invoice_${orderId}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
