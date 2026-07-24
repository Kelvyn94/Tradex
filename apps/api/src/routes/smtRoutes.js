/**
 * SMT Signal Routes
 *
 * Exposes the signal history smtDetection.service.js already accumulates
 * from the real auto-scan (websocket.service.js, every 5 minutes) - this
 * data previously only left the backend as push notifications
 * (notification.service.js), with no way to see it in-app. No auth
 * requirement, matching dataEngineRoutes.js: these are global market
 * signals, not tied to any specific user's account.
 */

const express = require("express");
const router = express.Router();
const smtDetectionService = require("../services/smtDetection.service");

router.get("/signals", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const signals = smtDetectionService.getSignalHistory(limit).reverse();
    res.json({ data: signals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", (req, res) => {
  try {
    res.json({ data: smtDetectionService.getStats() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
