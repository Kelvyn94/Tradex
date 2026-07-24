import { Card, CardContent } from "@/components/ui/card";
import { fetchDataEngine } from "@/lib/data-engine";

interface LatestCandle {
  close: number;
}

// Ported from the legacy frontend's DataEngineDashboard price grid -
// same six assets, same GET /price/:asset route (dataEngineRoutes.js),
// which was otherwise dropped in the Next.js rebuild.
const TICKER_ASSETS = ["EURUSD", "GBPUSD", "XAUUSD", "XAGUSD", "XAUEUR", "XAUGBP"];

export async function PriceTicker() {
  const prices = await Promise.all(
    TICKER_ASSETS.map((asset) => fetchDataEngine<LatestCandle>(`/price/${asset}`)),
  );

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Live Prices</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TICKER_ASSETS.map((asset, i) => {
            const close = prices[i]?.close;
            return (
              <div key={asset} className="rounded-lg border border-border p-3 text-center">
                <p className="mb-1 text-xs font-bold text-foreground">{asset}</p>
                <p className="tabular-price text-sm font-semibold text-foreground">
                  {typeof close === "number" ? close.toFixed(4) : "..."}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
