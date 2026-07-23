const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User"); // Changed from './User' to '../models/User'
// Remove any duplicate pool imports
const bcrypt = require("bcryptjs");
const EmailService = require("../services/email.service");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Raw token goes in the emailed link; only its hash is ever persisted.
const generateRawToken = () => crypto.randomBytes(32).toString("hex");

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // Check if user exists by username or email
    const existingUserByUsername = await User.findOne({ username });
    const existingUserByEmail = await User.findOne({ email });

    if (existingUserByUsername || existingUserByEmail) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user.id);

    // Verification email is best-effort — registration itself should never
    // fail just because the mail provider hiccuped.
    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await User.setVerificationToken(user.id, User.hashToken(rawToken), expiresAt);
    EmailService.sendVerificationEmail(user, rawToken).catch((error) =>
      console.error("❌ Failed to send verification email:", error.message),
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const user = await User.findByVerificationToken(User.hashToken(token));
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    await User.markEmailVerified(user.id);
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.setVerificationToken(user.id, User.hashToken(rawToken), expiresAt);
    const result = await EmailService.sendVerificationEmail(user, rawToken);

    if (!result.success) {
      return res.status(502).json({ error: "Could not send verification email" });
    }
    res.json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way whether or not the email exists, so this
    // endpoint can't be used to enumerate registered accounts.
    if (user) {
      const rawToken = generateRawToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await User.setResetToken(user.id, User.hashToken(rawToken), expiresAt);
      EmailService.sendPasswordResetEmail(user, rawToken).catch((error) =>
        console.error("❌ Failed to send password reset email:", error.message),
      );
    }

    res.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { token, password } = req.body;
    const user = await User.findByResetToken(User.hashToken(token));
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.resetPassword(user.id, hashedPassword);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { username, password } = req.body;

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
