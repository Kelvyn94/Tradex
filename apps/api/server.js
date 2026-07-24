// * TradeX Server - Main Entry Point * Complete backend with Data Engine integration

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();

const pool = require("./src/config/database");
const ensureAuthColumns = require("./src/config/ensureAuthColumns");
const authRoutes = require("./src/routes/authRoutes");
const tradeRoutes = require("./src/routes/tradeRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const sentimentRoutes = require("./src/routes/sentimentRoutes");
const dataEngineRoutes = require("./src/routes/dataEngineRoutes");
const insightsRoutes = require("./src/routes/insightsRoutes");
const economicCalendarRoutes = require("./src/routes/economicCalendarRoutes");
const MarketDataService = require("./src/services/marketData.service");
const websocketService = require("./src/services/websocket.service");
const dataEngineService = require("./src/services/dataEngine.service");
const { startDailyInsightCron } = require("./src/jobs/dailyInsightCron");

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://tradex-silk-three.vercel.app",
  "https://tradex-backend-ecvs.onrender.com",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
  }),
);

app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health check - Root level
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: process.env.DATABASE_URL ? "connected" : "not configured",
      ai: process.env.GROQ_API_KEY ? "configured" : "not configured",
      email: process.env.RESEND_API_KEY ? "configured" : "not configured",
    },
  });
});

// Health check - API level (backward compatibility)
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    const marketStatus = MarketDataService.getStatus
      ? MarketDataService.getStatus()
      : "unknown";
    res.json({
      status: "OK",
      message: "Server is running",
      database: "Connected to Neon PostgreSQL",
      market: marketStatus,
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "TradeX API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      api_health: "/api/health",
      api: "/api",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/data-engine", dataEngineRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/calendar", economicCalendarRoutes);

// Market Data Routes (direct)
app.get("/api/market/prices", async (req, res) => {
  try {
    const prices = MarketDataService.getAllPrices
      ? await MarketDataService.getAllPrices()
      : {};
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/market/status", async (req, res) => {
  try {
    const status = MarketDataService.getStatus
      ? MarketDataService.getStatus()
      : { status: "unknown" };
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

ensureAuthColumns().catch((err) =>
  console.error("❌ Failed to ensure auth columns:", err.message),
);

// Start Market Data Service
MarketDataService.start();
websocketService.connect();
dataEngineService.startKeepAlive();
startDailyInsightCron();

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    available_routes: [
      "GET /health",
      "GET /api/health",
      "GET /",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/auth/me",
      "POST /api/auth/verify-email",
      "POST /api/auth/forgot-password",
      "POST /api/auth/reset-password",
      "POST /api/auth/resend-verification",
      "GET /api/trades",
      "POST /api/trades",
      "GET /api/analytics",
      "POST /api/ai/chat",
      "GET /api/ai/market-status",
      "GET /api/ai/prices",
      "GET /api/sentiment/:asset",
      "GET /api/data-engine/insights",
      "GET /api/data-engine/signals",
      "GET /api/insights/daily",
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── START SERVER ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  Database: Neon PostgreSQL`);
  console.log(
    `🧠 AI: ${process.env.GROQ_API_KEY ? "✅ Connected" : "❌ Missing API Key"}`,
  );
  console.log(`🟢 Health: http://localhost:${PORT}/health`);
});

// ─── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────────

process.on("SIGTERM", () => {
  console.log("🛑 Shutting down...");
  MarketDataService.stop();
  websocketService.stop();
  dataEngineService.stopKeepAlive();
  process.exit(0);
});
