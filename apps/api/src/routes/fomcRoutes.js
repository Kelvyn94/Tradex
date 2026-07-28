/**
 * FOMC outcome route. See fomc.service.js for the rate-decision +
 * hawkish/dovish classification logic. Unauthenticated, like the other
 * market-data routes (dataEngineRoutes, economicCalendarRoutes,
 * smtRoutes) - not tied to any user's account.
 */

const express = require("express");
const router = express.Router();
const fomcService = require("../services/fomc.service");

router.get("/latest", async (req, res) => {
  try {
    const outcome = await fomcService.getLatestOutcome();
    res.json({ success: true, data: outcome });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
