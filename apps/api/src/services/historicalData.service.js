// Backend/src/services/historicalData.service.js
//
// getHistoricalData() used to fall back to a random-walk mock generator
// whenever its query against a `historical_prices` table failed - and that
// table has never existed in the schema, so every call fell through to
// fabricated data. That mock data fed smtDetection.service.js's
// checkTimeframeAlignment(), which uses it to boost SMT signal confidence.
// A trading signal's confidence should never be inflated by numbers nobody
// actually observed in the market, so this now returns null (data
// unavailable) instead of inventing a plausible-looking series. Callers
// must treat null as "couldn't check," not "checked, nothing found."
class HistoricalDataService {
  constructor() {
    this.instruments = ["XAUUSD", "XAGUSD", "EURUSD", "GBPUSD"];
    this._warnedUnavailable = false;
  }

  /**
   * Get historical data for an instrument. Returns null if no real data
   * source is wired up yet - there is currently no backing store for this
   * (see class comment above).
   */
  async getHistoricalData(_instrument, _timeframe = "1h", _limit = 100) {
    if (!this._warnedUnavailable) {
      console.warn(
        "HistoricalDataService: no real historical data source is wired up yet; " +
          "timeframe-alignment checks will be skipped rather than using fabricated data.",
      );
      this._warnedUnavailable = true;
    }
    return null;
  }

  /**
   * Get data for SMT detection (primary + correlated). Either side may be
   * null if historical data isn't available - callers must check for that
   * rather than assuming both series are present.
   */
  async getSMTData(primary, correlated, timeframe = "1h", lookback = 100) {
    const [primaryData, correlatedData] = await Promise.all([
      this.getHistoricalData(primary, timeframe, lookback),
      this.getHistoricalData(correlated, timeframe, lookback),
    ]);

    return {
      primary: primaryData,
      correlated: correlatedData,
    };
  }

  /**
   * Get all available instruments
   */
  getInstruments() {
    return this.instruments;
  }

  /**
   * Add a new instrument to track
   */
  addInstrument(instrument) {
    if (!this.instruments.includes(instrument)) {
      this.instruments.push(instrument);
    }
  }
}

module.exports = new HistoricalDataService();
