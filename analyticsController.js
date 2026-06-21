const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAnalytics = async (req, res) => {
  try {
    // Get all closed trades for this user
    const trades = await prisma.trade.findMany({
      where: {
        userId: req.userId,
        status: "CLOSED",
      },
    });

    if (trades.length === 0) {
      return res.json({
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        // More metrics...
      });
    }

    // Calculate metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const winRate = (winningTrades.length / totalTrades) * 100;

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
          winningTrades.length
        : 0;

    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + t.pnl, 0) /
              losingTrades.length,
          )
        : 0;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Monthly breakdown
    const monthlyData = {};
    trades.forEach((trade) => {
      const month = trade.exitDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { profit: 0, loss: 0, count: 0 };
      }
      if (trade.pnl > 0) {
        monthlyData[month].profit += trade.pnl;
      } else {
        monthlyData[month].loss += Math.abs(trade.pnl);
      }
      monthlyData[month].count += 1;
    });

    const monthlyBreakdown = Object.entries(monthlyData).map(
      ([month, data]) => ({
        month,
        ...data,
      }),
    );

    res.json({
      totalTrades,
      winRate: parseFloat(winRate.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      averageWin: parseFloat(avgWin.toFixed(2)),
      averageLoss: parseFloat(avgLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      monthlyBreakdown,
      winningTradesCount: winningTrades.length,
      losingTradesCount: losingTrades.length,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
};

module.exports = { getAnalytics };
