// Backend/src/routes/insightsRoutes.js
const express = require("express");
const router = express.Router();
const { getLatestDigest } = require("../services/dailyInsight.service");
const auth = require("../middleware/auth");

// Get the most recently generated daily ICT market digest
router.get("/daily", auth, async (req, res) => {
  try {
    const digest = await getLatestDigest();
    if (!digest) {
      return res
        .status(404)
        .json({ success: false, error: "No daily digest generated yet" });
    }
    res.json({ success: true, data: digest });
  } catch (error) {
    console.error("Daily digest endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
