"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TradeFormDialog } from "./trade-form-dialog";
import { createTrade, deleteTrade, updateTrade } from "@/lib/trades";
import { cn } from "@/lib/utils";
import type { Trade, TradeFormInput } from "@/lib/types";

interface FilterState {
  instrument: string;
  direction: string;
  dateFrom: string;
  dateTo: string;
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

interface TradesTableProps {
  initialTrades: Trade[];
}

export function TradesTable({ initialTrades }: TradesTableProps) {
  const router = useRouter();
  const [trades, setTrades] = React.useState(initialTrades);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTrade, setEditingTrade] = React.useState<Trade | null>(null);
  const [filter, setFilter] = React.useState<FilterState>({
    instrument: "",
    direction: "",
    dateFrom: "",
    dateTo: "",
  });

  const filteredTrades = React.useMemo(() => {
    return trades.filter((t) => {
      if (filter.instrument && !t.instrument?.toLowerCase().includes(filter.instrument.toLowerCase())) {
        return false;
      }
      if (filter.direction && t.direction !== filter.direction) return false;
      if (filter.dateFrom && t.date < filter.dateFrom) return false;
      if (filter.dateTo && t.date > filter.dateTo) return false;
      return true;
    });
  }, [trades, filter]);

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(input: TradeFormInput) {
    if (editingTrade) {
      await updateTrade(editingTrade.id, input);
    } else {
      await createTrade(input);
    }
    router.refresh();
    // Also refetch client-side so the table reflects the change immediately
    // without waiting on the Server Component re-render.
    const res = await fetch("/api/proxy/trades", { credentials: "include" });
    if (res.ok) setTrades(await res.json());
    setEditingTrade(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this trade? This cannot be undone.")) return;
    await deleteTrade(id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Trade Log</h1>
        <Button
          onClick={() => {
            setEditingTrade(null);
            setFormOpen(true);
          }}
          className="w-fit gap-2"
        >
          <Plus className="h-4 w-4" /> New Trade
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="instrument-filter" className="text-xs">Instrument</Label>
            <Input
              id="instrument-filter"
              name="instrument"
              value={filter.instrument}
              onChange={handleFilterChange}
              placeholder="Search instrument..."
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direction-filter" className="text-xs">Direction</Label>
            <select
              id="direction-filter"
              name="direction"
              value={filter.direction}
              onChange={handleFilterChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-from" className="text-xs">Date From</Label>
            <Input id="date-from" name="dateFrom" type="date" value={filter.dateFrom} onChange={handleFilterChange} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-to" className="text-xs">Date To</Label>
            <Input id="date-to" name="dateTo" type="date" value={filter.dateTo} onChange={handleFilterChange} className="h-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">P&L ($)</TableHead>
                <TableHead className="text-right">P&L (%)</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No trades found. Start logging your trades!
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((trade) => {
                  const pnl = Number(trade.pnl) || 0;
                  const pnlPct = Number(trade.pnl_percentage) || 0;
                  const isWin = pnl >= 0;
                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="tabular-price text-xs text-muted-foreground">{trade.date || "—"}</TableCell>
                      <TableCell className="font-semibold text-foreground">{trade.instrument || "—"}</TableCell>
                      <TableCell>
                        <span className={trade.direction === "Long" ? "text-success" : "text-destructive"}>
                          {trade.direction || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-price text-right text-muted-foreground">
                        {Number(trade.entry).toFixed(4)}
                      </TableCell>
                      <TableCell className="tabular-price text-right text-muted-foreground">
                        {Number(trade.exit).toFixed(4)}
                      </TableCell>
                      <TableCell className="tabular-price text-right text-muted-foreground">{trade.size}</TableCell>
                      <TableCell className={cn("tabular-price text-right font-bold", isWin ? "text-success" : "text-destructive")}>
                        {isWin ? "+" : ""}
                        {formatNumber(pnl)}
                      </TableCell>
                      <TableCell className={cn("tabular-price text-right font-bold", isWin ? "text-success" : "text-destructive")}>
                        {isWin ? "+" : ""}
                        {formatNumber(pnlPct)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            aria-label="Edit trade"
                            onClick={() => {
                              setEditingTrade(trade);
                              setFormOpen(true);
                            }}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete trade"
                            onClick={() => handleDelete(trade.id)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TradeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTrade(null);
        }}
        trade={editingTrade}
        onSave={handleSave}
      />
    </div>
  );
}
