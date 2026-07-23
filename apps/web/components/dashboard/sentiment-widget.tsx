"use client";

import * as React from "react";
import {
  AlertCircle,
  Minus,
  Newspaper,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { SentimentResponse } from "@/lib/types";

const SENTIMENT_COLOR: Record<string, string> = {
  BULLISH: "text-success",
  BEARISH: "text-destructive",
  NEUTRAL: "text-warning",
};

const RISK_COLOR: Record<string, string> = {
  LOW: "bg-success",
  MEDIUM: "bg-warning",
  HIGH: "bg-destructive",
};

const SENTIMENT_ICON: Record<string, React.ElementType> = {
  BULLISH: TrendingUp,
  BEARISH: TrendingDown,
  NEUTRAL: Minus,
};

interface SentimentWidgetProps {
  instrument?: string;
}

export function SentimentWidget({ instrument = "XAUUSD" }: SentimentWidgetProps) {
  const [sentiment, setSentiment] = React.useState<SentimentResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchSentiment = React.useCallback(async () => {
    try {
      const data = await clientApi<{ success: boolean; data: SentimentResponse }>(
        `/sentiment/${instrument}`,
      );
      setSentiment(data.data ?? null);
    } catch {
      setSentiment(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [instrument]);

  React.useEffect(() => {
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSentiment]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-3.5 w-10 rounded bg-muted" />
        </div>
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="h-3.5 w-full rounded bg-muted" />
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Newspaper className="h-3.5 w-3.5" /> Sentiment
          </h3>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchSentiment();
            }}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" /> No sentiment data available
        </div>
      </div>
    );
  }

  const data = sentiment.synthesis;
  const Icon = SENTIMENT_ICON[data.overallSentiment] ?? Minus;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Newspaper className="h-3.5 w-3.5" /> {instrument} Sentiment
        </h3>
        <div className="flex items-center gap-2">
          <span className="tabular-price text-[10px] text-muted-foreground">
            {new Date(sentiment.timestamp).toLocaleTimeString()}
          </span>
          <button
            type="button"
            aria-label="Refresh sentiment"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              fetchSentiment();
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <Icon className={cn("h-5 w-5", SENTIMENT_COLOR[data.overallSentiment])} />
        <span className={cn("text-xl font-bold", SENTIMENT_COLOR[data.overallSentiment])}>
          {data.overallSentiment}
        </span>
        <span className="tabular-price text-xs text-muted-foreground">
          {data.confidence}% confidence
        </span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Risk:</span>
          <span className={cn("h-2 w-2 rounded-full", RISK_COLOR[data.riskLevel])} />
          <span className="text-[10px] text-muted-foreground">{data.riskLevel}</span>
        </div>
      </div>

      <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
        {data.rationale}
      </p>

      {data.tradingImplication && (
        <div className="mt-2 rounded-lg border border-border bg-background/50 p-2">
          <span className="text-[10px] text-muted-foreground">Implication: </span>
          <span className="text-xs text-foreground">{data.tradingImplication}</span>
        </div>
      )}
    </div>
  );
}
