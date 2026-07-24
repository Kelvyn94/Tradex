import { TrendingUp, TrendingDown, Minus, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { fetchDataEngine } from "@/lib/data-engine";
import { cn } from "@/lib/utils";

interface MacroSeries {
  label: string;
  ticker: string;
  value: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
  asOf: string;
}

interface MacroData {
  // Partial, not a guaranteed full record: the backend omits any series
  // whose fetch failed rather than fabricating a value for it (confirmed
  // in production - DXY has been observed missing while US10Y/VIX
  // succeed). The type must reflect that a caller cannot assume all
  // three are always present - the crash this replaced came from
  // assuming otherwise.
  series: Partial<Record<"DXY" | "US10Y" | "VIX", MacroSeries>>;
  riskRegime: "RISK_ON" | "ELEVATED" | "RISK_OFF" | null;
}

const REGIME_LABEL: Record<string, { text: string; tone: "success" | "warning" | "destructive" }> = {
  RISK_ON: { text: "Risk-On", tone: "success" },
  ELEVATED: { text: "Elevated", tone: "warning" },
  RISK_OFF: { text: "Risk-Off", tone: "destructive" },
};

function DirectionIcon({ direction }: { direction: MacroSeries["direction"] }) {
  if (direction === "up") return <TrendingUp className="h-3 w-3" />;
  if (direction === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

/**
 * DXY / 10Y Treasury yield / VIX snapshot, giving SMT and correlation
 * signals macro context instead of existing in isolation. Values shown
 * as-is from the backend (US10Y is already a direct yield percentage,
 * e.g. 4.70 = 4.70%, verified against live data before building this -
 * not the old CBOE x10 index convention).
 */
export async function MacroRegimeStrip() {
  const macro = await fetchDataEngine<MacroData>("/macro");

  if (!macro || !macro.series) {
    return (
      <FeedOffline
        title="Macro context offline"
        description="DXY / Treasury yield / VIX data is currently unavailable."
      />
    );
  }

  const { DXY, US10Y, VIX } = macro.series;
  const regime = macro.riskRegime ? REGIME_LABEL[macro.riskRegime] : null;
  const items: Array<{ key: string; series: MacroSeries | undefined; format: (v: number) => string }> = [
    { key: "DXY", series: DXY, format: (v) => v.toFixed(2) },
    { key: "US10Y", series: US10Y, format: (v) => `${v.toFixed(2)}%` },
    { key: "VIX", series: VIX, format: (v) => v.toFixed(2) },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Macro Regime</h3>
          </div>
          {regime && (
            <Badge variant={regime.tone} className="text-xs">
              {regime.text}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {items.map(({ key, series, format }) => (
            <div key={key} className="rounded-lg border border-border p-2 text-center sm:p-3">
              <p className="mb-1 text-xs font-bold text-foreground">{key}</p>
              {series ? (
                <>
                  <p className="tabular-price text-sm font-semibold text-foreground">
                    {format(series.value)}
                  </p>
                  <p
                    className={cn(
                      "mt-1 flex items-center justify-center gap-1 text-xs",
                      series.direction === "up"
                        ? "text-success"
                        : series.direction === "down"
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    <DirectionIcon direction={series.direction} />
                    {series.changePercent >= 0 ? "+" : ""}
                    {series.changePercent.toFixed(2)}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Unavailable</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
