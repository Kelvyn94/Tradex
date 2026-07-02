const Trade = require("../models/Trade");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all data in parallel
    const [stats, equity, monthly] = await Promise.all([
      Trade.getStats(userId),
      Trade.getEquityCurve(userId),
      Trade.getMonthlyData(userId),
    ]);

    // Get recent trades
    const recentTrades = await Trade.findByUser(userId, {});
    const recent = recentTrades.slice(0, 10);

    res.json({
      stats: stats || {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        avgRR: 0,
        largestWin: 0,
        largestLoss: 0,
        maxConsecWin: 0,
        maxConsecLoss: 0,
      },
      equity,
      monthly,
      recentTrades: recent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const trades = await Trade.findByUser(userId, {});

    if (!trades.length) {
      return res.json({
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        expectancy: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
      });
    }

    const winningTrades = trades.filter((t) => (t.pnl || 0) > 0);
    const losingTrades = trades.filter((t) => (t.pnl || 0) < 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(
      losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    );

    // Calculate max drawdown
    let equity = 0;
    let maxEquity = 0;
    let maxDrawdown = 0;

    const sortedTrades = [...trades].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    sortedTrades.forEach((t) => {
      equity += t.pnl || 0;
      if (equity > maxEquity) maxEquity = equity;
      const drawdown = maxEquity - equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    res.json({
      totalTrades: trades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins,
      expectancy:
        trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / trades.length,
      avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      maxDrawdown,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
