const Trade = require("../models/Trade");
const { validationResult } = require("express-validator");
// Remove any duplicate pool imports - only keep ONE

// If you have a duplicate pool declaration, remove it
// The pool should only be imported in the Trade model, not here

exports.createTrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const userId = req.user._id;
    const tradeData = req.body;

    // Convert tags from comma-separated string to array if needed
    if (typeof tradeData.tags === "string") {
      tradeData.tags = tradeData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const trade = await Trade.create({
      ...tradeData,
      user_id: userId,
    });

    res.status(201).json(trade);
  } catch (error) {
    console.error("Create trade error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTrades = async (req, res) => {
  try {
    const userId = req.user._id;
    const { instrument, direction, dateFrom, dateTo, outcome } = req.query;

    const trades = await Trade.findByUser(userId, {
      instrument,
      direction,
      dateFrom,
      dateTo,
      outcome,
    });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const trade = await Trade.findByIdAndUser(id, userId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    // Convert tags if needed
    if (typeof updateData.tags === "string") {
      updateData.tags = updateData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const updatedTrade = await Trade.update(id, userId, updateData);
    if (!updatedTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    res.json(updatedTrade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await Trade.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Trade not found" });
    }

    res.json({ message: "Trade deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await Trade.getStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEquityCurve = async (req, res) => {
  try {
    const userId = req.user._id;
    const equityData = await Trade.getEquityCurve(userId);
    res.json(equityData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyData = async (req, res) => {
  try {
    const userId = req.user._id;
    const monthlyData = await Trade.getMonthlyData(userId);
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
