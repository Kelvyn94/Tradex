const TwelveDataService = require('./twelveData.service');
const ExchangeRateService = require('./exchangeRate.service');
const FCSApiService = require('./fcsApi.service');

class WebSocketService {
  constructor() {
    this.priceCache = {};
    this.lastUpdate = null;
    this.updateInterval = null;
    this.autoScanInterval = null;
    this.smtDetectionCallback = null;
    this.lastFetchTime = null;
    this.cacheTTL = 60000; // 1 minute cache
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

    // Sync price cache every 30 seconds
    setInterval(() => {
      this.syncPrices();
    }, 30000);
  }

  async fetchAllPrices() {
    try {
      // ✅ Check cache first
      const now = Date.now();
      if (this.lastFetchTime && (now - this.lastFetchTime) < this.cacheTTL) {
        console.log('⏰ Using cached prices (fresh)');
        return this.priceCache;
      }

      // Fetch from Twelve Data
      const twelvePrices = await TwelveDataService.fetchAllPrices();
      
      // Fetch from ExchangeRate
      const exchangeRates = await ExchangeRateService.fetchAllRates();
      
      // Fetch Silver from FCS API (only during trading hours)
      const silverPrice = await FCSApiService.fetchSilverPrice();
      
      // Format for frontend
      const formatted = {};
      const symbolMap = {
        'GBP/USD': 'GBPUSD',
        'XAU/USD': 'XAUUSD',
        'EUR/USD': 'EURUSD'
      };
      
      // Add ExchangeRate prices
      for (const [symbol, data] of Object.entries(exchangeRates)) {
        const key = symbolMap[symbol] || symbol;
        formatted[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: 'ExchangeRate-API'
        };
      }
      
      // Add Twelve Data prices
      for (const [symbol, data] of Object.entries(twelvePrices)) {
        const key = symbolMap[symbol] || symbol;
        formatted[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: 'Twelve Data'
        };
      }
      
      // Add FCS API (Silver)
      if (silverPrice) {
        formatted['XAGUSD'] = {
          price: silverPrice.price,
          timestamp: silverPrice.timestamp,
          source: 'FCS API'
        };
      }
      
      this.priceCache = formatted;
      this.lastUpdate = new Date().toISOString();
      this.lastFetchTime = now;
      
      console.log('✅ Prices updated:', Object.keys(formatted).join(', '));
      
    } catch (error) {
      console.error('❌ Price fetch error:', error.message);
    }
  }

  syncPrices() {
    // Sync Twelve Data prices
    const twelvePrices = TwelveDataService.getAllPrices();
    const symbolMap = {
      'XAU/USD': 'XAUUSD',
      'EUR/USD': 'EURUSD'
    };
    
    for (const [symbol, data] of Object.entries(twelvePrices)) {
      const key = symbolMap[symbol] || symbol;
      if (data.price && !this.priceCache[key]) {
        this.priceCache[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: 'Twelve Data'
        };
      }
    }
    
    // Sync ExchangeRate prices
    const exchangePrices = ExchangeRateService.getAllPrices();
    const exchangeMap = {
      'GBP/USD': 'GBPUSD'
    };
    
    for (const [symbol, data] of Object.entries(exchangePrices)) {
      const key = exchangeMap[symbol] || symbol;
      if (data.price) {
        this.priceCache[key] = {
          price: data.price,
          timestamp: data.timestamp,
          source: 'ExchangeRate-API'
        };
      }
    }
    
    // Sync FCS API (Silver)
    const fcsPrices = FCSApiService.getAllPrices();
    if (fcsPrices['XAG/USD']) {
      this.priceCache['XAGUSD'] = {
        price: fcsPrices['XAG/USD'].price,
        timestamp: fcsPrices['XAG/USD'].timestamp,
        source: 'FCS API'
      };
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