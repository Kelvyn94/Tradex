/**
 * Data Engine Dashboard Page
 * Shows AI insights, signals, and market overview from Data Engine API
 */

import React, { useState, useEffect } from "react";
import dataEngineApi from "../api/dataEngine";
import PageContainer from "../components/common/PageContainer";

export default function DataEngineDashboard() {
  const [insights, setInsights] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [insightsData, signalsData] = await Promise.all([
        dataEngineApi.getInsights(null, 10),
        dataEngineApi.getSignals(null, 5),
      ]);

      setInsights(insightsData.data || []);
      setSignals(signalsData.data || []);

      const assets = [
        "EURUSD",
        "GBPUSD",
        "XAUUSD",
        "XAGUSD",
        "XAUEUR",
        "XAUGBP",
      ];
      const pricePromises = assets.map((asset) =>
        dataEngineApi.getLatestPrice(asset).catch(() => null),
      );
      const priceResults = await Promise.all(pricePromises);

      const priceMap = {};
      assets.forEach((asset, index) => {
        if (priceResults[index]) {
          priceMap[asset] = priceResults[index];
        }
      });
      setPrices(priceMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load Data Engine data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer className="py-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl text-gray-400">Loading market data...</div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="py-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-white">
        📊 Data Engine Dashboard
      </h1>

      {/* Price Ticker */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {Object.entries(prices).map(([asset, data]) => (
          <div
            key={asset}
            className="bg-gray-800 p-3 rounded-lg border border-gray-700"
          >
            <div className="text-sm text-gray-400">{asset}</div>
            <div className="text-lg font-bold text-white">
              {data?.data?.close?.toFixed(4) || "..."}
            </div>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">
          🚨 Trading Signals
        </h2>
        {signals.length === 0 ? (
          <p className="text-gray-400">No active signals</p>
        ) : (
          <div className="space-y-2">
            {signals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-700 py-2"
              >
                <div>
                  <span className="font-bold text-white">
                    {signal.asset_symbol}
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm ${
                      signal.signal_type === "BUY"
                        ? "bg-green-600"
                        : signal.signal_type === "SELL"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                    }`}
                  >
                    {signal.signal_type}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Confidence: {(signal.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Feed */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">🧠 AI Insights</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {insights.length === 0 ? (
            <p className="text-gray-400">No insights available</p>
          ) : (
            insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white">
                      {insight.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      {insight.description}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(insight.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {insight.asset_symbol} •{" "}
                  {new Date(insight.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
