"use client";

import * as React from "react";
import { PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client-api";
import { runBacktest, BACKTEST_STRATEGIES, type BacktestResult } from "@/lib/backtest";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular-price text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function BacktestPage() {
  const [strategy, setStrategy] = React.useState(BACKTEST_STRATEGIES[0].value);
  const [assets, setAssets] = React.useState("EURUSD");
  const [timeframe, setTimeframe] = React.useState("daily");
  const [lookback, setLookback] = React.useState("200");
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BacktestResult | null>(null);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const assetList = assets
        .split(",")
        .map((a) => a.trim().toUpperCase())
        .filter(Boolean);
      const response = await runBacktest({
        strategy,
        assets: assetList,
        timeframe,
        lookback: Number(lookback) || 200,
        strategy_params: { asset: assetList[0] },
      });
      setResult(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Backtest failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <PlayCircle className="h-5 w-5 text-primary" /> Backtest
        </h1>
        <p className="text-sm text-muted-foreground">
          Run a strategy against historical data. Stats only — no charting yet.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleRun} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="strategy">Strategy</Label>
              <select
                id="strategy"
                className={selectClassName}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                {BACKTEST_STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assets">Asset(s)</Label>
              <Input
                id="assets"
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                placeholder="EURUSD"
              />
              <p className="text-xs text-muted-foreground">Comma-separated for multi-asset strategies</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timeframe">Timeframe</Label>
              <select
                id="timeframe"
                className={selectClassName}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="4h">4h</option>
                <option value="1h">1h</option>
                <option value="30m">30m</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lookback">Lookback (candles)</Label>
              <Input
                id="lookback"
                type="number"
                min="20"
                value={lookback}
                onChange={(e) => setLookback(e.target.value)}
              />
            </div>

            <div className="sm:col-span-4">
              <Button type="submit" disabled={running}>
                {running ? "Running..." : "Run Backtest"}
              </Button>
            </div>
          </form>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Results</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Total Trades" value={String(result.total_trades)} />
              <StatTile label="Win Rate" value={`${(result.win_rate * 100).toFixed(1)}%`} />
              <StatTile label="Total P&L" value={`$${result.total_pnl.toFixed(2)}`} />
              <StatTile label="Sharpe" value={result.sharpe_ratio.toFixed(2)} />
              <StatTile label="Sortino" value={result.sortino_ratio.toFixed(2)} />
              <StatTile label="Calmar" value={result.calmar_ratio.toFixed(2)} />
              <StatTile label="Max Drawdown" value={`${(result.max_drawdown * 100).toFixed(1)}%`} />
              <StatTile label="Profit Factor" value={result.profit_factor.toFixed(2)} />
            </div>

            {result.trades.length > 0 && (
              <div className="mt-4 overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Asset</th>
                      <th className="p-2">Side</th>
                      <th className="p-2">Entry</th>
                      <th className="p-2">Exit</th>
                      <th className="p-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 20).map((t, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 text-foreground">{t.asset}</td>
                        <td className="p-2 text-foreground">{t.side}</td>
                        <td className="tabular-price p-2">{t.entry_price.toFixed(4)}</td>
                        <td className="tabular-price p-2">{t.exit_price.toFixed(4)}</td>
                        <td className={`tabular-price p-2 font-semibold ${t.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {t.pnl >= 0 ? "+" : ""}
                          {t.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.trades.length > 20 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing first 20 of {result.trades.length} trades.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
