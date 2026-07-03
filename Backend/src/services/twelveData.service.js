// Backend/src/services/twelveData.service.js
const axios = require("axios");

class TwelveDataService {
  constructor() {
    this.apiKey = process.env.TWELVE_DATA_KEY;
    this.baseUrl = "https://api.twelvedata.com";
    this.priceCache = {};

    this.instruments = [
      { symbol: "XAU/USD", name: "XAUUSD" },
      { symbol: "EUR/USD", name: "EURUSD" },
    ];
  }

  async fetchPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/price`, {
        params: {
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      if (response.data && response.data.price) {
        const price = parseFloat(response.data.price);
        console.log(`💰 Twelve Data: ${symbol} @ ${price}`);

        const result = {
          price: price,
          symbol: symbol,
          timestamp: new Date().toISOString(),
        };

        this.priceCache[symbol] = result;
        return result;
      }
      return null;
    } catch (error) {
      console.error(`❌ Twelve Data price error for ${symbol}:`, error.message);
      return null;
    }
  }

  async fetchAllPrices() {
    const results = {};
    for (const instrument of this.instruments) {
      const price = await this.fetchPrice(instrument.symbol);
      if (price) {
        results[instrument.symbol] = price;
        results[instrument.name] = price;
      }
    }
    return results;
  }

  getPrice(symbol) {
    if (this.priceCache[symbol]) {
      return this.priceCache[symbol];
    }

    const instrument = this.instruments.find((i) => i.name === symbol);
    if (instrument && this.priceCache[instrument.symbol]) {
      return this.priceCache[instrument.symbol];
    }

    return null;
  }

  getAllPrices() {
    return this.priceCache;
  }
}

module.exports = new TwelveDataService();
