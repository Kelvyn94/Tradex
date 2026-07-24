import type { Metadata } from "next";
import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { PriceTicker } from "@/components/data-engine/price-ticker";
import { fetchDataEngine, type Insight, type Signal } from "@/lib/data-engine";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Data Engine — TRADEX" };

const SIGNAL_TONE: Record<Signal["signal_type"], string> = {
  BUY: "success",
  SELL: "destructive",
  HOLD: "warning",
};

export default async function DataEngineDashboardPage() {
  const [insights, signals] = await Promise.all([
    fetchDataEngine<Insight[]>("/insights?limit=10"),
    fetchDataEngine<Signal[]>("/signals?limit=5"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <Database className="h-5 w-5 text-primary" /> Data Engine
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-generated insights and trading signals from the external data engine
        </p>
      </div>

      <PriceTicker />

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Trading Signals</h2>
          {signals === null ? (
            <FeedOffline title="Signals feed offline" />
          ) : signals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No active signals</p>
          ) : (
            <div className="space-y-2">
              {signals.map((signal, index) => (
                <div
                  key={`${signal.asset_symbol}-${index}`}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{signal.asset_symbol}</span>
                    <Badge
                      variant={SIGNAL_TONE[signal.signal_type] as "success" | "destructive" | "warning"}
                    >
                      {signal.signal_type}
                    </Badge>
                  </div>
                  <span className="tabular-price text-xs text-muted-foreground">
                    {(signal.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">AI Insights Feed</h2>
          {insights === null ? (
            <FeedOffline title="Insights feed offline" />
          ) : insights.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No insights available</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn("border-l-2 border-primary pl-3")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                    <span className="tabular-price shrink-0 text-[10px] text-muted-foreground">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {insight.asset_symbol} • {new Date(insight.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
