"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { clientApi, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const ASSETS = ["EURUSD", "GBPUSD", "XAUUSD", "XAGUSD", "XAUEUR", "XAUGBP"];

interface ICTAnalysis {
  structure?: { trend: string; phase: string };
  orderBlocks?: { bullish: unknown[]; bearish: unknown[] };
  fvgs?: unknown[];
  [key: string]: unknown;
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
        <Card>
          <CardContent className="space-y-3 p-4 font-mono text-xs">
            <pre className="whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {!analysis && !offline && !loading && (
        <p className="text-center text-sm text-muted-foreground">
          Select an asset and run analysis to see market structure, order blocks, and FVGs.
        </p>
      )}
    </div>
  );
}
