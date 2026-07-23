// Transactional auth emails (verification, password reset) — separate from
// notification.service.js, which handles trading-signal alerts. Different
// concern and templates.
//
// Uses Resend's HTTP API rather than nodemailer/SMTP: Render blocks/throttles
// outbound SMTP to Gmail at the network level (confirmed in production via
// repeated "Connection timeout" errors), but HTTPS to Resend's API is
// unaffected. Without a verified sending domain, Resend only delivers to the
// email address the Resend account itself was created with — verify a
// domain in the Resend dashboard to send to arbitrary registered users.
const { Resend } = require("resend");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "TRADEX <onboarding@resend.dev>";

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
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async sendVerificationEmail(user, token) {
    if (!this.resend) {
      console.warn("⚠️ RESEND_API_KEY not set — skipping verification email");
      return { success: false, error: "Email not configured" };
    }

    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    try {
      const { error } = await this.resend.emails.send({
        from: FROM_EMAIL,
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
      if (error) throw new Error(error.message || "Resend API error");
      console.log(`✅ Verification email sent to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Verification email error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!this.resend) {
      console.warn("⚠️ RESEND_API_KEY not set — skipping reset email");
      return { success: false, error: "Email not configured" };
    }

    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    try {
      const { error } = await this.resend.emails.send({
        from: FROM_EMAIL,
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
      if (error) throw new Error(error.message || "Resend API error");
      console.log(`✅ Password reset email sent to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Password reset email error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
