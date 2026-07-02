import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/client";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Percent,
} from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/trades/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          {greeting()}, {user?.username}! 👋
        </h1>
        <p className="text-gray-400 mt-1">Welcome to your trading journal</p>
      </div>

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

      <div className="mt-6 bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4">
          Welcome to TRADEX
        </h3>
        <p className="text-gray-400">
          Start logging your trades to see detailed analytics and performance
          metrics.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
