// Backend/src/services/ai.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeCache = require("node-cache");

class AIService {
  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
    this.visionModel = this.gemini.getGenerativeModel({
      model: "gemini-pro-vision",
    });
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.dailyCount = 0;
    this.dailyLimit = 45;
    this.lastReset = new Date().toDateString();
  }

  canMakeRequest() {
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      this.dailyCount = 0;
      this.lastReset = today;
    }
    return this.dailyCount < this.dailyLimit;
  }

  /**
   * Analyze chart screenshot using Gemini Vision API
   * This ACTUALLY uses AI to analyze the image!
   */
  async analyzeChartImage(imageBase64, context = {}) {
    // Check if we have a cached response
    const cacheKey = `vision_${context.instrument || "chart"}_${Date.now()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.dailyCount++;
      return cached;
    }

    if (!this.canMakeRequest()) {
      return {
        success: false,
        message: "AI limit reached. Please try again later.",
        confidence: 0,
      };
    }

    try {
      // Build the prompt for ICT analysis
      const prompt = this.buildVisionPrompt(context);

      // Call Gemini Vision API
      const result = await this.visionModel.generateContent([
        prompt,
        { inlineData: { mimeType: "image/png", data: imageBase64 } },
      ]);

      const analysis = result.response.text();
      const confidence = this.extractConfidence(analysis);

      const response = {
        success: true,
        analysis: analysis,
        confidence: confidence || 75,
        timestamp: new Date().toISOString(),
        type: "chart_analysis",
      };

      // Cache the response
      this.cache.set(cacheKey, response);
      this.dailyCount++;
      this.dailyLimit = 45; // Vision counts toward daily limit

      return response;
    } catch (error) {
      console.error("Vision API Error:", error.message);
      return {
        success: false,
        message: "Chart analysis failed. Please try again.",
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Build ICT-specific vision prompt
   */
  buildVisionPrompt(context) {
    const instrument = context.instrument || "XAUUSD";
    const timeframe = context.timeframe || "4H";
    const strategy = context.strategy || "Sell Profile";

    return `You are an expert ICT (Inner Circle Trader) analyst. Analyze this chart and provide insights based on Smart Money Concepts.

    Instrument: ${instrument}
    Timeframe: ${timeframe}
    Strategy Focus: ${strategy}

    Please analyze the chart and provide:
    1. Market Structure: Identify break of structure (BOS), change of character (CHOCH)
    2. Order Blocks: Mark bullish/bearish order blocks
    3. Fair Value Gaps (FVG): Identify any unfilled gaps
    4. Liquidity Pools: Point out potential liquidity grabs
    5. Timeframe Alignment: Check alignment with higher timeframes
    6. Entry Opportunity: Based on CISD (Change in State of Delivery)
    7. Support/Resistance: Key levels visible on the chart

    Provide a structured analysis with:
    - Key Levels (Support/Resistance)
    - Probability of Trade (High/Medium/Low)
    - Risk Management Notes
    - Suggested Entry/Exit Points
    - Confidence Score (0-100%)`;
  }

  /**
   * Extract confidence from analysis text
   */
  extractConfidence(text) {
    const match = text.match(/confidence:?\s*(\d+)%/i);
    return match ? parseInt(match[1]) : null;
  }

  // ... existing methods
}

module.exports = new AIService();
