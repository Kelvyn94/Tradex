// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/client";
import StatsCard from "../components/dashboard/StatsCard";
import EquityChart from "../components/dashboard/EquityChart";
import RecentTrades from "../components/dashboard/RecentTrades";
import SentimentWidget from "../components/dashboard/SentimentWidget";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [equity, setEquity] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/analytics/dashboard");
        setStats(response.data.stats);
        setEquity(response.data.equity || []);
        setRecentTrades(response.data.recentTrades || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statsData = [
    {
      title: "Total Trades",
      value: stats?.total || 0,
      icon: Activity,
      color: "blue",
    },
    {
      title: "Win Rate",
      value: `${stats?.winRate?.toFixed(1) || 0}%`,
      icon: BarChart3,
      color: stats?.winRate >= 50 ? "green" : "yellow",
    },
    {
      title: "Total P&L",
      value: `$${stats?.totalPnl?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: stats?.totalPnl >= 0 ? "green" : "red",
    },
    {
      title: "Avg R:R",
      value: `${stats?.avgRR?.toFixed(2) || "0.00"}:1`,
      icon: TrendingUp,
      color: "blue",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start lg:items-center lg:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight truncate">
            Welcome back,{" "}
            <span className="text-gradient">{user?.username || "Trader"}</span>{" "}
            👋
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Here's your trading overview for today
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm sm:text-base border border-green-500/20 whitespace-nowrap animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Market Open
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2">
          <div className="card-premium h-full min-h-[340px] md:min-h-[380px] hover-lift">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4">
              Equity Curve
            </h3>
            <EquityChart data={equity} />
          </div>
        </div>
        <div className="xl:col-span-1">
          <div className="card-premium h-full min-h-[340px] md:min-h-[380px] hover-lift">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4">
              Market Sentiment
            </h3>
            <SentimentWidget />
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card-premium hover-lift">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4">
          Recent Trades
        </h3>
        <RecentTrades trades={recentTrades} />
      </div>
    </div>
  );
}
