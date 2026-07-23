// Frontend/src/components/dashboard/SentimentWidget.jsx
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Newspaper,
  AlertCircle,
  Info,
} from "lucide-react";
import api from "../../api/client";
import toast from "react-hot-toast";

const SentimentWidget = ({ instrument = "XAUUSD" }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSentiment = async (showToast = false) => {
    try {
      const response = await api.get(`/sentiment/${instrument}`);
      if (response.data.success) {
        setSentiment(response.data.data);
        if (showToast) toast.success("Sentiment updated!");
      }
    } catch (error) {
      console.error("Sentiment fetch error:", error);
      if (showToast) toast.error("Failed to fetch sentiment");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    const interval = setInterval(() => fetchSentiment(), 1800000);
    return () => clearInterval(interval);
  }, [instrument]);

  const getSentimentColor = (overall) => {
    if (!overall) return "text-gray-400";
    switch (overall.toUpperCase()) {
      case "BULLISH":
        return "text-green-500";
      case "BEARISH":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getSentimentIcon = (overall) => {
    if (!overall) return <Minus className="w-5 h-5 text-gray-400" />;
    switch (overall.toUpperCase()) {
      case "BULLISH":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "BEARISH":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return "bg-gray-500";
    switch (risk.toUpperCase()) {
      case "LOW":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HIGH":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-dark-700 rounded w-24"></div>
          <div className="h-4 bg-dark-700 rounded w-12"></div>
        </div>
        <div className="h-8 bg-dark-700 rounded w-32 mb-2"></div>
        <div className="h-4 bg-dark-700 rounded w-full"></div>
      </div>
    );
  }

  if (!sentiment || !sentiment.success) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-cond text-gray-500 tracking-wider">
            📰 Sentiment
          </h3>
          <button
            onClick={() => fetchSentiment(true)}
            className="text-xs text-accent hover:text-accent/80"
          >
            Refresh
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          No sentiment data available
        </div>
      </div>
    );
  }

  const data = sentiment.synthesis || {};

  return (
    <div className="card border border-dark-700/70 bg-dark-800/70 p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-accent/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-cond text-accent tracking-wider">
            {instrument} Sentiment
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {sentiment.timestamp && (
            <span className="text-[10px] text-gray-500">
              {new Date(sentiment.timestamp).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => {
              setRefreshing(true);
              fetchSentiment(true);
            }}
            disabled={refreshing}
            className="text-gray-400 hover:text-accent transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1">
        {getSentimentIcon(data.overallSentiment)}
        <span
          className={`text-xl font-bold ${getSentimentColor(data.overallSentiment)}`}
        >
          {data.overallSentiment || "NEUTRAL"}
        </span>
        {data.confidence && (
          <span className="text-xs text-gray-400">
            {data.confidence}% confidence
          </span>
        )}
        {data.riskLevel && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] text-gray-500">Risk:</span>
            <span
              className={`w-2 h-2 rounded-full ${getRiskColor(data.riskLevel)}`}
            ></span>
            <span className="text-[10px] text-gray-400">{data.riskLevel}</span>
          </div>
        )}
      </div>

      {data.rationale && (
        <p className="text-xs text-gray-300 mt-2 border-t border-dark-700 pt-2 leading-relaxed">
          {data.rationale}
        </p>
      )}

      {data.keyThemes && data.keyThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.keyThemes.slice(0, 3).map((theme, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-dark-700 rounded text-[10px] text-gray-400 border border-dark-600"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {data.tradingImplication && (
        <div className="mt-2 p-2 bg-dark-900/50 rounded-lg border border-dark-700">
          <span className="text-[10px] text-gray-500">💡 Implication:</span>
          <span className="text-xs text-gray-300 ml-1">
            {data.tradingImplication}
          </span>
        </div>
      )}

      <div className="mt-2 text-[10px] text-gray-500">
        Based on {sentiment.details?.articlesAnalyzed || 0} news articles
        {sentiment.details?.sources && sentiment.details.sources.length > 0 && (
          <span className="ml-1">
            from {sentiment.details.sources.slice(0, 2).join(", ")}
            {sentiment.details.sources.length > 2 && " + more"}
          </span>
        )}
      </div>
    </div>
  );
};

export default SentimentWidget;
