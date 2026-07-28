/**
 * FOMC meeting outcomes: the factual rate decision (from FRED's daily
 * federal funds target range series) plus an AI-driven hawkish/dovish/
 * neutral read of the actual statement text, scraped directly from the
 * Fed's own primary source (federalreserve.gov) - not a third-party's
 * pre-computed sentiment score.
 *
 * These are deliberately kept as two separate facts rather than blended
 * into one field: whether the Fed hiked, cut, or held is a hard number,
 * not an opinion. Whether the *outcome* reads hawkish or dovish is a
 * judgment call about tone and forward guidance that no clean data feed
 * provides - see ai.service.js's classifyFOMCStance for that half.
 */

const axios = require("axios");
const cheerio = require("cheerio");
const aiService = require("./ai.service");

const FRED_OBSERVATIONS_URL = "https://api.stlouisfed.org/fred/series/observations";

// Statement release dates (the last day of each 2-day meeting), from
// the Fed's own published calendar
// (federalreserve.gov/monetarypolicy/fomccalendars.htm) - confirmed
// directly against that page. The Fed publishes these a year or more
// in advance and they rarely change; same maintenance model already
// used for economicCalendar.service.js's HIGH_IMPACT_RELEASES list.
// Extend this list each year as the Fed publishes the next calendar.
const FOMC_MEETING_DATES = [
  "2025-01-29",
  "2025-03-19",
  "2025-05-07",
  "2025-06-18",
  "2025-07-30",
  "2025-09-17",
  "2025-10-29",
  "2025-12-10",
  "2026-01-28",
  "2026-03-18",
  "2026-04-29",
  "2026-06-17",
  "2026-07-29",
  "2026-09-16",
  "2026-10-28",
  "2026-12-09",
];

function easternDateString(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

class FOMCService {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    // Outcomes don't change once published - a long TTL just avoids
    // re-scraping/re-classifying on every dashboard load.
    this.cacheTTL = 6 * 60 * 60 * 1000; // 6 hours
  }

  _mostRecentPastMeeting() {
    const todayStr = easternDateString(new Date());
    const past = FOMC_MEETING_DATES.filter((d) => d <= todayStr);
    return past.length > 0 ? past[past.length - 1] : null;
  }

  /**
   * Fetches the real statement text from the Fed's own press release
   * page. URL pattern and page structure (#article > p tags) confirmed
   * directly against a live page before building this - not guessed.
   */
  async _fetchStatementText(meetingDate) {
    const compact = meetingDate.replace(/-/g, "");
    const url = `https://www.federalreserve.gov/newsevents/pressreleases/monetary${compact}a.htm`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TradexBot/1.0)" },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const paragraphs = [];
    $("#article p").each((_, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      // "For media inquiries..." reliably marks the end of the actual
      // statement across every one of these releases - stop there
      // rather than pulling in contact-info boilerplate.
      if (text.startsWith("For media inquiries")) return false;
      paragraphs.push(text);
    });

    if (paragraphs.length === 0) {
      throw new Error("No statement paragraphs found - page structure may have changed");
    }
    return paragraphs.join("\n\n");
  }

  async _fetchFredSeries(seriesId, start, end) {
    const response = await axios.get(FRED_OBSERVATIONS_URL, {
      params: {
        series_id: seriesId,
        api_key: process.env.FRED_API_KEY,
        file_type: "json",
        observation_start: start,
        observation_end: end,
        sort_order: "asc",
      },
      timeout: 10000,
    });
    return (response.data?.observations || [])
      .filter((o) => o.value !== ".")
      .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
  }

  _lastValueBefore(observations, dateStr) {
    const before = observations.filter((o) => o.date < dateStr);
    return before.length > 0 ? before[before.length - 1].value : null;
  }

  _firstValueOnOrAfter(observations, dateStr) {
    const onOrAfter = observations.filter((o) => o.date >= dateStr);
    return onOrAfter.length > 0 ? onOrAfter[0].value : null;
  }

  /**
   * The factual half: did the Fed hike, cut, or hold, and by how much.
   * DFEDTARU/DFEDTARL (fed funds target range upper/lower bound)
   * publish daily, confirmed live before building this - comparing the
   * value just before vs just after the meeting date gives the real
   * decision without needing to parse numbers out of statement prose.
   */
  async _fetchRateDecision(meetingDate) {
    const meetingMs = new Date(`${meetingDate}T12:00:00Z`).getTime();
    const windowStart = new Date(meetingMs - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const windowEnd = new Date(meetingMs + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [upper, lower] = await Promise.all([
      this._fetchFredSeries("DFEDTARU", windowStart, windowEnd),
      this._fetchFredSeries("DFEDTARL", windowStart, windowEnd),
    ]);

    const upperBefore = this._lastValueBefore(upper, meetingDate);
    const upperAfter = this._firstValueOnOrAfter(upper, meetingDate);
    const lowerBefore = this._lastValueBefore(lower, meetingDate);
    const lowerAfter = this._firstValueOnOrAfter(lower, meetingDate);

    if (upperBefore == null || upperAfter == null || lowerBefore == null || lowerAfter == null) {
      throw new Error("Insufficient FRED target-range observations around meeting date");
    }

    const changeBps = Math.round((upperAfter - upperBefore) * 100);
    const action = changeBps > 0 ? "HIKE" : changeBps < 0 ? "CUT" : "HOLD";

    return {
      action,
      changeBps,
      rangeBefore: { lower: lowerBefore, upper: upperBefore },
      rangeAfter: { lower: lowerAfter, upper: upperAfter },
    };
  }

  _describeRateDecision(rd) {
    const rangeStr = `${rd.rangeAfter.lower.toFixed(2)}%-${rd.rangeAfter.upper.toFixed(2)}%`;
    if (rd.action === "HOLD") return `Held the federal funds target range at ${rangeStr}.`;
    const verb = rd.action === "HIKE" ? "Raised" : "Cut";
    return `${verb} the federal funds target range by ${Math.abs(rd.changeBps)} bps to ${rangeStr}.`;
  }

  /**
   * Orchestrates the full outcome for the most recent past meeting.
   * Per-section failure is explicit, not silently dropped: if the rate
   * decision fetch fails, the whole result is unavailable (the decision
   * is the core fact); if only the AI classification fails, the real
   * rate decision is still returned with stance explicitly null +
   * stanceError set, rather than withholding data that did load fine.
   */
  async getLatestOutcome(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && this.cacheTime && now - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    if (!process.env.FRED_API_KEY) {
      return { available: false, error: "FRED_API_KEY not configured" };
    }

    const meetingDate = this._mostRecentPastMeeting();
    if (!meetingDate) {
      return { available: false, error: "No past FOMC meeting date found in the maintained schedule" };
    }

    let rateDecision;
    try {
      rateDecision = await this._fetchRateDecision(meetingDate);
    } catch (e) {
      return { available: false, error: `Failed to fetch rate decision: ${e.message}` };
    }
    const rateDecisionSummary = this._describeRateDecision(rateDecision);

    let statementText = null;
    let stance = null;
    let confidence = null;
    let rationale = null;
    let keyPhrases = null;
    let stanceError = null;

    try {
      statementText = await this._fetchStatementText(meetingDate);
      const classification = await aiService.classifyFOMCStance(statementText, rateDecisionSummary);
      if (classification.success) {
        stance = classification.stance;
        confidence = classification.confidence;
        rationale = classification.rationale;
        keyPhrases = classification.keyPhrases;
      } else {
        stanceError = classification.error;
      }
    } catch (e) {
      stanceError = `Failed to fetch statement text: ${e.message}`;
    }

    const result = {
      available: true,
      meetingDate,
      rateDecision,
      rateDecisionSummary,
      stance,
      confidence,
      rationale,
      keyPhrases,
      stanceError,
    };

    this.cache = result;
    this.cacheTime = now;
    return result;
  }
}

module.exports = new FOMCService();
