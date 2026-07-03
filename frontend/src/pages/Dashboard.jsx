// Add to imports
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Percent,
  Activity,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/client";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState({});
  const [wsStatus, setWsStatus] = useState("connecting");
  const [smtSignals, setSmtSignals] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchLivePrices();

    const priceInterval = setInterval(fetchLivePrices, 30000);
    const statusInterval = setInterval(checkWebSocketStatus, 10000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, smtRes] = await Promise.all([
        api.get("/trades/stats"),
        api.post("/ai/detect-smt", { groupName: "gold" }),
      ]);

      setStats(statsRes.data);
      if (smtRes.data.success && smtRes.data.signals?.length > 0) {
        setSmtSignals(smtRes.data.signals.slice(0, 3));
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const response = await api.get("/ai/prices");
      setLivePrices(response.data.prices || {});
    } catch (error) {
      // Silently fail - prices are not critical
    }
  };

  const checkWebSocketStatus = async () => {
    try {
      const response = await api.get("/ai/market-status");
      setWsStatus(
        response.data.status?.connected ? "connected" : "disconnected",
      );
    } catch (error) {
      setWsStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get key prices
  const goldPrice = livePrices?.XAUUSD?.price || "---";
  const silverPrice = livePrices?.XAGUSD?.price || "---";
  const eurUsdPrice = livePrices?.EURUSD?.price || "---";

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          {greeting()}, {user?.username}! 👋
          <span className="text-sm font-normal flex items-center gap-2">
            <Activity
              className={`w-3 h-3 ${wsStatus === "connected" ? "text-success animate-pulse" : "text-danger"}`}
            />
            <span className="text-xs text-gray-400">
              {wsStatus === "connected" ? "Live" : "Disconnected"}
            </span>
          </span>
        </h1>
        <p className="text-gray-400 mt-1">Welcome to your trading journal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Live Prices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">XAUUSD (Gold)</span>
            <span className="text-xs text-success animate-pulse">● Live</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {goldPrice}
          </div>
          <div className="text-xs text-gray-500 mt-1">+0.05%</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">XAGUSD (Silver)</span>
            <span className="text-xs text-success animate-pulse">● Live</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {silverPrice}
          </div>
          <div className="text-xs text-gray-500 mt-1">+0.03%</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">EURUSD</span>
            <span className="text-xs text-success animate-pulse">● Live</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {eurUsdPrice}
          </div>
          <div className="text-xs text-gray-500 mt-1">-0.02%</div>
        </div>
      </div>

      {/* Recent SMT Signals (if any) */}
      {smtSignals.length > 0 && (
        <div className="card mb-6 border border-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-cond text-accent tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Recent SMT Signals
            </h3>
            <span className="text-xs text-gray-500">Live detection</span>
          </div>
          <div className="space-y-2">
            {smtSignals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-dark-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {signal.type === "BULLISH" ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-danger" />
                  )}
                  <span className="text-sm text-white">
                    {signal.primaryAsset}
                  </span>
                  <span className="text-xs text-gray-400">
                    vs {signal.correlatedAsset}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${signal.confidence > 80 ? "text-success" : "text-warning"}`}
                  >
                    {signal.confidence}% confidence
                  </span>
                  <span className="text-xs text-gray-500">
                    {signal.timeframe}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Message */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4">
          Welcome to TRADEX
        </h3>
        <p className="text-gray-400">
          {stats?.total > 0
            ? `You have ${stats.total} trades logged. Keep up the good work! 📈`
            : "Start logging your trades to see detailed analytics and performance metrics."}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
