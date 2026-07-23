// Generates one ICT-grounded market digest per day and stores it, so the
// Dashboard has something real to show on login instead of nothing.
// Reuses ai.service.js's existing ICT system prompt + marketContext.service.js
// verbatim — this is not a new prompt/framework, just a scheduled trigger
// around what the chat assistant already does.
const pool = require("../config/database");
const aiService = require("./ai.service");
const { buildMarketContext } = require("./marketContext.service");

const DIGEST_PROMPT =
  "Write today's institutional market brief for the assets this platform tracks (XAUUSD, XAGUSD, EURUSD, GBPUSD). " +
  "Cover: overall structural bias per asset from the live context below, any live SMT divergence signals and what they imply, " +
  "and what to watch for in today's session. If the live context is empty or sparse, say plainly that live data is limited " +
  "right now rather than inventing detail. Keep it under 200 words, structured with short labeled sections.";

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_insights (
      id SERIAL PRIMARY KEY,
      digest_date DATE UNIQUE NOT NULL,
      content TEXT NOT NULL,
      market_context TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  tableEnsured = true;
}

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generates and stores today's digest, overwriting any digest already
 * stored for today (e.g. if run manually more than once in a day).
 */
async function generateDailyDigest() {
  await ensureTable();

  const marketContext = buildMarketContext();
  const result = await aiService.getChatResponse(
    [{ role: "user", content: DIGEST_PROMPT }],
    marketContext,
  );

  if (!result.success) {
    throw new Error(result.error || "AI service failed to generate the daily digest");
  }

  const digestDate = todayDateString();
  const { rows } = await pool.query(
    `INSERT INTO daily_insights (digest_date, content, market_context)
     VALUES ($1, $2, $3)
     ON CONFLICT (digest_date)
     DO UPDATE SET content = EXCLUDED.content, market_context = EXCLUDED.market_context, created_at = CURRENT_TIMESTAMP
     RETURNING id, digest_date, content, created_at`,
    [digestDate, result.content, marketContext],
  );

  return rows[0];
}

/**
 * Returns the most recently stored digest, or null if none exists yet
 * (e.g. the cron hasn't run for the first time). Never generates one on
 * demand — that's the cron job's responsibility, not a read path's.
 */
async function getLatestDigest() {
  await ensureTable();

  const { rows } = await pool.query(
    `SELECT id, digest_date, content, created_at
     FROM daily_insights
     ORDER BY digest_date DESC
     LIMIT 1`,
  );

  return rows[0] || null;
}

/**
 * True if today's digest has already been generated — lets the startup
 * hook in server.js decide whether it needs to run one immediately
 * instead of waiting for the next scheduled cron tick.
 */
async function hasTodaysDigest() {
  await ensureTable();

  const { rows } = await pool.query(
    `SELECT 1 FROM daily_insights WHERE digest_date = $1`,
    [todayDateString()],
  );

  return rows.length > 0;
}

module.exports = { generateDailyDigest, getLatestDigest, hasTodaysDigest };
