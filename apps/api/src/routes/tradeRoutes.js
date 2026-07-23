const express = require("express");
const router = express.Router();
const tradeController = require("../controllers/tradeController");
const { validateTrade, validateTradeId } = require("../middleware/validation"); // lowercase 'validation'
const auth = require("../middleware/auth"); // lowercase 'auth'

// All trade routes require authentication
router.use(auth);

// Trade CRUD
router.post("/", validateTrade, tradeController.createTrade);
router.get("/", tradeController.getTrades);
router.get("/stats", tradeController.getStats);
router.get("/equity", tradeController.getEquityCurve);
router.get("/monthly", tradeController.getMonthlyData);
router.get("/:id", validateTradeId, tradeController.getTradeById);
router.put("/:id", validateTradeId, validateTrade, tradeController.updateTrade);
router.delete("/:id", validateTradeId, tradeController.deleteTrade);

module.exports = router;
