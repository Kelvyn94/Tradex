// Backend/src/services/smtDetection.service.js
const WebSocketService = require("./websocket.service");
const HistoricalDataService = require("./historicalData.service");
const AIService = require("./ai.service");

class SMTDetectionService {
  constructor() {
    this.signals = [];
    this.cache = {};
    this.priceHistory = {};
    this.correlationThreshold = 0.7;
    this.minPriceHistory = 3; // Minimum price points needed for detection

    // Asset groups for SMT detection
    this.assetGroups = {
      gold: {
        primary: "XAUUSD",
        correlated: ["XAGUSD", "XAUEUR", "XAUGBP"],
        timeframes: ["30m", "1h", "4h", "daily", "weekly"],
        description: "Gold & Correlated Assets",
      },
      forex: {
        primary: "EURUSD",
        correlated: ["GBPUSD"],
        timeframes: ["30m", "1h", "4h", "daily", "weekly"],
        description: "Forex Majors",
      },
      indices: {
        primary: "NAS100",
        correlated: ["US500", "US30"],
        timeframes: ["30m", "1h", "4h", "daily", "weekly"],
        description: "US Indices",
      },
    };

    // Store last 20 prices for each symbol
    this.priceHistoryLimit = 20;
  }

  /**
   * Detect SMT Divergence in Real-Time (Single Asset Group)
   */
  async detectRealTimeSMT(groupName = "gold") {
    const group = this.assetGroups[groupName];
    if (!group) {
      return {
        success: false,
        error: `Asset group "${groupName}" not found`,
        availableGroups: Object.keys(this.assetGroups),
      };
    }

    console.log(
      `🔍 Detecting SMT for ${groupName} (${group.primary} vs ${group.correlated.join(", ")})`,
    );

    // Get real-time prices from WebSocket
    const prices = WebSocketService.getAllPrices();

    // Check if we have enough price history
    const hasEnoughData = this.checkDataAvailability(prices, group);
    if (!hasEnoughData) {
      return {
        success: true,
        signals: [],
        totalSignals: 0,
        message: "Insufficient price data. Waiting for more data points.",
        group: groupName,
        timestamp: new Date().toISOString(),
      };
    }

    // Detect signals using real data
    const signals = await this.detectGroupSMT(groupName, group, prices);

    if (signals.length === 0) {
      return {
        success: true,
        signals: [],
        totalSignals: 0,
        message: "No SMT divergences detected at this time.",
        group: groupName,
        timestamp: new Date().toISOString(),
      };
    }

    // Generate recommendations for high-confidence signals
    const recommendations = signals
      .filter((s) => s.confidence > 70)
      .map((s) => this.generateRecommendation(s));

    // Store signals in history
    this.signals.push(...signals);

    return {
      success: true,
      signals,
      recommendations,
      totalSignals: signals.length,
      highConfidence: signals.filter((s) => s.confidence > 80).length,
      group: groupName,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if we have enough price data for detection
   */
  checkDataAvailability(prices, group) {
    const allSymbols = [group.primary, ...group.correlated];

    for (const symbol of allSymbols) {
      if (!prices[symbol]) {
        console.log(`⚠️ No price data for ${symbol}`);
        return false;
      }

      // Check if we have price history
      const history = this.priceHistory[symbol] || [];
      if (history.length < this.minPriceHistory) {
        console.log(
          `⚠️ Insufficient history for ${symbol}: ${history.length}/${this.minPriceHistory}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Detect SMT for a specific asset group using real data
   */
  async detectGroupSMT(groupName, group, prices) {
    const signals = [];

    for (const correlated of group.correlated) {
      for (const timeframe of group.timeframes) {
        try {
          const divergence = await this.analyzeDivergenceWithHistory(
            group.primary,
            correlated,
            prices,
            timeframe,
          );

          if (divergence) {
            // AI Validation (uses rate limiting)
            let aiValidation = null;
            try {
              aiValidation = await AIService.validateSMTDivergences([
                divergence,
              ]);
            } catch (aiError) {
              console.warn("AI validation skipped:", aiError.message);
            }

            signals.push({
              ...divergence,
              group: groupName,
              timeframe: timeframe,
              aiValidated: !!aiValidation,
              aiConfidence:
                aiValidation?.[0]?.confidence || divergence.confidence,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(
            `Error analyzing ${group.primary} vs ${correlated} (${timeframe}):`,
            error.message,
          );
        }
      }
    }

    return signals;
  }

  /**
   * Analyze divergence with historical data for trend confirmation
   */
  async analyzeDivergenceWithHistory(primary, correlated, prices, timeframe) {
    // Get current prices
    const primaryPrice = prices[primary]?.price;
    const correlatedPrice = prices[correlated]?.price;

    if (!primaryPrice || !correlatedPrice) {
      return null;
    }

    // Update price history
    this.updatePriceHistory(primary, primaryPrice);
    this.updatePriceHistory(correlated, correlatedPrice);

    // Get previous prices for trend detection
    const primaryPrev = this.getPreviousPrice(primary, 1);
    const correlatedPrev = this.getPreviousPrice(correlated, 1);

    if (!primaryPrev || !correlatedPrev) {
      return null;
    }

    // Calculate price movements
    const primaryMove = primaryPrice - primaryPrev;
    const correlatedMove = correlatedPrice - correlatedPrev;

    // Minimum movement threshold (avoid noise)
    const minMove = 0.01;
    if (Math.abs(primaryMove) < minMove && Math.abs(correlatedMove) < minMove) {
      return null;
    }

    // Detect divergence based on price movement
    let divergence = null;

    // BEARISH SMT: Primary moves up, Correlated moves down
    if (primaryMove > 0 && correlatedMove < 0) {
      divergence = {
        type: "BEARISH",
        primaryAsset: primary,
        correlatedAsset: correlated,
        primaryPrice: primaryPrice,
        correlatedPrice: correlatedPrice,
        primaryPrev: primaryPrev,
        correlatedPrev: correlatedPrev,
        primaryMove: primaryMove,
        correlatedMove: correlatedMove,
        confidence: this.calculateConfidence(primaryMove, correlatedMove),
        description: `${primary} moving UP (${primaryMove.toFixed(2)}) while ${correlated} moving DOWN (${correlatedMove.toFixed(2)})`,
        priceAction: "DIVERGENCE_CONFIRMED",
        recommendation: "Consider selling at key resistance levels",
      };
    }

    // BULLISH SMT: Primary moves down, Correlated moves up
    if (primaryMove < 0 && correlatedMove > 0) {
      divergence = {
        type: "BULLISH",
        primaryAsset: primary,
        correlatedAsset: correlated,
        primaryPrice: primaryPrice,
        correlatedPrice: correlatedPrice,
        primaryPrev: primaryPrev,
        correlatedPrev: correlatedPrev,
        primaryMove: primaryMove,
        correlatedMove: correlatedMove,
        confidence: this.calculateConfidence(primaryMove, correlatedMove),
        description: `${primary} moving DOWN (${primaryMove.toFixed(2)}) while ${correlated} moving UP (${correlatedMove.toFixed(2)})`,
        priceAction: "DIVERGENCE_CONFIRMED",
        recommendation: "Consider buying at key support levels",
      };
    }

    // Check for timeframe alignment (if divergence detected)
    if (divergence) {
      try {
        const alignment = await this.checkTimeframeAlignment(
          primary,
          correlated,
          timeframe,
        );
        divergence.timeframeAlignment = alignment;

        // Boost confidence if multiple timeframes align
        if (alignment.aligned) {
          divergence.confidence = Math.min(divergence.confidence + 10, 98);
          divergence.description += ` - ${alignment.description}`;
        }
      } catch (error) {
        console.warn("Timeframe alignment check failed:", error.message);
      }
    }

    return divergence;
  }

  /**
   * Calculate confidence based on price movements
   */
  calculateConfidence(primaryMove, correlatedMove) {
    let confidence = 70; // Base confidence

    // Stronger movements = higher confidence
    const primaryAbs = Math.abs(primaryMove);
    const correlatedAbs = Math.abs(correlatedMove);

    if (primaryAbs > 5) confidence += 5;
    if (primaryAbs > 10) confidence += 5;
    if (correlatedAbs > 5) confidence += 5;
    if (correlatedAbs > 10) confidence += 5;

    // Movement ratio (if one moves significantly more than the other)
    const ratio =
      Math.max(primaryAbs, correlatedAbs) /
      (Math.min(primaryAbs, correlatedAbs) + 0.01);
    if (ratio > 3) confidence += 5;
    if (ratio > 5) confidence += 5;

    return Math.min(confidence, 98);
  }

  /**
   * Update price history for trend detection
   */
  updatePriceHistory(symbol, price) {
    if (!this.priceHistory[symbol]) {
      this.priceHistory[symbol] = [];
    }
    this.priceHistory[symbol].push(price);

    if (this.priceHistory[symbol].length > this.priceHistoryLimit) {
      this.priceHistory[symbol].shift();
    }
  }

  /**
   * Get previous price from history
   */
  getPreviousPrice(symbol, offset = 1) {
    const history = this.priceHistory[symbol] || [];
    const index = history.length - 1 - offset;
    return index >= 0 ? history[index] : null;
  }

  /**
   * Check timeframe alignment
   */
  async checkTimeframeAlignment(primary, correlated, currentTimeframe) {
    const timeframePriority = {
      "30m": 1,
      "1h": 2,
      "4h": 3,
      daily: 4,
      weekly: 5,
    };

    const currentPriority = timeframePriority[currentTimeframe] || 2;
    const result = {
      aligned: false,
      description: "",
      higherTimeframe: null,
      lowerTimeframe: null,
    };

    // Check if higher timeframe confirms
    if (currentPriority < 5) {
      const higher = Object.keys(timeframePriority).find(
        (t) => timeframePriority[t] === currentPriority + 1,
      );
      if (higher) {
        try {
          const higherData = await HistoricalDataService.getSMTData(
            primary,
            correlated,
            higher,
            20,
          );

          if (higherData.primary && higherData.correlated) {
            const primaryTrend = this.calculateTrend(higherData.primary);
            const correlatedTrend = this.calculateTrend(higherData.correlated);

            if (
              (primaryTrend > 0 && correlatedTrend < 0) ||
              (primaryTrend < 0 && correlatedTrend > 0)
            ) {
              result.aligned = true;
              result.higherTimeframe = higher;
              result.description = `${higher} timeframe confirms divergence`;
            }
          }
        } catch (error) {
          // Silently fail for timeframe check
        }
      }
    }

    return result;
  }

  /**
   * Calculate trend from historical data
   */
  calculateTrend(data) {
    if (!data || data.length < 5) return 0;

    const prices = data.map((d) => d.close || d.price);
    const recentPrices = prices.slice(-10);
    const first = recentPrices[0];
    const last = recentPrices[recentPrices.length - 1];

    if (!first || !last) return 0;
    return (last - first) / first;
  }

  /**
   * Generate trade recommendation from SMT signal
   */
  generateRecommendation(signal) {
    if (!signal) return null;

    const entry = signal.primaryPrice;
    const stopDistance = entry * 0.005; // 0.5% stop

    return {
      action: signal.type === "BULLISH" ? "BUY" : "SELL",
      instrument: signal.primaryAsset,
      correlated: signal.correlatedAsset,
      entry: entry,
      stopLoss:
        signal.type === "BULLISH" ? entry - stopDistance : entry + stopDistance,
      takeProfits:
        signal.type === "BULLISH"
          ? [entry + entry * 0.01, entry + entry * 0.025, entry + entry * 0.05]
          : [entry - entry * 0.01, entry - entry * 0.025, entry - entry * 0.05],
      riskReward: 2.5,
      confidence: signal.confidence || 75,
      timeframe: signal.timeframe || "1h",
      reasoning: signal.description || "SMT divergence detected",
      keyLevels: {
        support: entry - entry * 0.02,
        resistance: entry + entry * 0.02,
        pivot: entry,
      },
    };
  }

  /**
   * Get SMT history
   */
  getSignalHistory(limit = 50) {
    return this.signals.slice(-limit);
  }

  /**
   * Clear signal history
   */
  clearHistory() {
    this.signals = [];
    return { success: true, message: "Signal history cleared" };
  }

  /**
   * Get active asset groups
   */
  getAssetGroups() {
    return Object.keys(this.assetGroups);
  }

  /**
   * Get SMT statistics
   */
  getStats() {
    const totalSignals = this.signals.length;
    const bullish = this.signals.filter((s) => s.type === "BULLISH").length;
    const bearish = this.signals.filter((s) => s.type === "BEARISH").length;

    return {
      totalSignals,
      bullish,
      bearish,
      winRate:
        totalSignals > 0 ? ((bullish / totalSignals) * 100).toFixed(1) : 0,
      lastSignal: this.signals[this.signals.length - 1] || null,
      activeGroups: Object.keys(this.assetGroups),
    };
  }
}

module.exports = new SMTDetectionService();
