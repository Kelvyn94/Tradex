/**
 * AI Service - Groq Integration (Direct HTTP)
 * Uses Groq's Llama 3.3 70B for fast, free AI analysis
 */

const axios = require("axios");

class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    this.baseURL = "https://api.groq.com/openai/v1";
    this.defaultModel = "llama-3.3-70b-versatile";
    this.fastModel = "llama-3.1-8b-instant";

    if (!this.apiKey) {
      console.warn("⚠️ No Groq API key found! Please set GROQ_API_KEY in .env");
    }
  }

  /**
   * Make a request to Groq API
   */
  async _makeRequest(
    messages,
    model = this.defaultModel,
    temperature = 0.5,
    maxTokens = 500,
  ) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return {
        success: true,
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error("Groq API Error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Main chat method for general conversation
   */
  async getChatResponse(messages) {
    const systemPrompt = `You are a professional trading assistant. 
            You specialize in ICT concepts, technical analysis, and risk management.
            Provide clear, actionable advice. Be concise.
            When giving trading recommendations, include entry, stop-loss, and take-profit levels.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.content,
      })),
    ];

    return this._makeRequest(formattedMessages, this.defaultModel, 0.5, 500);
  }

  /**
   * Get market insights for an asset
   */
  async getMarketInsights(asset, priceData, signals) {
    const userPrompt = `
            Analyze ${asset}:
            Price: ${priceData?.close || "N/A"}
            Signals: ${JSON.stringify(signals || [])}
            
            Provide: Market Structure, Key Levels, Recommendation (BUY/SELL/HOLD), Confidence Score.
            Keep response under 150 words.
        `;

    const messages = [
      {
        role: "system",
        content:
          "You are a professional trading analyst. Provide concise, actionable market insights.",
      },
      { role: "user", content: userPrompt },
    ];

    return this._makeRequest(messages, this.defaultModel, 0.3, 300);
  }

  /**
   * Alias for getChatResponse (backward compatibility)
   */
  async chat(messages) {
    return this.getChatResponse(messages);
  }

  /**
   * Get quick market summary (fast model)
   */
  async getQuickSummary(asset, price) {
    const messages = [
      {
        role: "system",
        content:
          "You are a trading assistant. Provide brief, actionable market summaries.",
      },
      {
        role: "user",
        content: `Brief summary for ${asset} at price ${price}. One sentence only.`,
      },
    ];

    return this._makeRequest(messages, this.fastModel, 0.2, 50);
  }

  /**
   * Analyze ICT patterns
   */
  async analyzeICTPatterns(asset, structure, orderBlocks, fvgs) {
    const userPrompt = `
            ICT Analysis for ${asset}:

            Market Structure: ${JSON.stringify(structure)}
            Order Blocks: ${JSON.stringify(orderBlocks)}
            FVGs: ${JSON.stringify(fvgs)}

            Provide:
            1. Key ICT Levels
            2. Bias (Bullish/Bearish)
            3. Entry Zones
            4. Stop Loss Placement
        `;

    const messages = [
      {
        role: "system",
        content:
          "You are an ICT (Inner Circle Trader) expert. Analyze market structure and identify trading opportunities.",
      },
      { role: "user", content: userPrompt },
    ];

    return this._makeRequest(messages, this.defaultModel, 0.3, 400);
  }
}

module.exports = new AIService();
