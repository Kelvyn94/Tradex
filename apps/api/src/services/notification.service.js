// Backend/src/services/notification.service.js
// Using ntfy + Email (no Twilio)
const axios = require("axios");
const nodemailer = require("nodemailer");
const User = require("../models/User");

class NotificationService {
  constructor() {
    this.ntfyTopic = process.env.NTFY_TOPIC || "TRADEX_SIGNALS";
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

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

  async sendNtfyAlert(userId, signal) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: "User not found" };

      const userTopic = `tradex_${user.username.toLowerCase()}`;
      const message = this.formatSignalMessage(signal);

      await axios.post(`https://ntfy.sh/${userTopic}`, message, {
        headers: {
          Title: "📊 TRADEX Signal",
          Priority: signal.confidence > 80 ? "urgent" : "high",
          Tags: "chart_with_upwards_trend",
          Click: this.frontendUrl,
          Markdown: "yes",
        },
        timeout: 5000,
      });

      console.log(`✅ ntfy alert sent to ${user.username}`);
      return { success: true, method: "ntfy" };
    } catch (error) {
      console.error("❌ ntfy error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEmail(userId, signal) {
    try {
      const user = await User.findById(userId);
      if (!user || !this.transporter) return { success: false };

      const html = this.formatEmailMessage(signal);

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `📊 TRADEX Signal: ${signal.action} ${signal.instrument}`,
        html,
      });

      console.log(`✅ Email sent to ${user.email}`);
      return { success: true, method: "email" };
    } catch (error) {
      console.error("❌ Email error:", error.message);
      return { success: false };
    }
  }

  async sendSignal(userId, signal) {
    const results = [];
    const ntfyResult = await this.sendNtfyAlert(userId, signal);
    results.push(ntfyResult);
    const emailResult = await this.sendEmail(userId, signal);
    results.push(emailResult);
    return {
      success: results.some((r) => r.success),
      results,
    };
  }

  async sendTestNotification(userId) {
    const testSignal = {
      action: "TEST",
      instrument: "XAUUSD",
      entry: 2345.67,
      takeProfits: [2360.0, 2375.0, 2400.0],
      stopLoss: 2335.0,
      riskReward: 3.2,
      confidence: 95,
      reasoning: "🎯 Your TRADEX notifications are working!",
    };
    return await this.sendSignal(userId, testSignal);
  }

  formatSignalMessage(signal) {
    let message = `📊 **TRADEX Signal**\n\n`;
    message += `📌 **${signal.action}** ${signal.instrument}\n`;
    if (signal.entry) message += `📍 **Entry:** ${signal.entry}\n`;
    if (signal.takeProfits)
      message += `🎯 **TP:** ${signal.takeProfits.join(", ")}\n`;
    if (signal.stopLoss) message += `🛑 **SL:** ${signal.stopLoss}\n`;
    if (signal.riskReward) message += `📊 **R:R:** ${signal.riskReward}:1\n`;
    if (signal.confidence)
      message += `🎯 **Confidence:** ${signal.confidence}%\n`;
    if (signal.reasoning) message += `\n📝 ${signal.reasoning}\n`;
    message += `\n⏰ ${new Date().toLocaleString()}`;
    return message;
  }

  formatEmailMessage(signal) {
    return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0; border-radius: 10px;">
                <h1 style="color: #00d4ff; text-align: center;">TRADEX Signal</h1>
                <div style="background: #212529; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Action:</strong> <span style="color: ${signal.action === "BUY" ? "#00e676" : "#ff3d57"}">${signal.action}</span></p>
                    <p><strong>Instrument:</strong> ${signal.instrument}</p>
                    ${signal.entry ? `<p><strong>Entry:</strong> ${signal.entry}</p>` : ""}
                    ${signal.takeProfits ? `<p><strong>Take Profit:</strong> ${signal.takeProfits.join(", ")}</p>` : ""}
                    ${signal.stopLoss ? `<p><strong>Stop Loss:</strong> ${signal.stopLoss}</p>` : ""}
                    ${signal.riskReward ? `<p><strong>Risk:Reward:</strong> ${signal.riskReward}:1</p>` : ""}
                    ${signal.confidence ? `<p><strong>Confidence:</strong> ${signal.confidence}%</p>` : ""}
                    ${signal.reasoning ? `<p><strong>Reasoning:</strong> ${signal.reasoning}</p>` : ""}
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 12px;">
                    ${new Date().toLocaleString()}
                </p>
            </div>
        `;
  }
}

module.exports = new NotificationService();
