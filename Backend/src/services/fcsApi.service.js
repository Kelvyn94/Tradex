// Backend/src/services/fcsApi.service.js
const axios = require('axios');

class FCSApiService {
  constructor() {
    this.apiKey = process.env.FCS_API_KEY;
    this.baseUrl = 'https://fcsapi.com/api-v3';
    this.priceCache = {};
    this.lastFetch = null;
    
    // Custom trading sessions (NY Time)
    this.sessions = [
      { start: 18, end: 22, label: 'Evening Session (6PM-10PM)' },   // 18:00 - 22:00
      { start: 2, end: 12, label: 'Morning Session (2AM-12PM)' },    // 02:00 - 12:00
    ];
  }

  /**
   * Check if current NY time is within trading sessions
   */
  isTradingHours() {
    const now = new Date();
    // Get NY time (UTC-4 or UTC-5 depending on DST)
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyTime.getHours();
    const minute = nyTime.getMinutes();
    
    for (const session of this.sessions) {
      // Handle sessions that wrap past midnight
      if (session.start < session.end) {
        // Normal session: start <= hour < end
        if (hour >= session.start && hour < session.end) {
          return true;
        }
      } else {
        // Session wraps past midnight (e.g., 22:00 - 02:00)
        if (hour >= session.start || hour < session.end) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get next session start time
   */
  getNextSessionStart() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyTime.getHours();
    
    // Find next session start
    for (const session of this.sessions) {
      if (hour < session.start) {
        return session.start;
      }
    }
    // If no session today, return first session tomorrow
    return this.sessions[0].start;
  }

  /**
   * Fetch XAG/USD price
   */
  async fetchSilverPrice() {
    // Check if within trading hours
    if (!this.isTradingHours()) {
      const nextSession = this.getNextSessionStart();
      console.log(`⏰ Outside trading hours. Next session starts at ${nextSession}:00 NY time. Using cached price.`);
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
          low: parseFloat(data.low),
          session: this.getCurrentSessionLabel()
        };
        
        this.priceCache['XAG/USD'] = result;
        this.priceCache['XAGUSD'] = result;
        console.log(`💰 FCS API: XAG/USD @ ${price} (${result.session})`);
        return result;
      }
      console.warn('⚠️ FCS API returned unexpected response:', response.data);
      return this.priceCache['XAG/USD'] || null;
    } catch (error) {
      console.error(`❌ FCS API error for XAG/USD:`, error.message);
      return this.priceCache['XAG/USD'] || null;
    }
  }

  /**
   * Get current session label
   */
  getCurrentSessionLabel() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyTime.getHours();
    
    for (const session of this.sessions) {
      if (session.start < session.end) {
        if (hour >= session.start && hour < session.end) {
          return session.label;
        }
      } else {
        if (hour >= session.start || hour < session.end) {
          return session.label;
        }
      }
    }
    return 'Off-Hours';
  }

  /**
   * Get price from cache
   */
  getPrice(symbol) {
    if (symbol === 'XAG/USD' || symbol === 'XAGUSD') {
      return this.priceCache['XAG/USD'] || null;
    }
    return null;
  }

  /**
   * Get all cached prices
   */
  getAllPrices() {
    return this.priceCache;
  }

  /**
   * Get trading session info
   */
  getSessionInfo() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyTime.getHours();
    const isActive = this.isTradingHours();
    const currentSession = this.getCurrentSessionLabel();
    const nextStart = this.getNextSessionStart();

    return {
      isActive,
      currentSession,
      nextSessionStart: `${nextStart}:00 NY time`,
      nyTime: nyTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      sessions: this.sessions.map(s => `${s.start}:00 - ${s.end}:00 NY (${s.label})`)
    };
  }
}

module.exports = new FCSApiService();
