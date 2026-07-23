"use client";

import * as React from "react";
import { Calculator, TrendingDown, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Trade, TradeFormInput } from "@/lib/types";

interface FormState {
  date: string;
  instrument: string;
  direction: "Long" | "Short";
  entry: string;
  exit: string;
  size: string;
  stopLoss: string;
  takeProfit: string;
  tags: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    direction: "Long",
    entry: "",
    exit: "",
    size: "0.01",
    stopLoss: "",
    takeProfit: "",
    tags: "",
    notes: "",
  };
}

function fromTrade(trade: Trade): FormState {
  return {
    date: trade.date ?? new Date().toISOString().split("T")[0],
    instrument: trade.instrument ?? "",
    direction: trade.direction ?? "Long",
    entry: trade.entry ?? "",
    exit: trade.exit ?? "",
    size: trade.size ?? "0.01",
    stopLoss: trade.stop_loss ?? "",
    takeProfit: trade.take_profit ?? "",
    tags: Array.isArray(trade.tags) ? trade.tags.join(", ") : "",
    notes: trade.notes ?? "",
  };
}

interface PreviewState {
  pnl: number;
  pnlPct: number;
  riskReward: number | null;
  riskInDollars: number | null;
  isWin: boolean;
}

interface TradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
  onSave: (input: TradeFormInput) => Promise<void>;
}

export function TradeFormDialog({ open, onOpenChange, trade, onSave }: TradeFormDialogProps) {
  const isEditing = !!trade;
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(trade ? fromTrade(trade) : emptyForm());
      setError(null);
    }
  }, [open, trade]);

  const preview = React.useMemo<PreviewState | null>(() => {
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const size = parseFloat(form.size);
    const stopLoss = parseFloat(form.stopLoss);
    const takeProfit = parseFloat(form.takeProfit);

    if (!entry || !exit || !size) return null;

    const diff = form.direction === "Long" ? exit - entry : entry - exit;
    const pnl = diff * size;
    const pnlPct = (diff / entry) * 100;

    let riskReward: number | null = null;
    let riskInDollars: number | null = null;
    if (entry && stopLoss && takeProfit) {
      const risk = Math.abs(entry - stopLoss);
      const reward = Math.abs(takeProfit - entry);
      riskReward = risk === 0 ? null : reward / risk;
      riskInDollars = risk * size;
    }

    return { pnl, pnlPct, riskReward, riskInDollars, isWin: pnl >= 0 };
  }, [form.entry, form.exit, form.size, form.stopLoss, form.takeProfit, form.direction]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const size = parseFloat(form.size);
    const stopLoss = form.stopLoss ? parseFloat(form.stopLoss) : null;
    const takeProfit = form.takeProfit ? parseFloat(form.takeProfit) : null;

    if (!form.instrument || Number.isNaN(entry) || Number.isNaN(exit) || Number.isNaN(size)) {
      setError("Please fill in all required fields with valid numbers");
      return;
    }
    if (entry <= 0 || exit <= 0 || size <= 0) {
      setError("Entry, Exit, and Size must be positive numbers");
      return;
    }

    const input: TradeFormInput = {
      date: form.date,
      instrument: form.instrument.toUpperCase().trim(),
      direction: form.direction,
      entry,
      exit,
      size,
      stopLoss,
      takeProfit,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      notes: form.notes || "",
    };

    setSubmitting(true);
    try {
      await onSave(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trade");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Trade" : "New Trade Entry"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instrument">Instrument *</Label>
              <Input
                id="instrument"
                name="instrument"
                value={form.instrument}
                onChange={handleChange}
                placeholder="e.g., XAUUSD, EURUSD, AAPL"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter any instrument (Gold, Forex, Stocks, Crypto)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Direction *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, direction: "Long" }))}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-bold transition-colors",
                    form.direction === "Long"
                      ? "border-success bg-success/15 text-success"
                      : "border-input text-muted-foreground hover:border-success/50",
                  )}
                >
                  <TrendingUp className="h-4 w-4" /> Long (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, direction: "Short" }))}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-bold transition-colors",
                    form.direction === "Short"
                      ? "border-destructive bg-destructive/15 text-destructive"
                      : "border-input text-muted-foreground hover:border-destructive/50",
                  )}
                >
                  <TrendingDown className="h-4 w-4" /> Short (Sell)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Position Size (Lots/Units) *</Label>
              <Input id="size" name="size" type="number" step="0.01" min="0.01" value={form.size} onChange={handleChange} required />
              <p className="text-xs text-muted-foreground">0.01 lots = 1 micro lot</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entry">Entry Price *</Label>
              <Input id="entry" name="entry" type="number" step="any" value={form.entry} onChange={handleChange} placeholder="0.00" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exit">Exit Price *</Label>
              <Input id="exit" name="exit" type="number" step="any" value={form.exit} onChange={handleChange} placeholder="0.00" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input id="stopLoss" name="stopLoss" type="number" step="any" value={form.stopLoss} onChange={handleChange} placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input id="takeProfit" name="takeProfit" type="number" step="any" value={form.takeProfit} onChange={handleChange} placeholder="0.00" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g., gold, breakout, momentum" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Trade rationale, emotions, lessons learned..." />
            </div>
          </div>

          {preview && (
            <div className="mt-6 rounded-lg border border-border bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Live P&L Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">P&L ($)</p>
                  <p className={cn("tabular-price text-lg font-bold", preview.isWin ? "text-success" : "text-destructive")}>
                    {preview.isWin ? "+" : ""}
                    {preview.pnl.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P&L (%)</p>
                  <p className={cn("tabular-price text-lg font-bold", preview.isWin ? "text-success" : "text-destructive")}>
                    {preview.isWin ? "+" : ""}
                    {preview.pnlPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk:Reward</p>
                  <p className="tabular-price text-lg font-bold text-primary">
                    {preview.riskReward ? `${preview.riskReward.toFixed(2)}:1` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Amount</p>
                  <p className="tabular-price text-lg font-bold text-warning">
                    {preview.riskInDollars ? `$${preview.riskInDollars.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Trade" : "Save Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
