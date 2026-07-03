const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const pool = require("./src/config/database");
const initDatabase = require("./src/config/initDB");
const authRoutes = require("./src/routes/authRoutes");
const tradeRoutes = require("./src/routes/tradeRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const WebSocketService = require("./src/services/websocket.service");

const app = express();

// Initialize database (comment out after first run)
// initDatabase();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://tradex-silk-three.vercel.app",
      "https://tradex-backend-ecvs.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" })); // Increased for image uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "OK",
      message: "Server is running",
      database: "Connected to Neon PostgreSQL",
      websocket: WebSocketService.isConnected() ? "Connected" : "Disconnected",
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

// Start WebSocket service
WebSocketService.connect();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: Neon PostgreSQL`);
});

// Shutdown handler
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down...");
  WebSocketService.stop();
  process.exit(0);
});
