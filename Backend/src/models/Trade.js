const pool = require("../config/database");

class Trade {
  static async create(tradeData) {
    const {
      user_id,
      date,
      instrument,
      direction,
      entry,
      exit,
      size,
      stop_loss,
      take_profit,
      tags = [],
      notes = "",
      instrumentType = "forex", // 'forex' or 'gold'
      pipValue = 0.1, // $0.10 per pip for 0.01 lots
    } = tradeData;

    // Calculate PnL
    const diff = direction === "Long" ? exit - entry : entry - exit;
    const pnl = diff * size;
    const pnl_percentage = entry !== 0 ? (diff / entry) * 100 : 0;

    // Calculate pip difference and profit in pips
    const pipDiff = Math.abs(exit - entry) * 10000; // For 4-decimal instruments
    const pips = direction === "Long" ? pipDiff : -pipDiff;
    const pipProfit = pips * pipValue * size; // pipValue is per lot

    // Calculate Risk:Reward ratio
    let risk_reward_ratio = null;
    if (entry && stop_loss && take_profit) {
      const risk = Math.abs(entry - stop_loss);
      const reward = Math.abs(take_profit - entry);
      risk_reward_ratio = risk === 0 ? null : reward / risk;
    }

    // Calculate risk in dollars (for risk management)
    const riskInDollars = stop_loss ? Math.abs(entry - stop_loss) * size : 0;

    const result = await pool.query(
      `INSERT INTO trades (
        user_id, date, instrument, direction, entry, exit, size,
        stop_loss, take_profit, pnl, pnl_percentage, risk_reward_ratio, 
        tags, notes, instrument_type, pip_value, pips, pip_profit, risk_in_dollars
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        user_id,
        date,
        instrument,
        direction,
        entry,
        exit,
        size,
        stop_loss || null,
        take_profit || null,
        pnl,
        pnl_percentage,
        risk_reward_ratio,
        tags,
        notes,
        instrumentType,
        pipValue,
        pips,
        pipProfit,
        riskInDollars,
      ],
    );
    return result.rows[0];
  }

  // ... rest of the methods remain the same

  // Find trades by user with filters
  static async findByUser(userId, filters = {}) {
    let query = "SELECT * FROM trades WHERE user_id = $1";
    const params = [userId];
    let paramCount = 1;

    if (filters.instrument) {
      paramCount++;
      query += ` AND instrument ILIKE $${paramCount}`;
      params.push(`%${filters.instrument}%`);
    }

    if (filters.direction) {
      paramCount++;
      query += ` AND direction = $${paramCount}`;
      params.push(filters.direction);
    }

    if (filters.dateFrom) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(filters.dateTo);
    }

    query += " ORDER BY date DESC";
    const result = await pool.query(query, params);
    let trades = result.rows;

    // Filter by outcome if specified
    if (filters.outcome === "win") {
      trades = trades.filter((t) => t.pnl >= 0);
    } else if (filters.outcome === "loss") {
      trades = trades.filter((t) => t.pnl < 0);
    }

    return trades;
  }

  // Find trade by ID and user
  static async findByIdAndUser(id, userId) {
    const result = await pool.query(
      "SELECT * FROM trades WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    return result.rows[0] || null;
  }

  // Update trade
  static async update(id, userId, updateData) {
    const {
      date,
      instrument,
      direction,
      entry,
      exit,
      size,
      stop_loss,
      take_profit,
      tags,
      notes,
    } = updateData;

    // Calculate PnL
    const diff = direction === "Long" ? exit - entry : entry - exit;
    const pnl = diff * size;
    const pnl_percentage = entry !== 0 ? (diff / entry) * 100 : 0;

    // Calculate Risk:Reward ratio
    let risk_reward_ratio = null;
    if (entry && stop_loss && take_profit) {
      const risk = Math.abs(entry - stop_loss);
      const reward = Math.abs(take_profit - entry);
      risk_reward_ratio = risk === 0 ? null : reward / risk;
    }

    const result = await pool.query(
      `UPDATE trades SET
        date = $1, instrument = $2, direction = $3, entry = $4,
        exit = $5, size = $6, stop_loss = $7, take_profit = $8,
        pnl = $9, pnl_percentage = $10, risk_reward_ratio = $11,
        tags = $12, notes = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND user_id = $15
      RETURNING *`,
      [
        date,
        instrument,
        direction,
        entry,
        exit,
        size,
        stop_loss || null,
        take_profit || null,
        pnl,
        pnl_percentage,
        risk_reward_ratio,
        tags,
        notes,
        id,
        userId,
      ],
    );
    return result.rows[0] || null;
  }

  // Delete trade
  static async delete(id, userId) {
    const result = await pool.query(
      "DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    return result.rows[0] || null;
  }

  // Get statistics
  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN pnl >= 0 THEN 1 END) as wins,
        COUNT(CASE WHEN pnl < 0 THEN 1 END) as losses,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(CASE WHEN risk_reward_ratio IS NOT NULL THEN risk_reward_ratio END), 0) as avg_rr,
        COALESCE(MAX(CASE WHEN pnl >= 0 THEN pnl END), 0) as largest_win,
        COALESCE(MIN(CASE WHEN pnl < 0 THEN pnl END), 0) as largest_loss
      FROM trades
      WHERE user_id = $1`,
      [userId],
    );

    const stats = result.rows[0];
    if (!stats || stats.total === "0") {
      return {
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
      };
    }

    // Calculate consecutive wins/losses
    const trades = await pool.query(
      "SELECT pnl FROM trades WHERE user_id = $1 ORDER BY date ASC",
      [userId],
    );

    let maxConsecWin = 0;
    let maxConsecLoss = 0;
    let curWin = 0;
    let curLoss = 0;

    trades.rows.forEach((t) => {
      if (t.pnl >= 0) {
        curWin++;
        curLoss = 0;
        if (curWin > maxConsecWin) maxConsecWin = curWin;
      } else {
        curLoss++;
        curWin = 0;
        if (curLoss > maxConsecLoss) maxConsecLoss = curLoss;
      }
    });

    return {
      total: parseInt(stats.total),
      wins: parseInt(stats.wins || 0),
      losses: parseInt(stats.losses || 0),
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
      totalPnl: parseFloat(stats.total_pnl),
      avgRR: parseFloat(stats.avg_rr) || 0,
      largestWin: parseFloat(stats.largest_win) || 0,
      largestLoss: parseFloat(stats.largest_loss) || 0,
      maxConsecWin,
      maxConsecLoss,
    };
  }

  // Get equity curve data
  static async getEquityCurve(userId) {
    const result = await pool.query(
      "SELECT date, pnl FROM trades WHERE user_id = $1 ORDER BY date ASC",
      [userId],
    );

    let equity = 0;
    return result.rows.map((row) => {
      equity += parseFloat(row.pnl) || 0;
      return {
        date: row.date,
        equity: equity,
        pnl: parseFloat(row.pnl) || 0,
      };
    });
  }

  // Get monthly data
  static async getMonthlyData(userId) {
    const result = await pool.query(
      `SELECT 
        SUBSTRING(date, 1, 7) as month,
        COALESCE(SUM(pnl), 0) as pnl
      FROM trades
      WHERE user_id = $1
      GROUP BY SUBSTRING(date, 1, 7)
      ORDER BY month ASC`,
      [userId],
    );

    return result.rows.map((row) => ({
      month: row.month,
      pnl: parseFloat(row.pnl),
    }));
  }
}

module.exports = Trade;
