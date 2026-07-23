// Backend/src/services/websocket.service.js
const MarketDataService = require("./marketData.service");
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
    console.log('🔌 Starting data services (REST mode)...');
    
    // Initial fetch
    this.fetchAllPrices();
    
    // ✅ FIX: Changed from 30 seconds to 30 minutes
    this.updateInterval = setInterval(() => {
      this.fetchAllPrices();
    }, 1800000); // 30 minutes = 1,800,000 ms

    // Auto-scan SMT every 5 minutes
    this.autoScanInterval = setInterval(() => {
      this.autoScanSMT();
    }, 300000);
  }

  async fetchAllPrices() {
    try {
      // XAUUSD/EURUSD/GBPUSD already come from MarketDataService's own
      // Twelve Data + Finnhub polling (started separately in server.js) —
      // reading its cache here avoids doubling up Twelve Data requests
      // against the same rate-limited API key.
      const marketPrices = MarketDataService.getAllPrices();
      const silverPrice = await FCSApiService.fetchSilverPrice();

      const formatted = { ...marketPrices };

      if (silverPrice) {
        formatted['XAGUSD'] = {
          price: silverPrice.price,
          timestamp: silverPrice.timestamp,
          source: 'FCS API'
        };
      }
      
      this.priceCache = formatted;
      this.lastUpdate = new Date().toISOString();

      console.log('✅ Prices updated:', Object.keys(formatted).join(', '));

    } catch (error) {
      console.error('❌ Price fetch error:', error.message);
    }
  }

  async autoScanSMT() {
    try {
      console.log('🔄 Auto-scanning SMT...');
      const SMTDetectionService = require('./smtDetection.service');
      const NotificationService = require('./notification.service');
      
      const groups = ['gold', 'forex', 'indices'];
      
      for (const group of groups) {
        const result = await SMTDetectionService.detectRealTimeSMT(group);
        
        if (result.success && result.signals && result.signals.length > 0) {
          console.log(`📊 Auto-scan found ${result.signals.length} signals for ${group}`);
          
          for (const signal of result.signals) {
            // ✅ Only send notifications for high-confidence signals
            if (signal.confidence > 80) {
              const userId = 1; // Replace with actual user ID
              await NotificationService.sendSignal(userId, {
                action: signal.type === 'BULLISH' ? 'BUY' : 'SELL',
                instrument: signal.primaryAsset,
                entry: signal.primaryPrice,
                stopLoss: signal.primaryPrice * 0.995,
                takeProfits: [
                  signal.primaryPrice * 1.005,
                  signal.primaryPrice * 1.012,
                  signal.primaryPrice * 1.025
                ],
                riskReward: 2.5,
                confidence: signal.confidence,
                reasoning: signal.description
              });
            }
          }
          
          this.emit('smt-update', result.signals);
        }
      }
    } catch (error) {
      console.error('❌ Auto-scan error:', error.message);
    }
  }

  onSMTUpdate(callback) {
    this.smtDetectionCallback = callback;
  }

  emit(event, data) {
    if (event === 'smt-update' && this.smtDetectionCallback) {
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
    console.log('🛑 Data services stopped');
  }
}

module.exports = new WebSocketService();