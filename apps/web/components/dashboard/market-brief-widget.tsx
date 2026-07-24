"use client";

import * as React from "react";
import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { clientApi, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Period = "daily" | "weekly";

interface BriefSection {
  available: boolean;
  text: string;
}

interface BriefData {
  period: Period;
  generatedAt: string;
  sections: {
    macro: BriefSection;
    cot: BriefSection;
    correlation: BriefSection;
    calendar: BriefSection;
  };
}

const SECTION_LABELS: Record<keyof BriefData["sections"], string> = {
  macro: "Macro",
  cot: "Positioning",
  correlation: "Correlation",
  calendar: "Calendar",
};

// Templated/rules-based narrative from data already computed elsewhere
// (macro regime, COT, correlation, calendar) - not an AI call. See
// apps/api/src/services/brief.service.js. This is a distinct feature
// from DailyBrief (the AI-generated "Daily ICT Brief" digest,
// components/dashboard/daily-brief.tsx) - named "Market Brief" here to
// avoid confusion with it.
export function MarketBriefWidget() {
  const [period, setPeriod] = React.useState<Period>("daily");
  const [brief, setBrief] = React.useState<BriefData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    clientApi<{ success: boolean; data: BriefData }>(`/brief?period=${period}`)
      .then((res) => {
        if (!cancelled) setBrief(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load brief");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Market Brief</h3>
          </div>
          <div className="flex rounded-md border border-border p-0.5">
            {(["daily", "weekly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading brief...</p>}

        {!loading && error && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Market brief is currently unavailable.
          </p>
        )}

        {!loading && !error && brief && (
          <ul className="space-y-2.5">
            {(Object.keys(brief.sections) as Array<keyof BriefData["sections"]>).map((key) => {
              const section = brief.sections[key];
              return (
                <li key={key} className="text-sm">
                  <span className="font-semibold text-foreground">{SECTION_LABELS[key]}: </span>
                  <span className={cn(section.available ? "text-muted-foreground" : "text-muted-foreground/60 italic")}>
                    {section.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
