/**
 * AI Controller - Handles all AI-related API requests
 */

const aiService = require("../services/ai.service");

/**
 * Chat with AI Assistant
 */
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages) {
      return res.status(400).json({
        success: false,
        error: "Messages are required",
        hint: 'Send JSON like: {"messages":[{"role":"user","content":"Hello"}]}',
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages must be a non-empty array",
        hint: 'Send JSON like: {"messages":[{"role":"user","content":"Hello"}]}',
      });
    }

    const result = await aiService.getChatResponse(messages);

    if (result.success) {
      return res.json({
        success: true,
        response: result.content || result.response,
        model: result.model || "llama-3.3-70b-versatile",
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "AI service error",
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get AI market insights for an asset
 */
exports.getMarketInsights = async (req, res) => {
  try {
    const { asset } = req.params;

    if (!asset) {
      return res.status(400).json({
        success: false,
        error: "Asset parameter is required",
      });
    }

    // Get price data from Data Engine (placeholder)
    const priceData = { close: 1.095 };

    const result = await aiService.getMarketInsights(asset, priceData, []);

    if (result.success) {
      return res.json({
        success: true,
        asset,
        insights: result.content,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Market insights error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get ICT analysis from AI
 */
exports.getICTAnalysis = async (req, res) => {
  try {
    const { asset } = req.params;

    if (!asset) {
      return res.status(400).json({
        success: false,
        error: "Asset parameter is required",
      });
    }

    // Placeholder for ICT analysis
    const structure = { trend: "Bullish", phase: "Markup" };
    const orderBlocks = { bullish: [], bearish: [] };
    const fvgs = [];

    const result = await aiService.analyzeICTPatterns(
      asset,
      structure,
      orderBlocks,
      fvgs,
    );

    if (result.success) {
      return res.json({
        success: true,
        asset,
        analysis: result.content || result.analysis,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("ICT analysis error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get market summary with AI insights
 */
exports.getMarketSummary = async (req, res) => {
  try {
    let assets = req.query.assets;
    if (typeof assets === "string") {
      assets = assets.split(",");
    }
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      assets = ["EURUSD", "GBPUSD", "XAUUSD"];
    }

    const summaries = [];

    for (const asset of assets) {
      try {
        const priceData = { close: 1.095 };
        const result = await aiService.getMarketInsights(asset, priceData, []);

        summaries.push({
          asset,
          price: priceData?.close || null,
          insight: result.success ? result.content : null,
          error: result.success ? null : result.error,
        });
      } catch (e) {
        summaries.push({
          asset,
          price: null,
          insight: null,
          error: e.message,
        });
      }
    }

    return res.json({
      success: true,
      summaries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Market summary error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
