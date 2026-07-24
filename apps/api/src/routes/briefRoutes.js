/**
 * Daily/weekly market brief route. See brief.service.js for the
 * templated composition logic. Unauthenticated, like the other
 * market-data routes (dataEngineRoutes, economicCalendarRoutes) - not
 * tied to any user's account.
 */

const express = require("express");
const router = express.Router();
const { generateBrief } = require("../services/brief.service");

router.get("/", async (req, res) => {
  try {
    const period = req.query.period === "weekly" ? "weekly" : "daily";
    const brief = await generateBrief(period);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
