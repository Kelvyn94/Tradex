// Backend/src/routes/economicCalendarRoutes.js
const express = require("express");
const router = express.Router();
const EconomicCalendarService = require("../services/economicCalendar.service");

// Upcoming high-impact economic releases (NFP, CPI, PPI, GDP, PCE, Retail
// Sales, ISM Manufacturing) for the next ~90 days, via FRED.
router.get("/upcoming", async (req, res) => {
  try {
    const releases = await EconomicCalendarService.getUpcomingReleases();

    if (releases === null) {
      // Genuinely unavailable (no API key, or first-ever request failed
      // with nothing cached yet) - say so explicitly rather than
      // returning an empty array indistinguishable from "nothing scheduled."
      return res.status(503).json({
        success: false,
        error: "Economic calendar unavailable",
      });
    }

    res.json({
      success: true,
      data: releases,
      cacheAgeMs: EconomicCalendarService.getCacheAgeMs(),
    });
  } catch (error) {
    console.error("Economic calendar endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
