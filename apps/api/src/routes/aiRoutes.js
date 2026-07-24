/**
 * AI Routes - Groq AI Integration
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
// IMPORTANT: Add this line to fix "aiService is not defined"
const aiService = require("../services/ai.service");
const NotificationService = require("../services/notification.service");
const auth = require("../middleware/auth");

// Health check for AI routes
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Groq AI",
    model: "llama-3.3-70b-versatile",
    timestamp: new Date().toISOString(),
  });
});

// Chat with AI
router.post("/chat", aiController.chat);

// Get market status
router.get("/market-status", async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getUTCHours();
    // Market open: 8:00 AM - 5:00 PM EST (13:00 - 22:00 UTC)
    const isMarketOpen = hour >= 13 && hour <= 22;
    res.json({
      status: "open",
      timestamp: now.toISOString(),
      isMarketOpen: isMarketOpen,
      message: isMarketOpen ? "Market is open" : "Market is closed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a test push/email notification to the authenticated user.
// notification.service.js's sendTestNotification was fully implemented but
// never had a route wired to it — the Settings page's "Send Test" button
// has always 404'd as a result.
router.post("/test-notification", auth, async (req, res) => {
  try {
    const result = await NotificationService.sendTestNotification(req.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint for AI
router.post("/test", async (req, res) => {
  try {
    const { message } = req.body;
    const result = await aiService.getChatResponse([
      { role: "user", content: message || "Hello, how are you?" },
    ]);
    res.json({
      success: true,
      response: result.content,
      model: result.model,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
