// Transactional auth emails (verification, password reset) — separate from
// notification.service.js, which handles trading-signal alerts. Different
// concern and templates, same Gmail/nodemailer transporter setup.
const nodemailer = require("nodemailer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function emailShell(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0; border-radius: 10px;">
      <h1 style="color: #00d4ff; text-align: center;">TRADEX</h1>
      ${bodyHtml}
      <p style="color:#6c757d;font-size:12px;text-align:center;margin-top:24px;">${title}</p>
    </div>
  `;
}

class EmailService {
  constructor() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  async sendVerificationEmail(user, token) {
    if (!this.transporter) {
      console.warn("⚠️ EMAIL_USER/EMAIL_PASS not set — skipping verification email");
      return { success: false, error: "Email not configured" };
    }

    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Verify your TRADEX email",
        html: emailShell(
          "This link expires in 24 hours. If you didn't create a TRADEX account, you can ignore this email.",
          `
            <p>Hi ${user.username},</p>
            <p>Confirm your email address to finish setting up your account.</p>
            <p style="text-align:center; margin: 24px 0;">
              <a href="${link}" style="background:#00d4ff;color:#0a0a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify Email</a>
            </p>
          `,
        ),
      });
      console.log(`✅ Verification email sent to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Verification email error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!this.transporter) {
      console.warn("⚠️ EMAIL_USER/EMAIL_PASS not set — skipping reset email");
      return { success: false, error: "Email not configured" };
    }

    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset your TRADEX password",
        html: emailShell(
          "This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.",
          `
            <p>Hi ${user.username},</p>
            <p>We received a request to reset your password. Click below to choose a new one.</p>
            <p style="text-align:center; margin: 24px 0;">
              <a href="${link}" style="background:#00d4ff;color:#0a0a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
            </p>
          `,
        ),
      });
      console.log(`✅ Password reset email sent to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Password reset email error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
