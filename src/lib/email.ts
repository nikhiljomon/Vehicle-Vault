import nodemailer from "nodemailer";
import { formatDate } from "./utils";

interface SendReminderEmailParams {
  to: string;
  userName?: string | null;
  vehicleName: string;
  registrationNumber: string;
  documentType: string;
  expiryDate: Date | string;
  daysRemaining: number;
}

export async function sendExpiryReminderEmail({
  to,
  userName,
  vehicleName,
  registrationNumber,
  documentType,
  expiryDate,
  daysRemaining,
}: SendReminderEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"VehicleVault" <no-reply@vehiclevault.local>';

  const formattedDate = formatDate(expiryDate);
  const isExpired = daysRemaining < 0;
  const isToday = daysRemaining === 0;

  const subject = isExpired
    ? `⚠️ URGENT: ${documentType} for ${vehicleName} has expired!`
    : isToday
    ? `🚨 TODAY: ${documentType} for ${vehicleName} expires today!`
    : `⏰ Reminder: ${documentType} for ${vehicleName} expires in ${daysRemaining} days`;

  const statusColor = isExpired ? "#ef4444" : isToday ? "#f59e0b" : "#3b82f6";
  const statusHeadline = isExpired
    ? "Document Has Expired"
    : isToday
    ? "Expires Today"
    : `Expires in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                🚗 VehicleVault
              </h1>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Document Expiry Alert</p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 24px 32px 12px;">
              <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 14px 18px; border-radius: 6px;">
                <span style="color: ${statusColor}; font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${statusHeadline}
                </span>
                <p style="margin: 6px 0 0; color: #334155; font-size: 14px; line-height: 1.5;">
                  Hi ${userName || "Vehicle Owner"}, this is an automated reminder regarding your vehicle compliance document.
                </p>
              </div>
            </td>
          </tr>

          <!-- Vehicle & Document Details -->
          <tr>
            <td style="padding: 12px 32px 24px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #f1f5f9; border-radius: 8px; background-color: #f8fafc; font-size: 14px;">
                <tr>
                  <td style="color: #64748b; width: 40%; font-weight: 500;">Vehicle:</td>
                  <td style="color: #0f172a; font-weight: 600;">${vehicleName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 500;">Registration No.:</td>
                  <td style="color: #0f172a; font-weight: 600; font-family: monospace; font-size: 15px;">${registrationNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 500;">Document Type:</td>
                  <td style="color: #0f172a; font-weight: 600;">${documentType}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 500;">Expiry Date:</td>
                  <td style="color: ${statusColor}; font-weight: 700;">${formattedDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                Open VehicleVault & Renew
              </a>
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                Renew early to avoid traffic penalties and lapses in coverage.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                Sent automatically by VehicleVault. You can customize reminder windows in your Settings.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // If no SMTP configured, log to terminal for local testing
  if (!user || !pass || host === "localhost") {
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    return { success: false, error };
  }
}
