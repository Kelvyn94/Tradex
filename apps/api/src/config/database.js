const { Pool } = require("pg");
require("dotenv").config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to Neon PostgreSQL");
    release();
  }
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

// Export the pool directly
module.exports = pool;
