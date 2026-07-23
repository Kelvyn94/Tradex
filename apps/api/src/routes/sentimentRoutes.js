// Backend/src/routes/sentimentRoutes.js
const express = require("express");
const router = express.Router();
const SentimentService = require("../services/sentiment.service");
const auth = require("../middleware/auth");

// Get sentiment for an instrument
router.get("/:instrument", auth, async (req, res) => {
  try {
    const { instrument = "XAUUSD" } = req.params;
    const result = await SentimentService.getSentimentAnalysis(instrument);
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res
        .status(404)
        .json({ success: false, error: result.error || "No data available" });
    }
  } catch (error) {
    console.error("Sentiment endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear sentiment cache (optional admin route)
router.delete("/cache", auth, async (req, res) => {
  try {
    SentimentService.clearCache();
    res.json({ success: true, message: "Sentiment cache cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
