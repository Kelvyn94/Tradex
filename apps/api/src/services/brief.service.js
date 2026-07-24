/**
 * Daily/weekly market brief: a templated, rules-based narrative composed
 * from data this app already fetches and displays elsewhere (macro regime,
 * COT positioning, correlation matrix, economic calendar) - no new data
 * sources, no AI call. Each section is independently marked unavailable
 * if its underlying service fails, rather than silently omitted or
 * fabricated - the same explicit-not-fabricated pattern used throughout
 * this project. An AI-narrative version (turning the same data into more
 * natural prose) is a deliberate later enhancement, not built here.
 */

const dataEngineService = require("./dataEngine.service");
const economicCalendarService = require("./economicCalendar.service");

const REGIME_LABEL = {
  RISK_ON: "Risk-On",
  ELEVATED: "Elevated risk",
  RISK_OFF: "Risk-Off",
};

const ASSET_LABELS = {
  XAUUSD: "Gold",
  XAGUSD: "Silver",
  EURUSD: "EUR",
  GBPUSD: "GBP",
};

function unavailable(text) {
  return { available: false, text };
}

function available(text) {
  return { available: true, text };
}

async function buildMacroSection() {
  try {
    const response = await dataEngineService.getMacroRegime();
    const macro = response?.data;
    if (!macro || !macro.series) return unavailable("Macro data unavailable.");

    const { DXY, US10Y, VIX } = macro.series;
    const parts = [];
    if (DXY) parts.push(`DXY ${DXY.value.toFixed(2)} (${DXY.direction})`);
    if (US10Y) parts.push(`10Y yield ${US10Y.value.toFixed(2)}% (${US10Y.direction})`);
    if (VIX) parts.push(`VIX ${VIX.value.toFixed(2)} (${VIX.direction})`);

    if (parts.length === 0) return unavailable("Macro data unavailable.");

    const regime = macro.riskRegime ? REGIME_LABEL[macro.riskRegime] : null;
    const regimePrefix = regime ? `${regime}. ` : "";
    return available(`${regimePrefix}${parts.join(", ")}.`);
  } catch {
    return unavailable("Macro data unavailable.");
  }
}

async function buildCotSection() {
  try {
    const response = await dataEngineService.getCOTPositioning();
    const positioning = response?.data;
    if (!Array.isArray(positioning) || positioning.length === 0) {
      return unavailable("COT positioning unavailable.");
    }

    const reportDate = positioning[0]?.reportDate;
    const lines = positioning.map((p) => {
      const label = ASSET_LABELS[p.asset] ?? p.asset;
      const commNet = p.commercial?.net ?? 0;
      const specNet = p.nonCommercial?.net ?? 0;
      const commSide = commNet >= 0 ? "net long" : "net short";
      const specSide = specNet >= 0 ? "net long" : "net short";
      return `${label}: commercials ${commSide} ${Math.abs(commNet).toLocaleString()}, speculators ${specSide} ${Math.abs(specNet).toLocaleString()}`;
    });

    return available(`CFTC COT, week of ${reportDate} (updates weekly): ${lines.join("; ")}.`);
  } catch {
    return unavailable("COT positioning unavailable.");
  }
}

async function buildCorrelationSection() {
  try {
    const response = await dataEngineService.getCorrelation();
    const correlation = response?.data;
    const strong = correlation?.strongCorrelations;
    if (!Array.isArray(strong)) return unavailable("Correlation data unavailable.");
    if (strong.length === 0) return available("No strong cross-asset correlations detected currently.");

    const lines = strong
      .slice(0, 3)
      .map((p) => `${p.asset1}/${p.asset2} ${p.correlation.toFixed(2)} (${p.type.toLowerCase()})`);
    return available(`Strongest correlations: ${lines.join(", ")}.`);
  } catch {
    return unavailable("Correlation data unavailable.");
  }
}

async function buildCalendarSection(windowDays) {
  try {
    const releases = await economicCalendarService.getUpcomingReleases();
    if (releases === null) return unavailable("Economic calendar unavailable.");

    const now = Date.now();
    const cutoff = now + windowDays * 24 * 60 * 60 * 1000;
    const inWindow = releases.filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= now && t <= cutoff;
    });

    if (inWindow.length === 0) {
      return available(`Nothing high-impact scheduled in the next ${windowDays} days.`);
    }

    const lines = inWindow.map((r) => `${r.name} (${r.date})`);
    return available(`Next ${windowDays} days: ${lines.join(", ")}.`);
  } catch {
    return unavailable("Economic calendar unavailable.");
  }
}

/**
 * Composes the brief for the given period. "weekly" widens the calendar
 * lookout window and frames COT with its natural weekly cadence; it does
 * NOT claim a macro "shift over the week" - this service only has a live
 * macro snapshot, no persisted history, so a trend claim there would be
 * fabricated. Both periods show the same current macro snapshot.
 */
async function generateBrief(period) {
  const calendarWindowDays = period === "weekly" ? 7 : 2;

  const [macro, cot, correlation, calendar] = await Promise.all([
    buildMacroSection(),
    buildCotSection(),
    buildCorrelationSection(),
    buildCalendarSection(calendarWindowDays),
  ]);

  return {
    period,
    generatedAt: new Date().toISOString(),
    sections: { macro, cot, correlation, calendar },
  };
}

module.exports = { generateBrief };
