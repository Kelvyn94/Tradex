// frontend/src/pages/AIAssistant.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Zap,
  Activity,
  DollarSign,
  RefreshCw,
  Upload,
  X,
  Image,
  BarChart3,
} from "lucide-react";
import api from "../api/client";
import toast from "react-hot-toast";

const AIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [prices, setPrices] = useState({});
  const [marketStatus, setMarketStatus] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("gold");
  const [assetGroups] = useState(["gold", "forex", "indices"]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotAnalysis, setScreenshotAnalysis] = useState(null);
  const [analyzingScreenshot, setAnalyzingScreenshot] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMarketData();
    const priceInterval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (autoScanEnabled) {
      const autoScanInterval = setInterval(() => {
        runDetection(true);
      }, 300000);
      return () => clearInterval(autoScanInterval);
    }
  }, [autoScanEnabled, selectedGroup]);

  const fetchMarketData = async () => {
    try {
      const [pricesRes, statusRes] = await Promise.all([
        api.get("/ai/prices"),
        api.get("/ai/market-status"),
      ]);
      setPrices(pricesRes.data.prices || {});
      setMarketStatus(statusRes.data.status);
    } catch (error) {
      console.error("Market data fetch error:", error);
    }
  };

  const runDetection = async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    try {
      const response = await api.post("/ai/detect-smt", {
        groupName: selectedGroup,
      });

      if (response.data.success) {
        setSignals(response.data.signals || []);
        setRecommendations(response.data.recommendations || []);
        if (!isAuto && response.data.totalSignals > 0) {
          toast.success(`Found ${response.data.totalSignals} SMT signals`);
        }
      }
    } catch (error) {
      if (!isAuto) toast.error("Detection failed");
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      await api.post("/ai/test-notification");
      toast.success("📱 Test notification sent! Check your phone.");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const handleScreenshotUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setScreenshot(base64);
      setScreenshotPreview(reader.result);
      toast.success('Chart image uploaded! Click "Analyze Chart"');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeScreenshot = async () => {
    if (!screenshot) {
      toast.error("Please upload a chart screenshot first");
      return;
    }

    setAnalyzingScreenshot(true);
    try {
      const response = await api.post("/ai/analyze-screenshot", {
        image: screenshot,
        context: {
          instrument: "XAUUSD",
          timeframe: "4H",
        },
      });

      if (response.data.success) {
        setScreenshotAnalysis(response.data.analysis);
        toast.success("Chart analysis complete!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to analyze chart");
    } finally {
      setAnalyzingScreenshot(false);
    }
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    setScreenshotAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderAnalysis = () => {
    if (!screenshotAnalysis) return null;

    const analysisData = screenshotAnalysis.analysis || screenshotAnalysis;
    const isStructured =
      typeof analysisData === "object" && !Array.isArray(analysisData);

    return (
      <div className="mt-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
        <h4 className="text-sm font-medium text-accent mb-3">
          📊 Chart Analysis
        </h4>

        {isStructured ? (
          <div className="space-y-3">
            {analysisData.levels && analysisData.levels.length > 0 && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-xs text-gray-400 font-medium mb-2">
                  🔑 Key Levels
                </h5>
                <div className="flex flex-wrap gap-2">
                  {analysisData.levels.map((level, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-dark-700 rounded text-xs text-white border border-dark-600"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(analysisData.entry ||
              analysisData.stopLoss ||
              analysisData.takeProfit) && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-xs text-gray-400 font-medium mb-2">
                  🎯 Trade Setup
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analysisData.entry && (
                    <div>
                      <span className="text-xs text-gray-500">Entry</span>
                      <p className="text-sm text-white font-mono">
                        {analysisData.entry}
                      </p>
                    </div>
                  )}
                  {analysisData.stopLoss && (
                    <div>
                      <span className="text-xs text-gray-500">Stop Loss</span>
                      <p className="text-sm text-danger font-mono">
                        {analysisData.stopLoss}
                      </p>
                    </div>
                  )}
                  {analysisData.takeProfit && (
                    <div>
                      <span className="text-xs text-gray-500">Take Profit</span>
                      <p className="text-sm text-success font-mono">
                        {analysisData.takeProfit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(analysisData.risk ||
              analysisData.confidence ||
              screenshotAnalysis.confidence) && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-xs text-gray-400 font-medium mb-2">
                  ⚖️ Risk Assessment
                </h5>
                <div className="flex flex-wrap items-center gap-4">
                  {analysisData.risk && (
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        analysisData.risk.toLowerCase() === "low"
                          ? "bg-success/20 text-success"
                          : analysisData.risk.toLowerCase() === "medium"
                            ? "bg-warning/20 text-warning"
                            : "bg-danger/20 text-danger"
                      }`}
                    >
                      Risk: {analysisData.risk}
                    </span>
                  )}
                  {(analysisData.confidence ||
                    screenshotAnalysis.confidence) && (
                    <span className="text-sm text-gray-300">
                      Confidence:{" "}
                      <span className="text-accent font-bold">
                        {analysisData.confidence ||
                          screenshotAnalysis.confidence}
                        %
                      </span>
                    </span>
                  )}
                  {analysisData.probability && (
                    <span className="text-sm text-gray-300">
                      Probability:{" "}
                      <span className="text-white font-medium">
                        {analysisData.probability}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {analysisData.analysisText && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-xs text-gray-400 font-medium mb-2">
                  📝 Analysis
                </h5>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {analysisData.analysisText}
                </p>
              </div>
            )}

            {analysisData.reasoning && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-xs text-gray-400 font-medium mb-2">
                  💡 Reasoning
                </h5>
                <p className="text-sm text-gray-300">
                  {analysisData.reasoning}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-dark-800 rounded-lg">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {typeof analysisData === "string"
                ? analysisData
                : JSON.stringify(analysisData, null, 2)}
            </p>
          </div>
        )}

        {screenshotAnalysis.timestamp && (
          <div className="mt-2 text-xs text-gray-500 text-right">
            Analyzed: {new Date(screenshotAnalysis.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            AI Trading Assistant
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time SMT detection, chart analysis, and trade recommendations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testNotification}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <Bell className="w-4 h-4" />
            Test Alert
          </button>
          <button
            onClick={() => runDetection(false)}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {loading ? "Scanning..." : "Scan Now"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Asset Group:</span>
            {assetGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedGroup === group
                    ? "bg-accent text-dark-900"
                    : "bg-dark-700 text-gray-400 hover:text-white"
                }`}
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-300">Auto-Scan:</span>
            <button
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${
                autoScanEnabled ? "bg-accent" : "bg-dark-600"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  autoScanEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">
              {autoScanEnabled ? "Every 5 min" : "Manual"}
            </span>
          </div>
        </div>
      </div>

      <div className="card border border-accent/30">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Chart Screenshot Analysis
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload Chart
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotUpload}
                accept="image/*"
                className="hidden"
              />
              {screenshotPreview && (
                <button
                  onClick={clearScreenshot}
                  className="text-danger hover:text-danger/80 text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {screenshotPreview && (
                <span className="text-xs text-success">✅ Image uploaded</span>
              )}
            </div>
            {screenshotPreview && (
              <div className="mt-2">
                <img
                  src={screenshotPreview}
                  alt="Chart"
                  className="max-h-48 rounded-lg border border-dark-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Take screenshot from TradingView
                </p>
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalyzeScreenshot}
              disabled={!screenshot || analyzingScreenshot}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {analyzingScreenshot ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {analyzingScreenshot ? "Analyzing..." : "Analyze Chart"}
            </button>
          </div>
        </div>

        {renderAnalysis()}
      </div>

      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-success" />
            <div>
              <div className="text-xs text-gray-500">WebSocket</div>
              <div className="text-sm font-medium text-success">
                {marketStatus?.connected ? "Connected" : "Disconnected"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent" />
            <div>
              <div className="text-xs text-gray-500">Last Update</div>
              <div className="text-sm font-medium text-white">
                {marketStatus?.lastUpdate
                  ? new Date(marketStatus.lastUpdate).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-warning" />
            <div>
              <div className="text-xs text-gray-500">Active Symbols</div>
              <div className="text-sm font-medium text-white">
                {marketStatus?.activeSymbols || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-accent" />
            <div>
              <div className="text-xs text-gray-500">Auto-Scan</div>
              <div className="text-sm font-medium text-success">
                {autoScanEnabled ? "Active" : "Off"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Live Prices
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(prices)
            .slice(0, 8)
            .map(([symbol, data]) => (
              <div
                key={symbol}
                className="bg-dark-900 p-3 rounded-lg border border-dark-700"
              >
                <div className="text-xs text-gray-500">{symbol}</div>
                <div className="text-sm font-mono text-white">
                  {data.price ? Number(data.price).toFixed(4) : "---"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {data.source || "Live"}
                </div>
              </div>
            ))}
        </div>
      </div>

      {signals.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-cond text-accent tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            SMT Divergence Signals ({signals.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signals.map((signal, index) => (
              <div
                key={index}
                className="p-3 bg-dark-900 rounded-lg border border-dark-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {signal.type === "BULLISH" ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-danger" />
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {signal.type} SMT Divergence ({signal.timeframe})
                      </div>
                      <div className="text-xs text-gray-400">
                        {signal.primaryAsset} vs {signal.correlatedAsset}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Confidence: {signal.confidence}%
                    </span>
                    {signal.timeframeAlignment?.aligned && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                        ✅{" "}
                        {signal.timeframeAlignment.higherTimeframe ||
                          signal.timeframeAlignment.lowerTimeframe}{" "}
                        aligned
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  {signal.description}
                </p>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>Entry: {signal.primaryPrice}</span>
                  <span>Correlated: {signal.correlatedPrice}</span>
                  <span>Group: {signal.group}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="card border-2 border-accent/30">
          <h3 className="text-sm font-cond text-accent tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Trade Recommendations
          </h3>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-4 bg-dark-900 rounded-lg mb-3 last:mb-0"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Action</div>
                  <div
                    className={`text-lg font-bold ${rec.action === "BUY" ? "text-success" : "text-danger"}`}
                  >
                    {rec.action} {rec.instrument}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Entry</div>
                  <div className="text-lg font-mono text-white">
                    {rec.entry}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Stop Loss</div>
                  <div className="text-lg font-mono text-danger">
                    {rec.stopLoss}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Confidence</div>
                  <div className="text-lg font-mono text-accent">
                    {rec.confidence}%
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-500">
                <span>Timeframe: {rec.timeframe}</span>
                <span>R:R: {rec.riskReward}:1</span>
                <span>Correlated: {rec.correlated}</span>
              </div>
              <div className="mt-2 p-2 bg-dark-800 rounded">
                <p className="text-sm text-gray-300">{rec.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {signals.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg font-medium">No SMT signals detected</p>
          <p className="text-sm">
            {autoScanEnabled
              ? "Auto-scan is running every 5 minutes. You will be notified when signals appear."
              : 'Click "Scan Now" to check for divergences'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
