// Derives market sentiment purely from Smart Money Concepts / ICT analysis
// — market structure, BOS/CHOCH, order blocks, premium/discount, and
// killzone context — served by the Data Engine's ICTService
// (D:\Development\Data Engine\backend\services\ict_service.py, exposed at
// /api/v1/ict/analyze/{asset}). Deliberately does not touch retail
// indicators (RSI, MACD, simple EMA crossovers, etc.) — every signal here
// traces back to an institutional-order-flow concept, matching the
// analysis style the rest of the app is built around.
const dataEngineService = require("./dataEngine.service");

const ACTION_TO_SENTIMENT = {
  STRONG_BUY: "BULLISH",
  BUY: "BULLISH",
  STRONG_SELL: "BEARISH",
  SELL: "BEARISH",
  HOLD: "NEUTRAL",
};

// A high-conviction ICT read (aligned structure + BOS/CHOCH + OB +
// premium/discount all agreeing) is lower risk to act on than a weak,
// conflicting one — this is the opposite mapping you'd use for a raw
// indicator confidence score, and is intentional.
const STRENGTH_TO_RISK = {
  STRONG: "LOW",
  MODERATE: "MEDIUM",
  WEAK: "HIGH",
};

class SentimentService {
  constructor() {
    this.cache = {};
    this.cacheTTL = 1800000; // 30 minutes
  }

  /**
   * Get ICT-derived sentiment for an instrument. Returns
   * { success: false } when the Data Engine has no analysis for this
   * instrument yet — callers should treat that as an honest "no data"
   * state, never synthesize a fallback opinion.
   */
  async getSentimentAnalysis(instrument = "XAUUSD") {
    const cacheKey = `sentiment_${instrument}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    let analysis;
    try {
      const response = await dataEngineService.getICT(instrument);
      analysis = response?.data ?? null;
    } catch (error) {
      return {
        success: false,
        error: `Data Engine unavailable: ${error.message}`,
      };
    }

    const result = this._deriveSentiment(instrument, analysis);

    if (result.success) {
      this.cache[cacheKey] = { timestamp: Date.now(), data: result };
    }

    return result;
  }

  /**
   * Pure function: ICT analysis payload -> the sentiment shape the
   * frontend already expects. See ICTService.analyze_asset /
   * _generate_combined_signal in the Data Engine for what produces this.
   */
  _deriveSentiment(instrument, analysis) {
    if (!analysis || !analysis.signal) {
      return {
        success: false,
        error: `No ICT analysis available yet for ${instrument}`,
      };
    }

    const { signal, market_structure, premium_discount, current_session } = analysis;

    const overallSentiment = ACTION_TO_SENTIMENT[signal.action] ?? "NEUTRAL";
    const confidence = Math.round((signal.confidence ?? 0) * 100);
    const riskLevel = STRENGTH_TO_RISK[signal.signal_strength] ?? "MEDIUM";

    const rationale = signal.reasons?.length
      ? signal.reasons.join("; ") + "."
      : "No high-conviction ICT confluence detected at this time.";

    const zone = premium_discount?.zone;
    const zoneNote = zone
      ? ` Price is currently trading in the ${zone.toLowerCase()} zone of the dealing range.`
      : "";
    const sessionNote = current_session?.name
      ? ` Current session: ${current_session.name}.`
      : "";

    const tradingImplication = `${signal.action.replace("_", " ")} (${signal.signal_strength.toLowerCase()} conviction).${zoneNote}${sessionNote}`;

    // Only surface themes actually present in the model's reasoning —
    // never claim confluence from a component that didn't fire.
    const keyThemes = [];
    const reasonText = (signal.reasons ?? []).join(" ").toLowerCase();
    if (reasonText.includes("structure")) keyThemes.push("Market Structure");
    if (reasonText.includes("bos")) keyThemes.push("Break of Structure");
    if (reasonText.includes("choch")) keyThemes.push("Change of Character");
    if (reasonText.includes("order block")) keyThemes.push("Order Blocks");
    if (reasonText.includes("discount") || reasonText.includes("premium")) {
      keyThemes.push("Premium/Discount");
    }
    if (reasonText.includes("killzone")) keyThemes.push("Killzone Activity");
    if (keyThemes.length === 0) keyThemes.push("Market Structure");

    return {
      success: true,
      instrument,
      timestamp: new Date().toISOString(),
      synthesis: {
        overallSentiment,
        confidence,
        rationale,
        keyThemes,
        tradingImplication,
        riskLevel,
      },
      details: {
        articlesAnalyzed: signal.reasons?.length ?? 0,
        sources: ["TradeX Data Engine — ICT Analysis"],
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
    console.log("🗑️ Sentiment cache cleared");
  }
}

module.exports = new SentimentService();
