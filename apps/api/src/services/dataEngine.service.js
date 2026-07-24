/**
 * Data Engine API Service
 * Connects TradeX Backend to Data Engine API
 */

const axios = require("axios");

const DATA_ENGINE_URL =
  process.env.DATA_ENGINE_URL || "https://tradex-data-engine.onrender.com";

class DataEngineService {
  constructor() {
    this.client = axios.create({
      baseURL: DATA_ENGINE_URL,
      // Render free tier spins the Data Engine down after ~15 min idle and
      // takes up to ~50s to wake on the next request. 15s covers a slow-but-
      // warm response; true cold starts still fail once, which is why
      // startKeepAlive() below pings it regularly to avoid full sleep.
      timeout: 15000,
    });
    this.keepAliveInterval = null;
  }

  // Pings the Data Engine's health endpoint periodically so it stays warm
  // between real user requests instead of spinning down and forcing the
  // next caller to eat a ~50s cold-start penalty.
  startKeepAlive(intervalMs = 600000) {
    const ping = () => {
      this.client.get("/health").catch(() => {
        // Expected while the instance is asleep and waking up; the next
        // scheduled ping (or a real request) will succeed once it's up.
      });
    };
    ping();
    this.keepAliveInterval = setInterval(ping, intervalMs);
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  // Get AI Insights
  async getInsights(asset = null, limit = 10) {
    const params = {};
    if (asset) params.asset = asset;
    if (limit) params.limit = limit;

    const response = await this.client.get("/api/v1/insights/latest", {
      params,
    });
    return response.data;
  }

  // Generate new insights
  async generateInsights(asset = null) {
    const params = {};
    if (asset) params.asset = asset;

    const response = await this.client.post("/api/v1/insights/generate", null, {
      params,
    });
    return response.data;
  }

  // Get latest signals
  async getSignals(asset = null, limit = 10) {
    const params = {};
    if (asset) params.asset = asset;
    if (limit) params.limit = limit;

    const response = await this.client.get("/api/v1/insights/signals/latest", {
      params,
    });
    return response.data;
  }

  // Get candles for an asset
  async getCandles(asset, timeframe = "daily", limit = 100) {
    const response = await this.client.get(`/api/v1/data/candles/${asset}`, {
      params: { timeframe, limit },
    });
    return response.data;
  }

  // Get latest price
  async getLatestPrice(asset) {
    const response = await this.client.get(`/api/v1/data/latest/${asset}`);
    return response.data;
  }

  // Get correlation matrix
  async getCorrelation() {
    const response = await this.client.get("/api/v1/correlation/matrix");
    return response.data;
  }

  // Get ICT analysis
  async getICT(asset) {
    const response = await this.client.get(`/api/v1/ict/analyze/${asset}`);
    return response.data;
  }

  // Get summary
  async getSummary() {
    const response = await this.client.get("/api/v1/insights/summary");
    return response.data;
  }

  // Get CFTC Commitment of Traders (Commercial vs Non-Commercial
  // positioning) for the tracked assets
  async getCOTPositioning() {
    const response = await this.client.get("/api/v1/cot/positioning");
    return response.data;
  }

  // Get DXY / 10Y Treasury yield / VIX macro regime snapshot
  async getMacroRegime() {
    const response = await this.client.get("/api/v1/macro/regime");
    return response.data;
  }

  // Run a backtest (strategy, assets, timeframe, date range/lookback,
  // strategy params) and return the engine's stats output
  async runBacktest(params) {
    const response = await this.client.post("/api/v1/backtest/run", params, {
      // Backtests over more history can take longer than the standard
      // 15s Data Engine timeout - give this one more room.
      timeout: 60000,
    });
    return response.data;
  }
}

module.exports = new DataEngineService();
