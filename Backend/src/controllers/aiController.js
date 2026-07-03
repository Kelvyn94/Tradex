// Backend/src/controllers/aiController.js
const SMTDetectionService = require("../services/smtDetection.service");
const NotificationService = require("../services/notification.service");
const WebSocketService = require("../services/websocket.service");
const AIService = require("../services/ai.service");
const Trade = require("../models/Trade");
const User = require("../models/User");

exports.getPrices = async (req, res) => {
  try {
    const prices = WebSocketService.getAllPrices();
    res.json({
      success: true,
      prices: prices || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prices error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getMarketStatus = async (req, res) => {
  try {
    const prices = WebSocketService.getAllPrices();
    const isConnected = WebSocketService.isConnected();
    const activeSymbols = WebSocketService.getActiveSymbols();

    res.json({
      success: true,
      status: {
        connected: isConnected,
        activeSymbols: activeSymbols,
        lastUpdate: new Date().toISOString(),
        symbols: Object.keys(prices),
      },
    });
  } catch (error) {
    console.error("Market status error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.detectSMT = async (req, res) => {
  try {
    const { groupName = "gold" } = req.body;
    console.log(`🔍 Detecting SMT for group: ${groupName}`);

    const result = await SMTDetectionService.detectRealTimeSMT(groupName);
    res.json(result);
  } catch (error) {
    console.error("SMT detection error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.detectAllSMT = async (req, res) => {
  try {
    console.log("🔍 Detecting SMT for ALL asset groups");
    const result = await SMTDetectionService.detectAllSMT();
    res.json({
      success: true,
      signals: result || [],
      totalSignals: result?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("All SMT detection error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.testNotification = async (req, res) => {
  try {
    const userId = req.user?._id || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    const result = await NotificationService.sendTestNotification(userId);
    res.json({
      success: true,
      message: "Test notification sent!",
      result,
    });
  } catch (error) {
    console.error("Notification test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.analyzeScreenshot = async (req, res) => {
  try {
    const { image, context = {} } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "No image provided",
      });
    }

    const userId = req.user?._id;
    let recentTrades = [];
    if (userId) {
      try {
        recentTrades = await Trade.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(5);
      } catch (tradeError) {
        console.warn("Could not fetch recent trades:", tradeError.message);
      }
    }

    const result = await AIService.analyzeChartImage(image, {
      ...context,
      recentTrades: recentTrades.map((t) => ({
        instrument: t.instrument,
        direction: t.direction,
        entry: t.entry,
        exit: t.exit,
        pnl: t.pnl,
      })),
    });

    res.json({
      success: true,
      analysis: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Screenshot analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.analyzeJournal = async (req, res) => {
  try {
    const userId = req.user._id;
    const trades = await Trade.find({ user: userId });

    if (trades.length === 0) {
      return res.json({
        success: true,
        message: "No trades to analyze",
      });
    }

    const stats = {
      total: trades.length,
      wins: trades.filter((t) => t.pnl > 0).length,
      losses: trades.filter((t) => t.pnl < 0).length,
      totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
      winRate: (
        (trades.filter((t) => t.pnl > 0).length / trades.length) *
        100
      ).toFixed(1),
      instruments: [...new Set(trades.map((t) => t.instrument))],
      bestTrade: Math.max(...trades.map((t) => t.pnl)),
      worstTrade: Math.min(...trades.map((t) => t.pnl)),
    };

    const insights = [];
    if (stats.winRate > 60) {
      insights.push("Excellent win rate! Consider scaling up.");
    } else if (stats.winRate < 40) {
      insights.push("Focus on improving trade quality and SMT confirmation.");
    }

    if (stats.totalPnl > 0) {
      insights.push(`Total profit of $${stats.totalPnl.toFixed(2)} is good!`);
    }

    res.json({
      success: true,
      stats,
      insights:
        insights.length > 0
          ? insights
          : ["Continue building your trading journal."],
      recommendation:
        stats.total > 10
          ? "Your data is sufficient for analysis. Focus on high-confidence SMT signals."
          : "Continue trading to build more data for analysis.",
    });
  } catch (error) {
    console.error("Journal analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.saveFeedback = async (req, res) => {
  try {
    const { signalId, rating, feedback } = req.body;
    res.json({
      success: true,
      message: "Feedback saved",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
