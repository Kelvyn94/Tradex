import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { fetchDataEngine } from "@/lib/data-engine";
import { cn } from "@/lib/utils";

interface COTPositioning {
  asset: string;
  marketName: string;
  reportDate: string;
  openInterest: number;
  commercial: { long: number; short: number; net: number };
  nonCommercial: { long: number; short: number; spread: number; net: number };
  nonReportable: { long: number; short: number; net: number };
  source: string;
}

const ASSET_LABELS: Record<string, string> = {
  XAUUSD: "Gold",
  XAGUSD: "Silver",
  EURUSD: "EUR",
  GBPUSD: "GBP",
};

function NetRow({ net, label }: { net: number; label: string }) {
  const isFlat = net === 0;
  const isLong = net > 0;
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-price flex items-center gap-1 font-semibold",
          isFlat ? "text-muted-foreground" : isLong ? "text-success" : "text-destructive",
        )}
      >
        {!isFlat &&
          (isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
        {isLong ? "+" : ""}
        {net.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * CFTC Commitment of Traders positioning - Commercial (hedgers/"smart
 * money") vs Non-Commercial (large speculators) net contracts, from the
 * same COMEX/CME futures underlying this app's price data. Net figures
 * exclude Non-Commercial spread positions (long+short in different
 * contract months simultaneously, no net directional bias by
 * definition) - the standard convention for reading COT positioning.
 */
export async function COTPositioningStrip() {
  const positioning = await fetchDataEngine<COTPositioning[]>("/cot");

  if (!positioning || positioning.length === 0) {
    return (
      <FeedOffline
        title="Institutional positioning offline"
        description="CFTC Commitment of Traders data is currently unavailable."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Institutional Positioning</h3>
          <span className="text-xs text-muted-foreground">
            CFTC COT &middot; week of {positioning[0].reportDate}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {positioning.map((p) => (
            <div key={p.asset} className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-bold text-foreground">
                {ASSET_LABELS[p.asset] ?? p.asset}
              </p>
              <NetRow net={p.commercial.net} label="Commercial" />
              <NetRow net={p.nonCommercial.net} label="Speculators" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
