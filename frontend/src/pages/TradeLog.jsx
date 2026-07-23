import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import api from "../api/client";
import toast from "react-hot-toast";
import TradeForm from "../components/trades/TradeForm";
import PageContainer from "../components/common/PageContainer";

const TradeLog = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filter, setFilter] = useState({
    instrument: "",
    direction: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await api.get("/trades");
      setTrades(response.data || []);
    } catch (error) {
      toast.error("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrade = async (tradeData) => {
    try {
      const response = await api.post("/trades", tradeData);
      toast.success("Trade saved successfully!");
      setShowForm(false);
      await fetchTrades();
    } catch (error) {
      console.error("Create error:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.data?.details) {
        error.response.data.details.forEach((d) => toast.error(d.msg));
      } else {
        toast.error(error.response?.data?.error || "Failed to save trade");
      }
    }
  };

  const handleUpdateTrade = async (tradeData) => {
    try {
      await api.put(`/trades/${editingTrade.id}`, tradeData);
      toast.success("Trade updated successfully!");
      setShowForm(false);
      setEditingTrade(null);
      await fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update trade");
    }
  };

  const handleDeleteTrade = async (id) => {
    if (!confirm("Delete this trade? This cannot be undone.")) return;

    try {
      await api.delete(`/trades/${id}`);
      toast.success("Trade deleted");
      await fetchTrades();
    } catch (error) {
      toast.error("Failed to delete trade");
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrade(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let filtered = trades;

    if (filter.instrument) {
      filtered = filtered.filter(
        (t) =>
          t.instrument &&
          t.instrument.toLowerCase().includes(filter.instrument.toLowerCase()),
      );
    }
    if (filter.direction) {
      filtered = filtered.filter((t) => t.direction === filter.direction);
    }
    if (filter.dateFrom) {
      filtered = filtered.filter((t) => t.date >= filter.dateFrom);
    }
    if (filter.dateTo) {
      filtered = filtered.filter((t) => t.date <= filter.dateTo);
    }

    return filtered;
  };

  const filteredTrades = applyFilters();

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    return Number(value).toFixed(2);
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

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Trade Log</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Trade
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Instrument
            </label>
            <input
              type="text"
              name="instrument"
              value={filter.instrument}
              onChange={handleFilterChange}
              placeholder="Search instrument..."
              className="input-dark text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Direction
            </label>
            <select
              name="direction"
              value={filter.direction}
              onChange={handleFilterChange}
              className="input-dark text-sm"
            >
              <option value="">All</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filter.dateFrom}
              onChange={handleFilterChange}
              className="input-dark text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filter.dateTo}
              onChange={handleFilterChange}
              className="input-dark text-sm"
            />
          </div>
        </div>
      </div>

      {/* Trade Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-900">
              <tr className="text-left text-xs text-gray-500 border-b border-dark-700">
                <th className="px-4 py-3 font-cond tracking-wider">Date</th>
                <th className="px-4 py-3 font-cond tracking-wider">
                  Instrument
                </th>
                <th className="px-4 py-3 font-cond tracking-wider">
                  Direction
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-right">
                  Entry
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-right">
                  Exit
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-right">
                  Size
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-right">
                  P&L ($)
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-right">
                  P&L (%)
                </th>
                <th className="px-4 py-3 font-cond tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="text-4xl mb-2">📊</div>
                    <p>No trades found. Start logging your trades!</p>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  // Safely get values with fallbacks
                  const pnl =
                    trade.pnl !== undefined && trade.pnl !== null
                      ? Number(trade.pnl)
                      : 0;
                  const pnlPct =
                    trade.pnlPercentage !== undefined &&
                    trade.pnlPercentage !== null
                      ? Number(trade.pnlPercentage)
                      : 0;
                  const isWin = pnl >= 0;
                  const entry =
                    trade.entry !== undefined && trade.entry !== null
                      ? Number(trade.entry).toFixed(4)
                      : "0.0000";
                  const exit =
                    trade.exit !== undefined && trade.exit !== null
                      ? Number(trade.exit).toFixed(4)
                      : "0.0000";
                  const size =
                    trade.size !== undefined && trade.size !== null
                      ? Number(trade.size)
                      : 0;

                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">
                        {trade.date || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-white">
                        {trade.instrument || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            trade.direction === "Long"
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {trade.direction || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-300">
                        {entry}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-300">
                        {exit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-300">
                        {size}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-mono font-bold ${isWin ? "text-success" : "text-danger"}`}
                      >
                        {isWin ? "+" : ""}
                        {formatNumber(pnl)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-mono font-bold ${isWin ? "text-success" : "text-danger"}`}
                      >
                        {isWin ? "+" : ""}
                        {formatNumber(pnlPct)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditTrade(trade)}
                            className="p-1 hover:bg-dark-700 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-accent" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrade(trade.id)}
                            className="p-1 hover:bg-dark-700 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Form Modal */}
      <TradeForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={editingTrade ? handleUpdateTrade : handleCreateTrade}
        trade={editingTrade}
        isEditing={!!editingTrade}
      />
    </PageContainer>
  );
};

export default TradeLog;
