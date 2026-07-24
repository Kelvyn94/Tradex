/**
 * Data Engine Routes
 * Exposes Data Engine API endpoints to frontend
 */

const express = require("express");
const router = express.Router();
const dataEngineService = require("../services/dataEngine.service");

// Get AI Insights
router.get("/insights", async (req, res) => {
  try {
    const { asset, limit } = req.query;
    const result = await dataEngineService.getInsights(asset, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate new insights
router.post("/insights/generate", async (req, res) => {
  try {
    const { asset } = req.body;
    const result = await dataEngineService.generateInsights(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading signals
router.get("/signals", async (req, res) => {
  try {
    const { asset, limit } = req.query;
    const result = await dataEngineService.getSignals(asset, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market data
router.get("/candles/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { timeframe, limit } = req.query;
    const result = await dataEngineService.getCandles(asset, timeframe, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest price
router.get("/price/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await dataEngineService.getLatestPrice(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get correlation matrix
router.get("/correlation", async (req, res) => {
  try {
    const result = await dataEngineService.getCorrelation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ICT analysis
router.get("/ict/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await dataEngineService.getICT(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary
router.get("/summary", async (req, res) => {
  try {
    const result = await dataEngineService.getSummary();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CFTC COT positioning (Commercial vs Non-Commercial vs small traders)
router.get("/cot", async (req, res) => {
  try {
    const result = await dataEngineService.getCOTPositioning();
    res.json(result);
  } catch (error) {
    // The Data Engine returns 503 when positioning is genuinely
    // unavailable (no data for any tracked asset) - propagate that
    // distinct status rather than flattening everything to 500, so the
    // frontend can render an explicit "unavailable" state instead of a
    // generic error.
    const status = error.response?.status === 503 ? 503 : 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

// Get DXY / 10Y Treasury yield / VIX macro regime snapshot
router.get("/macro", async (req, res) => {
  try {
    const result = await dataEngineService.getMacroRegime();
    res.json(result);
  } catch (error) {
    const status = error.response?.status === 503 ? 503 : 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

// Run a backtest
router.post("/backtest/run", async (req, res) => {
  try {
    const result = await dataEngineService.runBacktest(req.body);
    res.json(result);
  } catch (error) {
    // Propagate the Data Engine's actual status (400 bad params, 503 no
    // data, 422 engine error) instead of flattening everything to 500.
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

module.exports = router;
