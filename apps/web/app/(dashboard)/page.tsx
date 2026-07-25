import { Activity, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EquityChart } from "@/components/dashboard/equity-chart";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { SentimentWidget } from "@/components/dashboard/sentiment-widget";
import { COTPositioningStrip } from "@/components/dashboard/cot-positioning-strip";
import { EconomicCalendarWidget } from "@/components/dashboard/economic-calendar-widget";
import { CorrelationWidget } from "@/components/dashboard/correlation-widget";
import { MacroRegimeStrip } from "@/components/dashboard/macro-regime-strip";
import { SMTSignalFeed } from "@/components/dashboard/smt-signal-feed";
import { MarketBriefWidget } from "@/components/dashboard/market-brief-widget";
import { WidgetErrorBoundary } from "@/components/boundaries/widget-error-boundary";
import { apiFetchJson } from "@/lib/api-client";
import type { DashboardData } from "@/lib/types";

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    return await apiFetchJson<DashboardData>("/analytics/dashboard");
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Trading Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Institutional-grade performance snapshot
          </p>
        </div>
        <Badge variant="success" className="w-fit gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Market Open
        </Badge>
      </div>

      <WidgetErrorBoundary label="Market Brief">
        <MarketBriefWidget />
      </WidgetErrorBoundary>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <WidgetErrorBoundary label="Institutional Positioning">
            <COTPositioningStrip />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary label="Macro Regime">
            <MacroRegimeStrip />
          </WidgetErrorBoundary>
        </div>
        <div className="space-y-4">
          <WidgetErrorBoundary label="Economic Calendar">
            <EconomicCalendarWidget />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary label="Correlation">
            <CorrelationWidget />
          </WidgetErrorBoundary>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <WidgetErrorBoundary label="Market Sentiment">
            <SentimentWidget />
          </WidgetErrorBoundary>
        </CardContent>
      </Card>

      <WidgetErrorBoundary label="SMT Signals">
        <SMTSignalFeed />
      </WidgetErrorBoundary>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard title="Total Trades" value={String(stats?.total ?? 0)} icon={Activity} />
        <StatsCard
          title="Win Rate"
          value={`${(stats?.winRate ?? 0).toFixed(1)}%`}
          icon={BarChart3}
          tone={(stats?.winRate ?? 0) >= 50 ? "success" : "warning"}
        />
        <StatsCard
          title="Total P&L"
          value={`$${(stats?.totalPnl ?? 0).toFixed(2)}`}
          icon={DollarSign}
          tone={(stats?.totalPnl ?? 0) >= 0 ? "success" : "danger"}
        />
        <StatsCard
          title="Avg R:R"
          value={`${(stats?.avgRR ?? 0).toFixed(2)}:1`}
          icon={TrendingUp}
        />
      </div>

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
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Trades</h3>
          <WidgetErrorBoundary label="Recent Trades">
            <RecentTrades trades={data?.recentTrades ?? []} />
          </WidgetErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
