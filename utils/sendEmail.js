// utils/sendEmail.js
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || `${SMTP_USER}`;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn(
    "sendEmail: SMTP credentials not set. Please set SMTP_EMAIL and SMTP_PASS in .env"
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Send an email via SMTP.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
export async function sendEmail({ to, subject, html }) {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP credentials not configured");
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });

  return info;
}
