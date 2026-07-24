/**
 * AI Controller - Handles all AI-related API requests
 */

const aiService = require("../services/ai.service");
const { buildMarketContext } = require("../services/marketContext.service");

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

    const marketContext = buildMarketContext();
    const result = await aiService.getChatResponse(messages, marketContext);

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

