const pool = require("./database");
const fs = require("fs");
const path = require("path");

const initDatabase = async () => {
  console.log("🔄 Initializing database...");

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, "../models/schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Split by semicolon and filter empty statements
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Ignore "already exists" errors
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate key") ||
          error.message.includes("already defined")
        ) {
          console.log(`ℹ️  Statement ${i + 1} - Already exists, skipping`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error("Statement:", stmt.substring(0, 100) + "...");
          throw error;
        }
      }
    }

    console.log("✅ Database schema initialized successfully!");

    // Verify tables
    const tablesResult = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'trades')`,
    );

    const existingTables = tablesResult.rows.map((r) => r.table_name);
    console.log("📊 Tables created:", existingTables.join(", ") || "None");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log("✅ Database initialization complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Initialization failed:", error);
      process.exit(1);
    });
}

module.exports = initDatabase;
