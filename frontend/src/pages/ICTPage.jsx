/**
 * ICT Analysis Page
 * Displays ICT market structure analysis from Data Engine API
 */

import React, { useState } from "react";
import dataEngineApi from "../api/dataEngine";
import PageContainer from "../components/common/PageContainer";

export default function ICTPage() {
  const [asset, setAsset] = useState("EURUSD");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assets = ["EURUSD", "GBPUSD", "XAUUSD", "XAGUSD", "XAUEUR", "XAUGBP"];

  const fetchICT = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dataEngineApi.getICT(asset);
      setAnalysis(result);
    } catch (err) {
      console.error("Error fetching ICT analysis:", err);
      setError("Failed to load ICT analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-white">🧠 ICT Analysis</h1>

      {/* Asset Selector */}
      <div className="flex gap-4 mb-6">
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
        >
          {assets.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          onClick={fetchICT}
          disabled={loading}
          className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-white"
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 p-4 rounded-lg mb-4 text-red-200">
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Signal Card */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold mb-2 text-white">📊 Signal</h3>
            <p className="text-2xl font-bold text-white">
              {analysis.signal?.action || "HOLD"}
            </p>
            <p className="text-sm text-gray-400">
              Confidence:{" "}
              {((analysis.signal?.confidence || 0) * 100).toFixed(0)}%
            </p>
            <div className="mt-2">
              {analysis.signal?.reasons?.map((reason, i) => (
                <div key={i} className="text-xs text-gray-300">
                  • {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Market Structure */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold mb-2 text-white">📈 Market Structure</h3>
            <p className="text-white">
              Trend:{" "}
              {analysis.market_structure?.current_structure?.trend || "N/A"}
            </p>
            <p className="text-sm text-gray-400">
              Phase: {analysis.market_structure?.market_phase || "N/A"}
            </p>
          </div>

          {/* Order Blocks */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold mb-2 text-white">📦 Order Blocks</h3>
            <p className="text-white">
              Bullish: {analysis.order_blocks?.bullish?.length || 0}
            </p>
            <p className="text-white">
              Bearish: {analysis.order_blocks?.bearish?.length || 0}
            </p>
          </div>

          {/* FVGs */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold mb-2 text-white">📉 FVGs</h3>
            <p className="text-white">Total: {analysis.fvgs?.length || 0}</p>
            <p className="text-white">
              Unfilled: {analysis.unfilled_fvgs?.length || 0}
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
