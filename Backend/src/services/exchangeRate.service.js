// Backend/src/services/exchangeRate.service.js
const axios = require("axios");

class ExchangeRateService {
  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_KEY;
    this.baseUrl = "https://v6.exchangerate-api.com/v6";
    this.priceCache = {};
    this.lastFetch = null;

    this.supportedPairs = ["GBP/USD"];
  }

  async fetchRate(fromCurrency, toCurrency = "USD") {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/pair/${fromCurrency}/${toCurrency}`,
      );

      if (response.data && response.data.conversion_rate) {
        const symbol = `${fromCurrency}/${toCurrency}`;
        const result = {
          symbol: symbol,
          price: response.data.conversion_rate,
          timestamp: new Date().toISOString(),
          lastUpdate: response.data.time_last_update_utc,
          source: "ExchangeRate-API",
        };

        this.priceCache[symbol] = result;
        return result;
      }
      return null;
    } catch (error) {
      console.error(
        `❌ ExchangeRate error for ${fromCurrency}/${toCurrency}:`,
        error.message,
      );
      return null;
    }
  }

  async fetchAllRates() {
    const results = {};
    const pairs = [{ from: "GBP", to: "USD" }];

    for (const pair of pairs) {
      const rate = await this.fetchRate(pair.from, pair.to);
      if (rate) {
        results[rate.symbol] = rate;
      }
    }

    this.lastFetch = new Date().toISOString();
    return results;
  }

  async getPrice(symbol) {
    if (this.priceCache[symbol] && this.priceCache[symbol].timestamp) {
      const cacheAge =
        Date.now() - new Date(this.priceCache[symbol].timestamp).getTime();
      if (cacheAge < 60000) {
        return this.priceCache[symbol];
      }
    }

    const parts = symbol.split("/");
    if (parts.length === 2) {
      return await this.fetchRate(parts[0], parts[1]);
    }
    return null;
  }

  getAllPrices() {
    return this.priceCache;
  }

  isSupported(symbol) {
    return this.supportedPairs.includes(symbol);
  }
}

module.exports = new ExchangeRateService();
