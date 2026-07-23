const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validation"); // lowercase 'validation'
const auth = require("../middleware/auth"); // lowercase 'auth'

// Public routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);

// Protected routes
router.get("/me", auth, authController.getCurrentUser);

module.exports = router;
