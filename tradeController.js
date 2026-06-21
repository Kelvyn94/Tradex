const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all trades for a user
const getTrades = async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId },
      include: {
        account: true,
        tags: true,
      },
      orderBy: { entryDate: "desc" },
    });
    res.json(trades);
  } catch (error) {
    console.error("Get trades error:", error);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
};

// Create a new trade
const createTrade = async (req, res) => {
  try {
    const {
      accountId,
      ticker,
      type,
      entryPrice,
      quantity,
      entryDate,
      fees,
      notes,
      tags,
    } = req.body;

    // Get user's account
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId: req.userId,
        accountId,
        ticker,
        type,
        entryPrice,
        quantity,
        entryDate: new Date(entryDate),
        fees: fees || 0,
        notes,
        status: "OPEN",
        // Connect or create tags
        tags: tags
          ? {
              connectOrCreate: tags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName },
              })),
            }
          : undefined,
      },
      include: {
        account: true,
        tags: true,
      },
    });

    res.status(201).json(trade);
  } catch (error) {
    console.error("Create trade error:", error);
    res.status(500).json({ error: "Failed to create trade" });
  }
};

// Close a trade
const closeTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { exitPrice, exitDate } = req.body;

    // Find trade and verify ownership
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId: req.userId },
    });

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    if (trade.status === "CLOSED") {
      return res.status(400).json({ error: "Trade already closed" });
    }

    // Calculate PnL
    let pnl;
    if (trade.type === "LONG") {
      pnl = (exitPrice - trade.entryPrice) * trade.quantity - trade.fees;
    } else {
      // SHORT
      pnl = (trade.entryPrice - exitPrice) * trade.quantity - trade.fees;
    }

    // Update trade
    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        exitPrice,
        exitDate: new Date(exitDate),
        pnl,
        status: "CLOSED",
      },
      include: {
        account: true,
        tags: true,
      },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: trade.accountId },
      data: {
        balance: {
          increment: pnl,
        },
      },
    });

    res.json(updatedTrade);
  } catch (error) {
    console.error("Close trade error:", error);
    res.status(500).json({ error: "Failed to close trade" });
  }
};

module.exports = { getTrades, createTrade, closeTrade };
