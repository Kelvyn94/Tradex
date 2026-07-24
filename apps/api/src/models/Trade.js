const pool = require("../config/database");

// pg returns DECIMAL columns as strings (to avoid float precision loss),
// but every consumer of these rows (frontend, aggregation code) expects
// real numbers. Normalize once here instead of at each call site.
function normalizeTrade(row) {
  if (!row) return row;
  return {
    ...row,
    entry: parseFloat(row.entry),
    exit: parseFloat(row.exit),
    size: parseFloat(row.size),
    stop_loss: row.stop_loss !== null ? parseFloat(row.stop_loss) : null,
    take_profit: row.take_profit !== null ? parseFloat(row.take_profit) : null,
    pnl: parseFloat(row.pnl) || 0,
    pnl_percentage: parseFloat(row.pnl_percentage) || 0,
    risk_reward_ratio:
      row.risk_reward_ratio !== null ? parseFloat(row.risk_reward_ratio) : null,
  };
}

// Risk:Reward is only meaningful if the stop-loss/take-profit are actually
// placed on the correct side of entry for the given direction (a Long's
// stop must sit below entry and target above it; reversed for a Short).
// Using Math.abs() alone on the raw distances — the previous logic —
// produced a normal-looking ratio even when the levels were inverted for
// the direction, silently masking a data-entry mistake instead of
// surfacing it.
function calculateRiskReward(direction, entry, stopLoss, takeProfit) {
  if (!entry || !stopLoss || !takeProfit) return null;

  const isConsistent =
    direction === "Long"
      ? stopLoss < entry && takeProfit > entry
      : stopLoss > entry && takeProfit < entry;
  if (!isConsistent) return null;

  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  return risk === 0 ? null : reward / risk;
}

// Single source of truth for what counts as a win/loss/breakeven. Two
// call sites previously disagreed: getStats()/findByUser() counted
// pnl===0 as a win, while analyticsController counted it as neither a
// win nor a loss but still included it in the win-rate denominator -
// the correct convention (a $0 trade shouldn't inflate win rate the way
// counting it as a win does). Every consumer must classify through this
// function so live stats and any future backtesting stats can't diverge.
function classifyOutcome(pnl) {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

// Pure aggregation over already-fetched trades (no DB access), so the
// exact same computation backs getStats() and is directly unit-testable
// / reusable by anything else that needs identical stats (e.g. a future
// backtesting report) without re-deriving this logic.
function computeStats(trades) {
  if (!trades.length) {
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

  let wins = 0;
  let losses = 0;
  let totalPnl = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let maxConsecWin = 0;
  let maxConsecLoss = 0;
  let curWin = 0;
  let curLoss = 0;
  const rrValues = [];

  for (const t of trades) {
    const pnl = t.pnl;
    totalPnl += pnl;

    const outcome = classifyOutcome(pnl);
    if (outcome === "win") {
      wins++;
      curWin++;
      curLoss = 0;
      if (curWin > maxConsecWin) maxConsecWin = curWin;
      if (pnl > largestWin) largestWin = pnl;
    } else if (outcome === "loss") {
      losses++;
      curLoss++;
      curWin = 0;
      if (curLoss > maxConsecLoss) maxConsecLoss = curLoss;
      if (pnl < largestLoss) largestLoss = pnl;
    } else {
      // Breakeven: a real outcome, but not a win or a loss - doesn't
      // extend either streak.
      curWin = 0;
      curLoss = 0;
    }

    if (t.risk_reward_ratio !== null && t.risk_reward_ratio !== undefined) {
      rrValues.push(t.risk_reward_ratio);
    }
  }

  return {
    total: trades.length,
    wins,
    losses,
    winRate: (wins / trades.length) * 100,
    totalPnl,
    avgRR: rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0,
    largestWin,
    largestLoss,
    maxConsecWin,
    maxConsecLoss,
  };
}

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
    notes = ''
  } = tradeData;

  // Calculate PnL
  const diff = direction === 'Long' ? exit - entry : entry - exit;
  const pnl = diff * size;
  const pnl_percentage = entry !== 0 ? (diff / entry) * 100 : 0;

  // Calculate Risk:Reward ratio
  const risk_reward_ratio = calculateRiskReward(direction, entry, stop_loss, take_profit);

  const result = await pool.query(
    `INSERT INTO trades (
      user_id, date, instrument, direction, entry, exit, size,
      stop_loss, take_profit, pnl, pnl_percentage, risk_reward_ratio, tags, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      user_id, date, instrument, direction, entry, exit, size,
      stop_loss || null, take_profit || null,
      pnl, pnl_percentage, risk_reward_ratio,
      tags, notes
    ]
  );
  return normalizeTrade(result.rows[0]);
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
    let trades = result.rows.map(normalizeTrade);

    // Filter by outcome if specified
    if (filters.outcome === "win") {
      trades = trades.filter((t) => classifyOutcome(t.pnl) === "win");
    } else if (filters.outcome === "loss") {
      trades = trades.filter((t) => classifyOutcome(t.pnl) === "loss");
    }

    return trades;
  }

  // Find trade by ID and user
  static async findByIdAndUser(id, userId) {
    const result = await pool.query(
      "SELECT * FROM trades WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    return normalizeTrade(result.rows[0]) || null;
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
    const risk_reward_ratio = calculateRiskReward(direction, entry, stop_loss, take_profit);

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
    return normalizeTrade(result.rows[0]) || null;
  }

  // Delete trade
  static async delete(id, userId) {
    const result = await pool.query(
      "DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    return result.rows[0] || null;
  }

  // Get statistics. Computed via the shared computeStats() (same function
  // analyticsController uses) rather than a separate SQL aggregation, so
  // the two can't classify wins/losses/breakeven differently again.
  static async getStats(userId) {
    const result = await pool.query(
      "SELECT pnl, risk_reward_ratio FROM trades WHERE user_id = $1 ORDER BY date ASC",
      [userId],
    );

    const trades = result.rows.map((row) => ({
      pnl: parseFloat(row.pnl) || 0,
      risk_reward_ratio:
        row.risk_reward_ratio !== null ? parseFloat(row.risk_reward_ratio) : null,
    }));

    return computeStats(trades);
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

Trade.classifyOutcome = classifyOutcome;
Trade.computeStats = computeStats;

module.exports = Trade;
