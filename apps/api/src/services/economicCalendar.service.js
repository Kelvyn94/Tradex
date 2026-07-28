// Backend/src/services/economicCalendar.service.js
//
// Upcoming high-impact economic release dates via FRED's official
// releases/dates API (api.stlouisfed.org) - free, no paid tier.
//
// Finnhub's calendar/economic endpoint was the original plan (its key is
// already wired into marketData.service.js), but it returned
// 403 "You don't have access to this resource" even with a valid,
// working free-tier key (confirmed empirically: the same key's /quote
// call succeeded) - that endpoint is paid-plan only. FRED is a genuine
// free alternative and is already a known integration (FRED_API_KEY is
// referenced elsewhere in this project).
//
// Important labeling note: FRED's release calendar covers scheduled
// dates for economic DATA releases (BLS/BEA publications) - it is not a
// general "Fed decision" calendar. FOMC meeting/rate-decision dates are
// a different kind of event and are not included here. Only the
// releases in HIGH_IMPACT_RELEASES are ever surfaced; nothing else FRED
// returns is shown, to avoid presenting low-relevance releases as if
// they were curated for trading impact.
//
// ISM Manufacturing PMI was originally on this list but had to be
// dropped: confirmed empirically against FRED's full release catalog
// (329 releases, paginated) that FRED does not track a release calendar
// entry for it at all - ISM is a private trade association, not a
// government statistical agency, so its publication schedule isn't in
// FRED's release-date system. Claiming to cover it here would be
// exactly the kind of "approximation presented as precise" this project
// has been eliminating - if ISM PMI coverage is wanted later, it needs
// a different data source, not a relabeled absence.
//
// Release IDs below are hardcoded from FRED's authoritative /fred/releases
// catalog lookup (not guessed from name matching), and each release's
// dates are fetched via the per-release /fred/release/dates endpoint
// rather than the all-releases /fred/releases/dates endpoint. The
// all-releases endpoint is capped at 1000 rows across ALL ~329 FRED
// releases combined - confirmed empirically that a 90-day window alone
// hits that cap, which would silently truncate curated releases falling
// later in the window. Per-release queries have no such risk (each
// release has only a handful of dates in any 90-day window).
const axios = require("axios");

// Economic releases (BLS/BEA/Fed) are dated in US Eastern time, not UTC.
// new Date().toISOString() always gives the UTC calendar date - for
// roughly 4-5 hours every evening (8pm-midnight Eastern), UTC has
// already rolled to the next day while it's still "today" in the US.
// Computing the query window from raw UTC during that window sent FRED
// a realtime_start one day ahead of the real US date, silently
// excluding any release actually dated "today" from the results (this
// is what caused a real release on the 29th to only show starting from
// the 30th). en-CA locale formats as YYYY-MM-DD, matching FRED's
// expected date format directly.
function easternDateString(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

const HIGH_IMPACT_RELEASES = [
  { id: 50, name: "Employment Situation" }, // Non-Farm Payrolls
  { id: 10, name: "Consumer Price Index" },
  { id: 46, name: "Producer Price Index" },
  { id: 53, name: "Gross Domestic Product" },
  { id: 54, name: "Personal Income and Outlays" }, // PCE - the Fed's preferred inflation gauge
  { id: 9, name: "Advance Monthly Sales for Retail and Food Services" }, // Retail Sales
];

class EconomicCalendarService {
  constructor() {
    this.apiKey = process.env.FRED_API_KEY;
    this.baseUrl = "https://api.stlouisfed.org/fred/release/dates"; // singular "release" - per-release query, see file header
    this.cache = null;
    this.lastFetchTime = null;
    // Release schedules change rarely (weekly at most) - an hourly cache
    // is generous, not aggressive, and keeps us far under any reasonable
    // rate limit regardless of how many users load the dashboard. Even
    // uncached, this is only 6 requests (one per curated release).
    this.cacheTTL = 3600000; // 1 hour
  }

  /**
   * Get upcoming high-impact release dates for the next ~90 days.
   * Returns null (never a fabricated/empty-looking array) when the
   * service is genuinely unavailable - no key, request failure with no
   * prior cache - so callers can render an explicit "unavailable" state
   * instead of an empty calendar that looks like "nothing scheduled."
   */
  async getUpcomingReleases() {
    if (!this.apiKey) {
      console.warn(
        "⚠️ FRED_API_KEY not set - economic calendar unavailable (no fallback data will be shown)",
      );
      return null;
    }

    const now = Date.now();
    if (this.cache && this.lastFetchTime && now - this.lastFetchTime < this.cacheTTL) {
      return this.cache;
    }

    try {
      const today = easternDateString(new Date());
      const ninetyDaysOut = easternDateString(new Date(now + 90 * 24 * 60 * 60 * 1000));

      const perReleaseResults = await Promise.all(
        HIGH_IMPACT_RELEASES.map(async (release) => {
          try {
            const response = await axios.get(this.baseUrl, {
              params: {
                release_id: release.id,
                api_key: this.apiKey,
                file_type: "json",
                realtime_start: today,
                realtime_end: ninetyDaysOut,
                // Future dates have no data attached yet - without this
                // flag FRED excludes them, which would silently make
                // "upcoming releases" return only past ones.
                include_release_dates_with_no_data: true,
                sort_order: "asc",
              },
              timeout: 10000,
            });
            return (response.data?.release_dates || []).map((r) => ({
              releaseId: release.id,
              name: release.name,
              date: r.date,
              source: "FRED",
            }));
          } catch (perReleaseError) {
            // One release failing (e.g. a transient FRED error for that
            // single call) shouldn't take down the whole calendar - log
            // it and continue with whichever releases did succeed.
            console.warn(
              `⚠️ FRED release ${release.id} (${release.name}) fetch failed:`,
              perReleaseError.response?.data || perReleaseError.message,
            );
            return [];
          }
        }),
      );

      const releases = perReleaseResults.flat().sort((a, b) => a.date.localeCompare(b.date));

      this.cache = releases;
      this.lastFetchTime = now;
      console.log(`✅ FRED economic calendar refreshed: ${releases.length} upcoming high-impact releases`);
      return releases;
    } catch (error) {
      console.error(
        "❌ FRED economic calendar fetch failed:",
        error.response?.data || error.message,
      );
      // Serve the last known-good cache if we have one rather than
      // fabricating data - but this is explicitly stale data, not a
      // silent substitute, so the route surfaces cache age to the caller.
      return this.cache;
    }
  }

  getCacheAgeMs() {
    if (!this.lastFetchTime) return null;
    return Date.now() - this.lastFetchTime;
  }
}

module.exports = new EconomicCalendarService();
module.exports.easternDateString = easternDateString;
