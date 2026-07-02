const { body, param } = require("express-validator");

// Auth validation
exports.validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

exports.validateLogin = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Trade validation
exports.validateTrade = [
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isDate()
    .withMessage("Invalid date format"),
  body("instrument")
    .trim()
    .notEmpty()
    .withMessage("Instrument is required")
    .isLength({ max: 10 })
    .withMessage("Instrument name too long"),
  body("direction")
    .isIn(["Long", "Short"])
    .withMessage("Direction must be Long or Short"),
  body("entry")
    .isFloat({ min: 0 })
    .withMessage("Entry price must be a positive number"),
  body("exit")
    .isFloat({ min: 0 })
    .withMessage("Exit price must be a positive number"),
  body("size")
    .isFloat({ min: 0 })
    .withMessage("Position size must be a positive number"),
  body("stopLoss")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Stop loss must be a positive number"),
  body("takeProfit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Take profit must be a positive number"),
];

// For PostgreSQL, we use integer IDs, not MongoDB ObjectIds
exports.validateTradeId = [
  param("id").isInt({ min: 1 }).withMessage("Invalid trade ID"),
];
