import { TrendingUp, TrendingDown, Radar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SMTSignal {
  type: "BULLISH" | "BEARISH";
  primaryAsset: string;
  correlatedAsset: string;
  confidence: number;
  timeframe: string;
  group: string;
  description: string;
  timestamp: string;
}

// Reads the real signal history smtDetection.service.js already
// accumulates from its 5-minute auto-scan (websocket.service.js) -
// previously this data only ever left the backend as push
// notifications, with no in-app view. Not routed through
// fetchDataEngine/the Data Engine proxy - smtRoutes.js is a native
// Express route, same as the economic calendar.
async function getSignals(): Promise<SMTSignal[] | null> {
  try {
    const response = await apiFetch("/smt/signals?limit=10");
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.data as SMTSignal[] | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function SMTSignalFeed() {
  const signals = await getSignals();

  if (!signals) {
    return (
      <FeedOffline
        title="SMT signal feed offline"
        description="Smart money divergence signals are currently unavailable."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">SMT Signals</h3>
        </div>
        {signals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No SMT divergences detected in the last scan cycle.
          </p>
        ) : (
          <ul className="space-y-3">
            {signals.map((signal, idx) => (
              <li
                key={`${signal.primaryAsset}-${signal.correlatedAsset}-${signal.timeframe}-${signal.timestamp}-${idx}`}
                className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={signal.type === "BULLISH" ? "success" : "destructive"} className="gap-1">
                      {signal.type === "BULLISH" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {signal.type}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {signal.primaryAsset} / {signal.correlatedAsset}
                    </span>
                    <span className="text-xs text-muted-foreground">{signal.timeframe}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{signal.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "tabular-price font-semibold",
                      signal.confidence > 80 ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {signal.confidence}%
                  </span>
                  <span className="tabular-price text-muted-foreground">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
