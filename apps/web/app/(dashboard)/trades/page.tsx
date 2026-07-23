import type { Metadata } from "next";
import { TradesTable } from "@/components/trades/trades-table";
import { WidgetErrorBoundary } from "@/components/boundaries/widget-error-boundary";
import { apiFetchJson } from "@/lib/api-client";
import type { Trade } from "@/lib/types";

export const metadata: Metadata = { title: "Trade Log — TRADEX" };

async function getTrades(): Promise<Trade[]> {
  try {
    return await apiFetchJson<Trade[]>("/trades");
  } catch {
    return [];
  }
}

export default async function TradesPage() {
  const trades = await getTrades();

  return (
    <WidgetErrorBoundary label="Trade Log">
      <TradesTable initialTrades={trades} />
    </WidgetErrorBoundary>
  );
}
