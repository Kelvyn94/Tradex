import type { Metadata } from "next";
import { Award, DollarSign, Percent, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/analytics/refresh-button";
import { EquityChart } from "@/components/dashboard/equity-chart";
import { MonthlyPnlChart } from "@/components/analytics/monthly-pnl-chart";
import { WidgetErrorBoundary } from "@/components/boundaries/widget-error-boundary";
import { apiFetchJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

export const metadata: Metadata = { title: "Analytics — TRADEX" };

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    return await apiFetchJson<DashboardData>("/analytics/dashboard");
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const data = await getDashboardData();
  const stats = data?.stats;

  const statCards = [
    {
      title: "Total P&L",
      value: `$${(stats?.totalPnl ?? 0).toFixed(2)}`,
      icon: DollarSign,
      tone: (stats?.totalPnl ?? 0) >= 0 ? "text-success" : "text-destructive",
    },
    {
      title: "Win Rate",
      value: `${(stats?.winRate ?? 0).toFixed(1)}%`,
      icon: Percent,
      tone: (stats?.winRate ?? 0) >= 50 ? "text-success" : "text-destructive",
    },
    {
      title: "Avg R:R",
      value: `${(stats?.avgRR ?? 0).toFixed(2)}:1`,
      icon: Award,
      tone: "text-primary",
    },
    {
      title: "Total Trades",
      value: String(stats?.total ?? 0),
      icon: TrendingUp,
      tone: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance metrics and trading insights
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </p>
                <p className={cn("tabular-price mt-1 text-2xl font-bold", stat.tone)}>{stat.value}</p>
              </div>
              <stat.icon className={cn("h-6 w-6", stat.tone)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (stats.maxConsecWin > 0 || stats.maxConsecLoss > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Largest Win</p>
              <p className="tabular-price mt-1 text-lg font-bold text-success">
                ${stats.largestWin.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Largest Loss</p>
              <p className="tabular-price mt-1 text-lg font-bold text-destructive">
                ${stats.largestLoss.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Max Consecutive Wins</p>
              <p className="tabular-price mt-1 text-lg font-bold text-success">{stats.maxConsecWin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Max Consecutive Losses</p>
              <p className="tabular-price mt-1 text-lg font-bold text-destructive">{stats.maxConsecLoss}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Equity Curve</h3>
            <WidgetErrorBoundary label="Equity Curve">
              <EquityChart data={data?.equity ?? []} />
            </WidgetErrorBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Monthly P&L</h3>
            <WidgetErrorBoundary label="Monthly P&L">
              <MonthlyPnlChart data={data?.monthly ?? []} />
            </WidgetErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
