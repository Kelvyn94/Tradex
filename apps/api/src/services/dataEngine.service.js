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
      timeout: 5000,
    });
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
}

module.exports = new DataEngineService();
