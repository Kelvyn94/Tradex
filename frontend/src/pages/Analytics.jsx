import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Award,
  Calendar,
} from "lucide-react";
import api from "../api/client";
import toast from "react-hot-toast";
import PageContainer from "../components/common/PageContainer";

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/trades/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer className="py-20">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </PageContainer>
    );
  }

  const statCards = [
    {
      title: "Total P&L",
      value: `$${stats?.totalPnl?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: stats?.totalPnl >= 0 ? "text-success" : "text-danger",
    },
    {
      title: "Win Rate",
      value: `${stats?.winRate?.toFixed(1) || "0"}%`,
      icon: Percent,
      color: stats?.winRate >= 50 ? "text-success" : "text-danger",
    },
    {
      title: "Avg R:R",
      value: `${stats?.avgRR?.toFixed(2) || "0"}:1`,
      icon: Award,
      color: "text-accent",
    },
    {
      title: "Total Trades",
      value: stats?.total || 0,
      icon: TrendingUp,
      color: "text-accent",
    },
  ];

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Performance metrics and trading insights
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-dark-800 border border-dark-700 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-cond text-gray-500 tracking-wider">
                  {stat.title}
                </p>
                <p
                  className={`text-2xl font-mono font-bold mt-1 ${stat.color}`}
                >
                  {stat.value}
                </p>
              </div>
              {stat.icon && <stat.icon className={`w-6 h-6 ${stat.color}`} />}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4">
          Performance Overview
        </h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>Advanced analytics coming soon!</p>
          <p className="text-sm mt-2">
            Track your performance with detailed charts and metrics.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Analytics;
