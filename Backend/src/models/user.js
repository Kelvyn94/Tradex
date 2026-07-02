const pool = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
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
