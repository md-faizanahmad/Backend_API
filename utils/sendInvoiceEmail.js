// utils/sendEmail.js
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn(
    "sendEmail: SMTP credentials not set. Please set SMTP_EMAIL and SMTP_PASS"
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {Array}  [options.attachments]
 */
export async function sendInvoiceEmail({
  to,
  subject,
  html,
  attachments = [],
}) {
  if (!to) {
    throw new Error("sendEmail: recipient email (to) is required");
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    attachments, // ✅ THIS WAS MISSING
  });

  return info;
}
