/**
 * Test AI Chat
 */

require("dotenv").config();
const aiService = require("./src/services/ai.service");

async function testChat() {
  console.log("🧠 Testing AI Chat...\n");
  console.log(
    "📡 Using API Key:",
    process.env.GROQ_API_KEY ? "✅ Found" : "❌ Missing",
  );
  console.log("");

  const result = await aiService.getChatResponse([
    { role: "user", content: "Analyze EURUSD for today" },
  ]);

  if (result.success) {
    console.log("✅ AI Response:");
    console.log("─".repeat(50));
    console.log(result.content);
    console.log("─".repeat(50));
    console.log(`\n📊 Model: ${result.model || "llama-3.3-70b-versatile"}`);
    console.log(`📈 Tokens: ${result.usage?.total_tokens || "N/A"}`);
  } else {
    console.error("❌ Error:", result.error);
  }
}

testChat();
