const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../middleware/validation"); // lowercase 'validation'
const auth = require("../middleware/auth"); // lowercase 'auth'

// Public routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

// Protected routes
router.get("/me", auth, authController.getCurrentUser);
router.post("/resend-verification", auth, authController.resendVerification);

module.exports = router;
