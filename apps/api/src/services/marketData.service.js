// Multi-tier WebSocket service with automatic failover
const WebSocket = require("ws");
const axios = require("axios");
const EventEmitter = require("events");

class MarketDataService extends EventEmitter {
  constructor() {
    super();
    this.priceCache = {};
    this.priceHistory = {};
    this.wsConnections = [];
    this.activeSources = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // API Keys
    this.fcsKey = process.env.FCS_API_KEY;
    this.finnhubKey = process.env.FINNHUB_KEY;
    this.twelveDataKey = process.env.TWELVE_DATA_KEY;

    // Instruments to track
    this.instruments = [
      { symbol: "XAUUSD", name: "Gold" },
      { symbol: "XAGUSD", name: "Silver" },
      { symbol: "EURUSD", name: "EUR/USD" },
      { symbol: "GBPUSD", name: "GBP/USD" },
    ];

    // WebSocket endpoints
    this.endpoints = {
      finnhub: "wss://ws.finnhub.io",
    };

    this.pollingInterval = null;
  }

  /**
   * Start all WebSocket connections with failover
   */
  start() {
    console.log("🔌 Starting Market Data Service...");
    this.connectFinnhub();
    this.startRestPolling();
  }

  /**
   * Finnhub WebSocket (Free Tier - 60 calls/min)
   */
  connectFinnhub() {
    if (!this.finnhubKey) {
      console.warn("⚠️ Finnhub key missing, using REST API only");
      this.startRestPolling();
      return;
    }

    try {
      const ws = new WebSocket(
        `${this.endpoints.finnhub}?token=${this.finnhubKey}`,
      );

      ws.on("open", () => {
        console.log("✅ Finnhub WebSocket connected");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.wsConnections.push(ws);
        this.activeSources.push("Finnhub");

        const symbols = this.instruments.map((i) => i.symbol);
        symbols.forEach((symbol) => {
          ws.send(JSON.stringify({ type: "subscribe", symbol }));
        });
        console.log(`📊 Subscribed to: ${symbols.join(", ")}`);
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === "trade" && message.data) {
            message.data.forEach((trade) => {
              const key = trade.s.replace("/", "");
              this.priceCache[key] = {
                price: trade.p,
                timestamp: new Date().toISOString(),
                source: "Finnhub",
              };

              if (!this.priceHistory[key]) {
                this.priceHistory[key] = [];
              }
              this.priceHistory[key].push({
                price: trade.p,
                timestamp: new Date().toISOString(),
              });
              if (this.priceHistory[key].length > 100) {
                this.priceHistory[key].shift();
              }

              this.emit("price-update", {
                symbol: key,
                price: trade.p,
                source: "Finnhub",
              });
            });
          }
        } catch (error) {
          // Silent fail for non-price messages
        }
      });

      ws.on("error", (error) => {
        console.error("❌ Finnhub WebSocket error:", error.message);
        this.isConnected = false;
        this.reconnect();
      });

      ws.on("close", () => {
        console.log("⚠️ Finnhub WebSocket closed");
        this.isConnected = false;
        this.reconnect();
      });
    } catch (error) {
      console.error("❌ Finnhub connection error:", error.message);
      this.startRestPolling();
    }
  }

  /**
   * Reconnect with delay
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("⚠️ Max reconnect attempts reached. Using REST API only.");
      this.startRestPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      this.connectFinnhub();
    }, delay);
  }

  /**
   * REST API Polling (Fallback)
   */
  startRestPolling() {
    if (this.pollingInterval) return;

    console.log("📡 Starting REST API polling as fallback...");
    this.fetchRestPrices();

    // Twelve Data's free tier is 800 credits/day; 4 symbols every 30s is
    // ~11,500 requests/day - over 14x the budget, which is exactly what
    // exhausted the daily quota by early afternoon in production. 4
    // symbols every 10 min is ~576/day, leaving real headroom.
    this.pollingInterval = setInterval(() => {
      this.fetchRestPrices();
    }, 600000);
  }

  /**
   * Fetch prices via REST API
   */
  async fetchRestPrices() {
    try {
      const prices = await this.fetchFromTwelveData();
      if (prices && Object.keys(prices).length > 0) {
        for (const [key, data] of Object.entries(prices)) {
          if (!this.priceCache[key] || this.priceCache[key].source === "REST") {
            this.priceCache[key] = {
              ...data,
              source: "REST",
            };
          }
        }
      }
    } catch (error) {
      // Silent fail for REST
    }
  }

  /**
   * Fetch from Twelve Data REST
   */
  async fetchFromTwelveData() {
    if (!this.twelveDataKey) return null;

    const prices = {};
    for (const instrument of this.instruments) {
      // Twelve Data requires slash-delimited pairs (e.g. "XAU/USD"), but our
      // cache keys stay slash-free ("XAUUSD") to match the rest of the app.
      const apiSymbol = `${instrument.symbol.slice(0, 3)}/${instrument.symbol.slice(3)}`;
      try {
        const response = await axios.get("https://api.twelvedata.com/price", {
          params: {
            symbol: apiSymbol,
            apikey: this.twelveDataKey,
          },
          timeout: 5000,
        });
        if (response.data && response.data.price) {
          prices[instrument.symbol] = {
            price: parseFloat(response.data.price),
            timestamp: new Date().toISOString(),
          };
          console.log(`💰 REST: ${apiSymbol} @ ${response.data.price}`);
        } else {
          // Twelve Data returns 200 with an error payload (e.g. quota
          // exhausted, invalid symbol) rather than a non-2xx status.
          console.warn(
            `⚠️ Twelve Data returned no price for ${apiSymbol}:`,
            response.data?.message || JSON.stringify(response.data),
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ Twelve Data request failed for ${apiSymbol}:`,
          error.response?.status,
          error.response?.data?.message || error.message,
        );
      }
    }
    return prices;
  }

  /**
   * Get all current prices
   */
  getAllPrices() {
    return this.priceCache;
  }

  /**
   * Get price history for a symbol
   */
  getPriceHistory(symbol, limit = 50) {
    return this.priceHistory[symbol]?.slice(-limit) || [];
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      sources: this.activeSources,
      symbols: Object.keys(this.priceCache),
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Stop all connections
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.wsConnections.forEach((ws) => {
      try {
        ws.close();
      } catch (e) {}
    });
    this.wsConnections = [];
    console.log("🛑 Market Data Service stopped");
  }
}

module.exports = new MarketDataService();
