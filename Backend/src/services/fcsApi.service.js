const axios = require('axios');

class FCSApiService {
  constructor() {
    this.apiKey = process.env.FCS_API_KEY;
    this.baseUrl = 'https://fcsapi.com/api-v3';
    this.priceCache = {};
    this.lastFetch = null;
    this.lastFetchTime = null;
    this.cacheTTL = 3600000; // 1 hour cache
    
    // Trading hours: 18:00 PM - 00:00 AM NY time
    this.tradingStartHour = 18; // 6 PM NY time
    this.tradingEndHour = 0; // 12 AM NY time (midnight)
  }

  isTradingHours() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyTime.getHours();
    return (hour >= this.tradingStartHour || hour === 0);
  }

  async fetchSilverPrice() {
    // ✅ Check cache first (1 hour TTL)
    const now = Date.now();
    if (this.lastFetchTime && (now - this.lastFetchTime) < this.cacheTTL) {
      console.log('⏰ Silver price cached (1 hour TTL)');
      return this.priceCache['XAG/USD'] || null;
    }

    // Only fetch during trading hours
    if (!this.isTradingHours()) {
      console.log('⏰ Outside trading hours (18:00-00:00 NY time). Using cached price.');
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