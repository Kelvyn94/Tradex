import React, { useState, useEffect } from "react";
import { X, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";

const TradeForm = ({
  isOpen,
  onClose,
  onSave,
  trade = null,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    direction: "Long",
    entry: "",
    exit: "",
    size: 0.01,
    stopLoss: "",
    takeProfit: "",
    tags: "",
    notes: "",
  });

  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load trade data for editing
  useEffect(() => {
    if (trade && isEditing) {
      setFormData({
        date: trade.date || new Date().toISOString().split("T")[0],
        instrument: trade.instrument || "",
        direction: trade.direction || "Long",
        entry: trade.entry || "",
        exit: trade.exit || "",
        size: trade.size || 0.01,
        stopLoss: trade.stopLoss || "",
        takeProfit: trade.takeProfit || "",
        tags: Array.isArray(trade.tags) ? trade.tags.join(", ") : "",
        notes: trade.notes || "",
      });
    }
  }, [trade, isEditing]);

  // Calculate P&L preview
  useEffect(() => {
    calculatePreview();
  }, [
    formData.entry,
    formData.exit,
    formData.size,
    formData.stopLoss,
    formData.takeProfit,
    formData.direction,
  ]);

  const calculatePreview = () => {
    const entry = parseFloat(formData.entry);
    const exit = parseFloat(formData.exit);
    const size = parseFloat(formData.size);
    const stopLoss = parseFloat(formData.stopLoss);
    const takeProfit = parseFloat(formData.takeProfit);

    if (!entry || !exit || !size) {
      setPreview(null);
      return;
    }

    const diff = formData.direction === "Long" ? exit - entry : entry - exit;
    const pnl = diff * size;
    const pnlPct = (diff / entry) * 100;

    let riskReward = null;
    let riskInDollars = null;
    if (entry && stopLoss && takeProfit) {
      const risk = Math.abs(entry - stopLoss);
      const reward = Math.abs(takeProfit - entry);
      riskReward = risk === 0 ? null : reward / risk;
      riskInDollars = risk * size;
    }

    setPreview({
      pnl,
      pnlPct,
      riskReward,
      riskInDollars,
      isWin: pnl >= 0,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Parse values
    const entry = parseFloat(formData.entry);
    const exit = parseFloat(formData.exit);
    const size = parseFloat(formData.size);
    const stopLoss = formData.stopLoss ? parseFloat(formData.stopLoss) : null;
    const takeProfit = formData.takeProfit
      ? parseFloat(formData.takeProfit)
      : null;

    // Validate
    if (!formData.instrument || isNaN(entry) || isNaN(exit) || isNaN(size)) {
      toast.error("Please fill in all required fields with valid numbers");
      return;
    }

    if (entry <= 0 || exit <= 0 || size <= 0) {
      toast.error("Entry, Exit, and Size must be positive numbers");
      return;
    }

    // Prepare data for API - simplified, no instrument_type
    const tradeData = {
      date: formData.date,
      instrument: formData.instrument.toUpperCase().trim(),
      direction: formData.direction,
      entry: entry,
      exit: exit,
      size: size,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: formData.notes || "",
    };

    setSubmitting(true);
    try {
      await onSave(tradeData);
    } catch (error) {
      toast.error("Failed to save trade");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? "Edit Trade" : "New Trade Entry"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-dark"
                required
              />
            </div>

            {/* Instrument - Free text input */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Instrument *
              </label>
              <input
                type="text"
                name="instrument"
                value={formData.instrument}
                onChange={handleChange}
                placeholder="e.g., XAUUSD, EURUSD, AAPL, BTCUSD"
                className="input-dark"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any instrument (Gold, Forex, Stocks, Crypto)
              </p>
            </div>

            {/* Direction */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Direction *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, direction: "Long" }))
                  }
                  className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                    formData.direction === "Long"
                      ? "bg-success/20 text-success border border-success"
                      : "bg-dark-900 text-gray-400 border border-dark-700 hover:border-success/50"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Long (Buy)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, direction: "Short" }))
                  }
                  className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                    formData.direction === "Short"
                      ? "bg-danger/20 text-danger border border-danger"
                      : "bg-dark-900 text-gray-400 border border-dark-700 hover:border-danger/50"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                  Short (Sell)
                </button>
              </div>
            </div>

            {/* Entry Price */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Entry Price *
              </label>
              <input
                type="number"
                name="entry"
                value={formData.entry}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
                className="input-dark"
                required
              />
            </div>

            {/* Exit Price */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Exit Price *
              </label>
              <input
                type="number"
                name="exit"
                value={formData.exit}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
                className="input-dark"
                required
              />
            </div>

            {/* Position Size */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Position Size (Lots/Units) *
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="0.01"
                step="0.01"
                min="0.01"
                className="input-dark"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                0.01 lots = 1 micro lot (for Forex/Gold)
              </p>
            </div>

            {/* Stop Loss */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
                className="input-dark"
              />
            </div>

            {/* Take Profit */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Take Profit
              </label>
              <input
                type="number"
                name="takeProfit"
                value={formData.takeProfit}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
                className="input-dark"
              />
            </div>

            {/* Tags */}
            <div className="form-group md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., gold, breakout, momentum, scalping"
                className="input-dark"
              />
            </div>

            {/* Notes */}
            <div className="form-group md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Trade rationale, emotions, lessons learned..."
                rows="3"
                className="input-dark resize-none"
              />
            </div>
          </div>

          {/* Live P&L Preview */}
          {preview && (
            <div className="mt-6 p-4 bg-dark-900 rounded-lg border border-dark-700">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-gray-300">
                  Live P&L Preview
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">P&L ($)</p>
                  <p
                    className={`text-lg font-mono font-bold ${preview.isWin ? "text-success" : "text-danger"}`}
                  >
                    {preview.isWin ? "+" : ""}
                    {preview.pnl.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">P&L (%)</p>
                  <p
                    className={`text-lg font-mono font-bold ${preview.isWin ? "text-success" : "text-danger"}`}
                  >
                    {preview.isWin ? "+" : ""}
                    {preview.pnlPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk:Reward</p>
                  <p className="text-lg font-mono font-bold text-accent">
                    {preview.riskReward
                      ? `${preview.riskReward.toFixed(2)}:1`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Amount</p>
                  <p className="text-lg font-mono font-bold text-warning">
                    {preview.riskInDollars
                      ? `$${preview.riskInDollars.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Update Trade"
                  : "Save Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
