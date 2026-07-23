const axios = require('axios');

class FCSApiService {
  constructor() {
    this.apiKey = process.env.FCS_API_KEY;
    this.baseUrl = 'https://fcsapi.com/api-v3';
    this.priceCache = {};
    this.lastFetch = null;
    this.lastFetchTime = null;
    this.cacheTTL = 3600000; // 1 hour cache
  }

  async fetchSilverPrice() {
    // The 1-hour cache TTL is what actually limits API call volume — an
    // earlier "only fetch 18:00-00:00 NY" gate on top of this returned null
    // for 18 of 24 hours whenever the cache was empty (e.g. right after a
    // deploy restart, since priceCache resets), which is why SMT auto-scan
    // kept reporting no silver data outside that narrow window.
    const now = Date.now();
    if (this.lastFetchTime && (now - this.lastFetchTime) < this.cacheTTL) {
      console.log('⏰ Silver price cached (1 hour TTL)');
      return this.priceCache['XAG/USD'] || null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forex/latest`, {
        params: {
          symbol: 'XAG/USD',
          access_key: this.apiKey
        }
      });
      
      if (response.data && response.data.status === true && response.data.response) {
        const data = response.data.response[0];
        const price = parseFloat(data.price);
        
        const result = {
          symbol: 'XAG/USD',
          price: price,
          timestamp: new Date().toISOString(),
          source: 'FCS API',
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask),
          high: parseFloat(data.high),
          low: parseFloat(data.low)
        };
        
        this.priceCache['XAG/USD'] = result;
        this.priceCache['XAGUSD'] = result;
        this.lastFetchTime = now;
        console.log(`💰 FCS API: XAG/USD @ ${price}`);
        return result;
      }
      return null;
    } catch (error) {
      console.error(`❌ FCS API error for XAG/USD:`, error.message);
      return this.priceCache['XAG/USD'] || null;
    }
  }

  getPrice(symbol) {
    if (symbol === 'XAG/USD' || symbol === 'XAGUSD') {
      return this.priceCache['XAG/USD'] || null;
    }
    return null;
  }

  getAllPrices() {
    return this.priceCache;
  }
}

module.exports = new FCSApiService();