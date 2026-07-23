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
   * Builds the ICT/Smart Money Concepts system prompt. Accepts an optional
   * marketContext string (live prices / recent SMT signals, assembled by
   * the caller — see aiController.chat) so the model reasons from this
   * app's actual data instead of inventing plausible-sounding numbers.
   */
  _buildICTSystemPrompt(marketContext) {
    const base = `You are TRADEX's trading assistant, specializing in Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodology. Ground every answer in this framework rather than generic technical analysis:

- **Market structure**: identify trend via HH/HL (bullish) or LH/LL (bearish) sequences. Flag a Break of Structure (BOS) as trend continuation and a Change of Character (CHoCH) as an early reversal signal.
- **Liquidity**: Buy-side liquidity (BSL) rests above old highs/equal highs; sell-side liquidity (SSL) rests below old lows/equal lows. Price is drawn to liquidity pools before reversing — a "liquidity sweep" or "stop hunt" is often the first sign smart money is positioning opposite retail.
- **Order Blocks (OB)**: the last opposing candle before an impulsive, structure-breaking move. Bullish OBs mark demand; bearish OBs mark supply. These are high-probability re-entry zones.
- **Fair Value Gaps (FVG)**: a 3-candle imbalance where price moved too fast to trade both sides. Price frequently returns to fill an FVG before continuing.
- **Premium / Discount**: split the current dealing range at the 50% equilibrium. Look for longs in the discount (below 50%) and shorts in the premium (above 50%) — never chase price in the wrong half of the range.
- **Killzones**: London Open, New York Open, and London Close windows carry the highest-probability setups; the Asian session typically builds the range those sessions manipulate.
- **SMT Divergence**: when two historically correlated assets (e.g. EURUSD vs GBPUSD, XAUUSD vs XAGUSD) fail to confirm each other's high or low, that divergence signals smart money is likely reversing one and not the other.
- **HTF confluence**: never give a trade idea that ignores the higher-timeframe bias — a 5-minute setup against the 4H/daily structure is lower probability and should be labeled as such.

Rules:
1. Only reference specific prices, signals, or levels that appear in the "LIVE MARKET CONTEXT" block below. If the user asks about an instrument or data point not present there, say plainly that you don't have live data for it — never invent a number.
2. When giving a trade idea, state entry, stop-loss (placed beyond the invalidation point — the liquidity/structure level that disproves the setup), take-profit (the next liquidity pool, FVG, or structure level), and the resulting risk:reward.
3. Be concise and structured. Prefer short labeled sections over long paragraphs.`;

    if (!marketContext) {
      return `${base}\n\nLIVE MARKET CONTEXT: unavailable right now — say so if asked for current prices or signals rather than guessing.`;
    }

    return `${base}\n\nLIVE MARKET CONTEXT (as of ${new Date().toISOString()}):\n${marketContext}`;
  }

  /**
   * Main chat method for general conversation
   */
  async getChatResponse(messages, marketContext) {
    const systemPrompt = this._buildICTSystemPrompt(marketContext);

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.content,
      })),
    ];

    return this._makeRequest(formattedMessages, this.defaultModel, 0.5, 700);
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
