/**
 * Professional OTP Email Template – ES Modules Version
 * Perfect for shopping/e-commerce websites
 *
 * @param {string} otp                    - Your 6-digit OTP
 * @param {number} expiresInMinutes       - OTP validity (default: 10)
 * @param {string} brandName              - Your store name (default: "TrendyShop")
 * @param {string} primaryColor           - Optional hex color (default: #6366f1 = Indigo)
 * @returns {string} Full HTML email
 */

export const otpEmailTemplate = (
  otp,
  expiresInMinutes = 10,
  brandName = "TrendyShop",
  primaryColor = "#6366f1"
) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your ${brandName} Verification Code</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a !important; }
      .card { background: #1e293b !important; }
      .text { color: #e2e8f0 !important; }
      .text-muted { color: #94a3b8 !important; }
      .footer { background: #1a2332 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 30px 15px;">

        <!-- Main Card -->
        <table role="presentation" class="card" bgcolor="#ffffff" style="max-width: 520px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td align="center" style="padding: 40px 30px 30px; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustBrightness(
    primaryColor,
    -30
  )} 100%);">
              <h1 style="margin:0; color:#ffffff; font-size:30px; font-weight:700; letter-spacing:-0.5px;">
                ${brandName}
              </h1>
              <p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:15px;">
                Premium Fashion & Lifestyle
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 50px;">
              <h2 style="margin:40px 0 16px; font-size:26px; font-weight:600; color:#111827; text-align:center;">
                Verification Code
              </h2>
              <p class="text" style="font-size:16px; color:#4b5563; line-height:1.6; text-align:center; margin:0 0 40px;">
                Enter this code to securely complete your action
              </p>

              <!-- OTP Box -->
              <div style="text-align:center; margin:40px 0;">
                <div style="display:inline-block; background:#f8f9ff; border:3px dashed ${primaryColor}; border-radius:16px; padding:28px 40px;">
                  <div style="font-family: 'Courier New', monospace; font-size:44px; font-weight:800; letter-spacing:12px; color:${primaryColor};">
                    ${otp}
                  </div>
                </div>
              </div>

              <p class="text-muted" style="text-align:center; font-size:15px; color:#6b7280; margin:40px 0 0;">
                This code expires in <strong>${expiresInMinutes} minutes</strong><br>
                Never share this code with anyone — even ${brandName} staff won't ask for it.
              </p>

              <hr style="border:none; border-top:1px solid #e2e8f0; margin:50px 0 30px;" />

              <p class="text-muted" style="font-size:14px; color:#9ca3af; text-align:center; line-height:1.6;">
                Not expecting this email?<br>
                You can safely ignore it. Someone might have typed your email by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" bgcolor="#f1f5f9" style="padding:30px; text-align:center;">
              <p style="margin:0; font-size:13px; color:#94a3b8;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.<br>
                <span style="color:#cbd5e1;">Secure • Fast • Trusted Worldwide</span>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Helper: darken color for gradient (simple version)
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
