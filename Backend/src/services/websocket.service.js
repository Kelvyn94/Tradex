// Backend/src/services/websocket.service.js
const TwelveDataService = require("./twelveData.service");
const ExchangeRateService = require("./exchangeRate.service");
const FCSApiService = require("./fcsApi.service");

class WebSocketService {
  constructor() {
    this.priceCache = {};
    this.lastUpdate = null;
    this.updateInterval = null;
    this.autoScanInterval = null;
    this.smtDetectionCallback = null;
  }

  connect() {
    console.log("🔌 Starting data services (REST mode)...");

    this.fetchAllPrices();

    this.updateInterval = setInterval(() => {
      this.fetchAllPrices();
    }, 30000);

    this.autoScanInterval = setInterval(() => {
      this.autoScanSMT();
    }, 300000);

    setInterval(() => {
      this.syncPrices();
    }, 1000);
  }

  async fetchAllPrices() {
    try {
      const twelvePrices = await TwelveDataService.fetchAllPrices();
      const exchangeRates = await ExchangeRateService.fetchAllRates();
      const silverPrice = await FCSApiService.fetchSilverPrice();

      const formatted = {};
      const symbolMap = {
        "GBP/USD": "GBPUSD",
        "XAU/USD": "XAUUSD",
        "EUR/USD": "EURUSD",
      };

      for (const [symbol, data] of Object.entries(exchangeRates)) {
        const key = symbolMap[symbol] || symbol;
        formatted[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: "ExchangeRate-API",
        };
      }

      for (const [symbol, data] of Object.entries(twelvePrices)) {
        const key = symbolMap[symbol] || symbol;
        formatted[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: "Twelve Data",
        };
      }

      if (silverPrice) {
        formatted["XAGUSD"] = {
          price: silverPrice.price,
          timestamp: silverPrice.timestamp,
          source: "FCS API",
        };
      }

      this.priceCache = formatted;
      this.lastUpdate = new Date().toISOString();

      console.log("✅ Prices updated:", Object.keys(formatted).join(", "));
    } catch (error) {
      console.error("❌ Price fetch error:", error.message);
    }
  }

  syncPrices() {
    const twelvePrices = TwelveDataService.getAllPrices();
    const symbolMap = {
      "XAU/USD": "XAUUSD",
      "EUR/USD": "EURUSD",
    };

    for (const [symbol, data] of Object.entries(twelvePrices)) {
      const key = symbolMap[symbol] || symbol;
      if (data.price && !this.priceCache[key]) {
        this.priceCache[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: "Twelve Data",
        };
      }
    }

    const exchangePrices = ExchangeRateService.getAllPrices();
    const exchangeMap = {
      "GBP/USD": "GBPUSD",
    };

    for (const [symbol, data] of Object.entries(exchangePrices)) {
      const key = exchangeMap[symbol] || symbol;
      if (data.price) {
        this.priceCache[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: "ExchangeRate-API",
        };
      }
    }

    const fcsPrices = FCSApiService.getAllPrices();
    if (fcsPrices["XAG/USD"]) {
      this.priceCache["XAGUSD"] = {
        price: fcsPrices["XAG/USD"].price,
        timestamp: fcsPrices["XAG/USD"].timestamp,
        source: "FCS API",
      };
    }
  }

  async autoScanSMT() {
    try {
      console.log("🔄 Auto-scanning SMT...");
      const SMTDetectionService = require("./smtDetection.service");
      const NotificationService = require("./notification.service");

      const groups = ["gold", "forex", "indices"];

      for (const group of groups) {
        const result = await SMTDetectionService.detectRealTimeSMT(group);

        if (result.success && result.signals && result.signals.length > 0) {
          console.log(
            `📊 Auto-scan found ${result.signals.length} signals for ${group}`,
          );

          for (const signal of result.signals) {
            if (signal.confidence > 75) {
              const userId = 1;
              await NotificationService.sendSignal(userId, {
                action: signal.type === "BULLISH" ? "BUY" : "SELL",
                instrument: signal.primaryAsset,
                entry: signal.primaryPrice,
                stopLoss: signal.primaryPrice * 0.995,
                takeProfits: [
                  signal.primaryPrice * 1.005,
                  signal.primaryPrice * 1.012,
                  signal.primaryPrice * 1.025,
                ],
                riskReward: 2.5,
                confidence: signal.confidence,
                reasoning: signal.description,
              });
            }
          }

          this.emit("smt-update", result.signals);
        }
      }
    } catch (error) {
      console.error("❌ Auto-scan error:", error.message);
    }
  }

  onSMTUpdate(callback) {
    this.smtDetectionCallback = callback;
  }

  emit(event, data) {
    if (event === "smt-update" && this.smtDetectionCallback) {
      this.smtDetectionCallback(data);
    }
  }

  getPrice(symbol) {
    return this.priceCache[symbol] || null;
  }

  getAllPrices() {
    return this.priceCache;
  }

  isConnected() {
    return true;
  }

  getActiveSymbols() {
    return Object.keys(this.priceCache).length;
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.autoScanInterval) {
      clearInterval(this.autoScanInterval);
      this.autoScanInterval = null;
    }
    console.log("🛑 Data services stopped");
  }
}

module.exports = new WebSocketService();
