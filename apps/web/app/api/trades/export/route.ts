import { NextResponse } from "next/server";
import { apiFetch, UnauthenticatedError } from "@/lib/api-client";
import type { Trade } from "@/lib/types";

const CSV_COLUMNS: Array<{ key: keyof Trade; header: string }> = [
  { key: "date", header: "Date" },
  { key: "instrument", header: "Instrument" },
  { key: "direction", header: "Direction" },
  { key: "entry", header: "Entry" },
  { key: "exit", header: "Exit" },
  { key: "size", header: "Size" },
  { key: "stop_loss", header: "Stop Loss" },
  { key: "take_profit", header: "Take Profit" },
  { key: "pnl", header: "P&L" },
  { key: "pnl_percentage", header: "P&L %" },
  { key: "risk_reward_ratio", header: "R:R" },
  { key: "tags", header: "Tags" },
  { key: "notes", header: "Notes" },
];

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function tradesToCsv(trades: Trade[]): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows = trades.map((trade) =>
    CSV_COLUMNS.map((c) => escapeCsvField(trade[c.key])).join(","),
  );
  // Leading BOM so Excel opens the CSV as UTF-8 instead of guessing ANSI.
  return "﻿" + [header, ...rows].join("\r\n");
}

export async function GET() {
  let trades: Trade[];
  try {
    const response = await apiFetch("/trades");
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to load trades" }, { status: response.status });
    }
    trades = (await response.json()) as Trade[];
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load trades" }, { status: 502 });
  }

  const csv = tradesToCsv(trades);
  const filename = `tradex-trades-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
