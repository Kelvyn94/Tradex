import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { apiFetch } from "@/lib/api-client";

interface EconomicRelease {
  releaseId: number;
  name: string;
  date: string;
  source: string;
}

// Not routed through fetchDataEngine/the Data Engine proxy - the
// calendar calls FRED directly from Express (see
// apps/api/src/services/economicCalendar.service.js), so this uses
// apiFetch directly and treats a non-ok response as "unavailable," the
// same explicit-not-fabricated behavior fetchDataEngine gives Data
// Engine-backed widgets.
async function getUpcomingReleases(): Promise<EconomicRelease[] | null> {
  try {
    const response = await apiFetch("/calendar/upcoming");
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.data as EconomicRelease[] | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function EconomicCalendarWidget() {
  const releases = await getUpcomingReleases();

  if (!releases || releases.length === 0) {
    return (
      <FeedOffline
        title="Economic calendar offline"
        description="Upcoming release data is currently unavailable."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Upcoming Releases</h3>
        </div>
        <ul className="space-y-2">
          {releases.slice(0, 8).map((release, idx) => (
            <li
              key={`${release.releaseId}-${release.date}-${idx}`}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-foreground">{release.name}</span>
              <span className="tabular-price text-muted-foreground">{release.date}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
