// Assembles a concise, LLM-friendly snapshot of this app's actual live
// data — current prices and the most recent SMT divergence signals — so
// anything calling the AI (chat, daily digest, future coaching features)
// reasons from real state instead of inventing numbers.
//
// Extracted out of aiController.js so the daily-digest cron job can reuse
// the exact same context-building logic instead of duplicating it.
//
// Prices come from websocket.service.js specifically because that's the
// same cache smtDetection.service.js computes its signals from — pulling
// from marketData.service.js's separate cache instead could hand the
// model prices that disagree with the signals in the same context block.
const WebSocketService = require("./websocket.service");
const SMTDetectionService = require("./smtDetection.service");

/**
 * Never throws: any missing/stale data is simply omitted from the block.
 * Returns null if nothing at all is available.
 */
function buildMarketContext() {
  const lines = [];

  try {
    const prices = WebSocketService.getAllPrices();
    const priceEntries = Object.entries(prices || {});
    if (priceEntries.length > 0) {
      lines.push("Current prices:");
      for (const [symbol, data] of priceEntries) {
        lines.push(`- ${symbol}: ${data.price} (source: ${data.source}, as of ${data.timestamp})`);
      }
    }
  } catch (error) {
    console.warn("buildMarketContext: price lookup failed:", error.message);
  }

  try {
    const recentSignals = SMTDetectionService.getSignalHistory(5);
    if (recentSignals.length > 0) {
      lines.push("\nRecent SMT divergence signals:");
      for (const signal of recentSignals) {
        lines.push(
          `- [${signal.group}/${signal.timeframe}] ${signal.type} divergence: ${signal.primaryAsset} vs ${signal.correlatedAsset} — ${signal.description} (confidence ${signal.confidence}%)`,
        );
      }
    }
  } catch (error) {
    console.warn("buildMarketContext: signal history lookup failed:", error.message);
  }

  return lines.length > 0 ? lines.join("\n") : null;
}

module.exports = { buildMarketContext };
