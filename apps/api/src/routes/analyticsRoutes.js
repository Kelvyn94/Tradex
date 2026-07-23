const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/auth"); // lowercase 'auth'

router.use(auth);

router.get("/dashboard", analyticsController.getDashboardData);
router.get("/performance", analyticsController.getPerformanceMetrics);

module.exports = router;
