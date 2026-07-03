// Backend/src/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const auth = require("../middleware/auth");

router.get("/prices", aiController.getPrices);
router.get("/market-status", aiController.getMarketStatus);

router.post("/detect-smt", auth, aiController.detectSMT);
router.post("/detect-all", auth, aiController.detectAllSMT);
router.post("/test-notification", auth, aiController.testNotification);
router.post("/analyze-screenshot", auth, aiController.analyzeScreenshot);
router.get("/analyze-journal", auth, aiController.analyzeJournal);
router.post("/feedback", auth, aiController.saveFeedback);

module.exports = router;
