// Backend/src/services/notification.service.js
const axios = require("axios");
const User = require("../models/User");

class NotificationService {
  constructor() {
    this.ntfyTopic = process.env.NTFY_TOPIC || "TRADEX_SIGNALS";
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  }

  /**
   * Send notification via ntfy (Primary)
   * FREE - No limits, works on all devices
   */
  async sendNtfyAlert(userId, signal) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Create unique topic per user for privacy
      const userTopic = `tradex_${user.username.toLowerCase()}`;

      // Format the message
      const message = this.formatSignalMessage(signal);

      // Build headers - SIMPLIFIED without actions
      const headers = {
        Title: "📊 TRADEX AI Signal",
        Priority: this.getPriority(signal.confidence || 70),
        Tags: this.getTags(signal),
        Click: this.frontendUrl,
        Markdown: "yes",
      };

      // Only add actions if signal has entry price (valid trade signal)
      if (signal.entry && signal.action !== "TEST") {
        headers["Actions"] = JSON.stringify([
          {
            action: "view",
            label: "📈 View in TRADEX",
            url: this.frontendUrl,
          },
          {
            action: "copy",
            label: "📋 Copy Signal",
            value: `${signal.action} ${signal.instrument} @ ${signal.entry}`,
          },
        ]);
      }

      console.log(`📤 Sending notification to ${userTopic}:`, signal.action);

      const response = await axios.post(
        `https://ntfy.sh/${userTopic}`,
        message,
        { headers },
      );

      console.log(`✅ Notification sent to ${user.username}`);
      return {
        success: true,
        method: "ntfy",
        topic: userTopic,
        response: response.data,
      };
    } catch (error) {
      console.error("❌ ntfy error:", error.response?.data || error.message);
      return {
        success: false,
        method: "ntfy",
        error: error.message,
        details: error.response?.data || null,
      };
    }
  }

  /**
   * Send notification via all available methods
   */
  async sendSignal(userId, signal) {
    const results = [];

    // Send via ntfy (Primary - Always)
    const ntfyResult = await this.sendNtfyAlert(userId, signal);
    results.push(ntfyResult);

    // Send via Web Push if available (Secondary)
    try {
      const user = await User.findById(userId);
      if (user?.webPushSubscription) {
        const webPushResult = await this.sendWebPush(user, signal);
        results.push(webPushResult);
      }
    } catch (error) {
      console.warn("WebPush not available:", error.message);
    }

    return {
      success: results.some((r) => r.success),
      results,
    };
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId) {
    const testSignal = {
      action: "TEST",
      instrument: "XAUUSD",
      entry: 2345.67,
      takeProfits: [2360.0, 2375.0, 2400.0],
      stopLoss: 2335.0,
      riskReward: 3.2,
      confidence: 95,
      reasoning:
        "🎯 Your TRADEX notifications are working! You will receive real trading signals here.",
    };

    return await this.sendNtfyAlert(userId, testSignal);
  }

  /**
   * Format signal message for notifications
   */
  formatSignalMessage(signal) {
    const action = signal.action || "ALERT";
    const instrument = signal.instrument || "XAUUSD";

    let message = `📊 **TRADEX Trading Signal**\n\n`;
    message += `📌 **${action}** ${instrument}\n`;

    if (signal.entry) {
      message += `📍 **Entry:** ${signal.entry}\n`;
    }

    if (signal.takeProfits && signal.takeProfits.length > 0) {
      message += `🎯 **Take Profit:** ${signal.takeProfits.join(", ")}\n`;
    }

    if (signal.stopLoss) {
      message += `🛑 **Stop Loss:** ${signal.stopLoss}\n`;
    }

    if (signal.riskReward) {
      message += `📊 **Risk:Reward:** ${signal.riskReward}:1\n`;
    }

    if (signal.confidence) {
      message += `🎯 **Confidence:** ${signal.confidence}%\n`;
    }

    if (signal.reasoning) {
      message += `\n📝 ${signal.reasoning}\n`;
    }

    message += `\n⏰ ${new Date().toLocaleString()}`;

    return message;
  }

  /**
   * Get priority based on confidence
   */
  getPriority(confidence) {
    if (confidence >= 85) return "urgent"; // Priority 5
    if (confidence >= 75) return "high"; // Priority 4
    if (confidence >= 60) return "default"; // Priority 3
    return "low"; // Priority 2
  }

  /**
   * Get tags based on signal type
   */
  getTags(signal) {
    const tags = ["chart_with_upwards_trend"];

    if (signal.action === "BUY") {
      tags.push("heavy_check_mark");
    } else if (signal.action === "SELL") {
      tags.push("warning");
    } else if (signal.action === "TEST") {
      tags.push("bell");
    }

    if (signal.instrument) {
      if (signal.instrument.includes("XAU")) tags.push("gold");
      if (signal.instrument.includes("EUR")) tags.push("euro");
      if (signal.instrument.includes("GBP")) tags.push("pound");
    }

    return tags.join(",");
  }

  /**
   * Send Web Push notification (Secondary)
   */
  async sendWebPush(user, signal) {
    // Placeholder for Web Push implementation
    // This will be implemented with PushForge later
    console.log(`🔔 WebPush would be sent to ${user.username}`);
    return { success: true, method: "webpush" };
  }
}

module.exports = new NotificationService();
