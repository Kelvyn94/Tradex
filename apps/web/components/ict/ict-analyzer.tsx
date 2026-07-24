"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { clientApi, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const ASSETS = ["EURUSD", "GBPUSD", "XAUUSD", "XAGUSD", "XAUEUR", "XAUGBP"];

// Field names match ICTService.analyze_asset's real response shape
// (backend/services/ict_service.py) - the service returns much more
// (BOS, CHOCH, liquidity, sessions, killzones, premium/discount,
// mitigation, dealing range, quarterly theory) but this mirrors only
// the four sections the legacy app displayed.
interface ICTAnalysis {
  signal?: { action: string; confidence: number; reasons?: string[] };
  market_structure?: { current_structure?: { trend?: string }; market_phase?: string };
  order_blocks?: { bullish?: unknown[]; bearish?: unknown[] };
  fvgs?: unknown[];
  unfilled_fvgs?: unknown[];
}

export function ICTAnalyzer() {
  const [asset, setAsset] = React.useState(ASSETS[2]);
  const [loading, setLoading] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<ICTAnalysis | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setOffline(false);
    setAnalysis(null);
    try {
      const result = await clientApi<{ data: ICTAnalysis }>(`/data-engine/ict/${asset}`);
      setAnalysis(result.data ?? (result as unknown as ICTAnalysis));
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) {
        setOffline(true);
      } else {
        setOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {ASSETS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onClick={() => setAsset(symbol)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-colors",
                asset === symbol
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {symbol}
            </button>
          ))}
          <Button size="sm" onClick={handleAnalyze} disabled={loading} className="ml-auto gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {offline && <FeedOffline title="ICT analysis feed offline" description="Structure/order-block analysis depends on the external Data Engine." />}

      {analysis && !offline && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Signal</h3>
              <p className="text-2xl font-bold text-foreground">{analysis.signal?.action ?? "HOLD"}</p>
              <p className="text-xs text-muted-foreground">
                Confidence: {((analysis.signal?.confidence ?? 0) * 100).toFixed(0)}%
              </p>
              {analysis.signal?.reasons && analysis.signal.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {analysis.signal.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      • {reason}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Market Structure</h3>
              <p className="text-sm text-foreground">
                Trend: {analysis.market_structure?.current_structure?.trend ?? "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                Phase: {analysis.market_structure?.market_phase ?? "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Order Blocks</h3>
              <p className="text-sm text-foreground">
                Bullish: {analysis.order_blocks?.bullish?.length ?? 0}
              </p>
              <p className="text-sm text-foreground">
                Bearish: {analysis.order_blocks?.bearish?.length ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Fair Value Gaps</h3>
              <p className="text-sm text-foreground">Total: {analysis.fvgs?.length ?? 0}</p>
              <p className="text-sm text-foreground">Unfilled: {analysis.unfilled_fvgs?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!analysis && !offline && !loading && (
        <p className="text-center text-sm text-muted-foreground">
          Select an asset and run analysis to see market structure, order blocks, and FVGs.
        </p>
      )}
    </div>
  );
}
