/**
 * Correlation Page
 * Displays cross-asset correlation matrix from Data Engine API
 */

import React, { useState, useEffect } from "react";
import dataEngineApi from "../api/dataEngine";
import PageContainer from "../components/common/PageContainer";

export default function CorrelationPage() {
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCorrelation();
  }, []);

  const fetchCorrelation = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dataEngineApi.getCorrelation();
      setCorrelation(result);
    } catch (err) {
      console.error("Error fetching correlation:", err);
      setError("Failed to load correlation data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer className="py-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl text-gray-400">
            Loading correlation data...
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="py-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchCorrelation}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
        >
          Retry
        </button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-white">
        🔗 Correlation Matrix
      </h1>

      {correlation?.correlation_matrix ? (
        <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-white">Asset</th>
                {Object.keys(correlation.correlation_matrix).map((asset) => (
                  <th key={asset} className="p-2 text-center text-white">
                    {asset}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(correlation.correlation_matrix).map(
                ([rowAsset, row]) => (
                  <tr key={rowAsset}>
                    <td className="p-2 font-medium text-white">{rowAsset}</td>
                    {Object.entries(row).map(([colAsset, value]) => (
                      <td
                        key={colAsset}
                        className="p-2 text-center"
                        style={{
                          color:
                            value > 0.5
                              ? "#4ade80"
                              : value < -0.5
                                ? "#f87171"
                                : "#94a3b8",
                          fontWeight: Math.abs(value) > 0.7 ? "bold" : "normal",
                        }}
                      >
                        {typeof value === "number" ? value.toFixed(2) : "N/A"}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400">No correlation data available</p>
      )}

      {/* Strong Correlations */}
      {correlation?.strong_correlations &&
        correlation.strong_correlations.length > 0 && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">
              📊 Strong Correlations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {correlation.strong_correlations
                .slice(0, 6)
                .map((pair, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-700 p-2 rounded"
                  >
                    <span className="text-white">
                      {pair.asset1} ↔ {pair.asset2}
                    </span>
                    <span
                      className={`font-bold ${pair.correlation > 0.7 ? "text-green-400" : "text-red-400"}`}
                    >
                      {(pair.correlation * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
    </PageContainer>
  );
}
