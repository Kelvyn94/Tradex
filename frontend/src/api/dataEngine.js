/**
 * Data Engine Frontend Service
 * Connects to TradeX Backend Data Engine routes
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const dataEngineApi = {
  // Get AI Insights
  getInsights: async (asset = null, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (asset) params.append("asset", asset);
      params.append("limit", limit);
      const response = await axios.get(
        `${API_URL}/api/data-engine/insights?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching insights:", error);
      return { data: [] };
    }
  },

  // Generate new insights
  generateInsights: async (asset = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/data-engine/insights/generate`,
        { asset },
      );
      return response.data;
    } catch (error) {
      console.error("Error generating insights:", error);
      return { data: [] };
    }
  },

  // Get trading signals
  getSignals: async (asset = null, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (asset) params.append("asset", asset);
      params.append("limit", limit);
      const response = await axios.get(
        `${API_URL}/api/data-engine/signals?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching signals:", error);
      return { data: [] };
    }
  },

  // Get candles
  getCandles: async (asset, timeframe = "daily", limit = 100) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/data-engine/candles/${asset}`,
        {
          params: { timeframe, limit },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching candles:", error);
      return null;
    }
  },

  // Get latest price
  getLatestPrice: async (asset) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/data-engine/price/${asset}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching price:", error);
      return null;
    }
  },

  // Get correlation matrix
  getCorrelation: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/data-engine/correlation`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching correlation:", error);
      return null;
    }
  },

  // Get ICT analysis
  getICT: async (asset) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/data-engine/ict/${asset}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching ICT:", error);
      return null;
    }
  },

  // Get summary
  getSummary: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/data-engine/summary`);
      return response.data;
    } catch (error) {
      console.error("Error fetching summary:", error);
      return null;
    }
  },
};

export default dataEngineApi;
