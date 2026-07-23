const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class User {
  // Tokens are emailed to the user in raw form but only ever stored here as
  // a SHA-256 hash, so a DB leak alone can't be used to verify an email or
  // reset a password.
  static hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async setVerificationToken(userId, tokenHash, expiresAt) {
    await pool.query(
      "UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3",
      [tokenHash, expiresAt, userId],
    );
  }

  static async findByVerificationToken(tokenHash) {
    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()",
      [tokenHash],
    );
    return result.rows[0] || null;
  }

  static async markEmailVerified(userId) {
    await pool.query(
      "UPDATE users SET email_verified = true, verification_token = NULL, verification_token_expires = NULL WHERE id = $1",
      [userId],
    );
  }

  static async setResetToken(userId, tokenHash, expiresAt) {
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [tokenHash, expiresAt, userId],
    );
  }

  static async findByResetToken(tokenHash) {
    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [tokenHash],
    );
    return result.rows[0] || null;
  }

  static async resetPassword(userId, newHashedPassword) {
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newHashedPassword, userId],
    );
  }
  // Find user by ID
  static async findById(id) {
    const result = await pool.query(
      "SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0] || null;
  }

  // Find user by username or email
  static async findOne(conditions) {
    const { username, email, id } = conditions;
    let query =
      "SELECT id, username, email, password, created_at, updated_at FROM users WHERE";
    const params = [];
    const conditionsList = [];

    if (username) {
      conditionsList.push(` username = $${params.length + 1}`);
      params.push(username);
    }
    if (email) {
      conditionsList.push(` email = $${params.length + 1}`);
      params.push(email);
    }
    if (id) {
      conditionsList.push(` id = $${params.length + 1}`);
      params.push(id);
    }

    if (conditionsList.length === 0) return null;

    query += conditionsList.join(" AND");
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  // Find user by username (for login)
  static async findByUsername(username) {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0] || null;
  }

  // Create new user
  static async create(userData) {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, created_at, updated_at`,
      [username, email, hashedPassword],
    );
    return result.rows[0];
  }

  // Check if user exists
  static async exists(conditions) {
    const user = await this.findOne(conditions);
    return !!user;
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Convert to JSON (remove password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
