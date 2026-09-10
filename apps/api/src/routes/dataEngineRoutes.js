/**
 * Data Engine Routes
 * Exposes Data Engine API endpoints to frontend
 */
const express = require("express");
const router = express.Router();
const dataEngineService = require("../services/dataEngine.service");
const cacheMiddleware = require("../middleware/cache");

// Get AI Insights (Cache 15 mins)
router.get("/insights", cacheMiddleware(900), async (req, res) => {
  try {
    const { asset, limit } = req.query;
    const result = await dataEngineService.getInsights(asset, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate new insights (POST - uncached)
router.post("/insights/generate", async (req, res) => {
  try {
    const { asset } = req.body;
    const result = await dataEngineService.generateInsights(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading signals (Cache 10 mins)
router.get("/signals", cacheMiddleware(600), async (req, res) => {
  try {
    const { asset, limit } = req.query;
    const result = await dataEngineService.getSignals(asset, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market data candles (Cache 1 min)
router.get("/candles/:asset", cacheMiddleware(60), async (req, res) => {
  try {
    const { asset } = req.params;
    const { timeframe, limit } = req.query;
    const result = await dataEngineService.getCandles(asset, timeframe, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest price (Uncached for live data)
router.get("/price/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await dataEngineService.getLatestPrice(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get correlation matrix (Cache 1 hour)
router.get("/correlation", cacheMiddleware(3600), async (req, res) => {
  try {
    const result = await dataEngineService.getCorrelation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ICT analysis (Cache 5 mins)
router.get("/ict/:asset", cacheMiddleware(300), async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await dataEngineService.getICT(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary (Cache 30 mins)
router.get("/summary", cacheMiddleware(1800), async (req, res) => {
  try {
    const result = await dataEngineService.getSummary();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CFTC COT positioning (Cache 2 hours)
router.get("/cot", cacheMiddleware(7200), async (req, res) => {
  try {
    const result = await dataEngineService.getCOTPositioning();
    res.json(result);
  } catch (error) {
    const status = error.response?.status === 503 ? 503 : 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

// Get DXY / 10Y Treasury yield / VIX macro regime snapshot (Cache 1 hour)
router.get("/macro", cacheMiddleware(3600), async (req, res) => {
  try {
    const result = await dataEngineService.getMacroRegime();
    res.json(result);
  } catch (error) {
    const status = error.response?.status === 503 ? 503 : 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

// Run a backtest (POST - uncached)
router.post("/backtest/run", async (req, res) => {
  try {
    const result = await dataEngineService.runBacktest(req.body);
    res.json(result);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.response?.data?.detail || error.message });
  }
});

module.exports = router;
