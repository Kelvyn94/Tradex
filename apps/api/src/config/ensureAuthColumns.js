const pool = require("./database");

// schema.sql / initDB.js are only ever run manually, so we can't rely on
// that having happened against the production DB. This mirrors the
// self-migrating pattern already used by dailyInsight.service.js
// (CREATE TABLE IF NOT EXISTS on every boot) — idempotent and safe to run
// on every startup.
async function ensureAuthColumns() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP DEFAULT NULL
  `);
}

module.exports = ensureAuthColumns;
