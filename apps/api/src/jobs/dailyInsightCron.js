// Schedules the once-daily ICT market digest. Kept as a thin scheduling
// wrapper around dailyInsight.service.js so the generation logic itself
// stays testable/callable independent of cron.
const cron = require("node-cron");
const { generateDailyDigest, hasTodaysDigest } = require("../services/dailyInsight.service");

// Configurable so this can be moved to line up with a specific session
// (e.g. before London open) without a code change. Defaults to 06:00
// server-local time.
const SCHEDULE = process.env.DAILY_DIGEST_CRON || "0 6 * * *";

async function runDigestSafely(trigger) {
  try {
    const digest = await generateDailyDigest();
    console.log(`✅ Daily digest generated (${trigger}) for ${digest.digest_date}`);
  } catch (error) {
    console.error(`❌ Daily digest generation failed (${trigger}):`, error.message);
  }
}

function startDailyInsightCron() {
  cron.schedule(SCHEDULE, () => runDigestSafely("scheduled"));
  console.log(`🗓️  Daily digest cron scheduled: "${SCHEDULE}"`);

  // If the server restarts mid-day (deploy, crash) after the scheduled
  // time already passed, don't leave the Dashboard showing yesterday's
  // brief until tomorrow — backfill today's on startup instead.
  hasTodaysDigest()
    .then((exists) => {
      if (!exists) {
        console.log("🗓️  No digest for today yet — generating one now.");
        return runDigestSafely("startup-backfill");
      }
    })
    .catch((error) => {
      console.error("❌ Daily digest startup check failed:", error.message);
    });
}

module.exports = { startDailyInsightCron };
