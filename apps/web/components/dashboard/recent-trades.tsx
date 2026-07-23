import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No trades yet. Start logging your trades!</p>
        <Link
          href="/trades"
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Log Your First Trade <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const visible = trades.slice(0, 5);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Instrument</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((trade) => {
            const pnl = parseFloat(trade.pnl) || 0;
            const isWin = pnl >= 0;
            return (
              <TableRow key={trade.id}>
                <TableCell className="tabular-price text-xs text-muted-foreground">
                  {trade.date}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {trade.instrument}
                </TableCell>
                <TableCell>
                  <span className={isWin ? "text-success" : "text-destructive"}>
                    {trade.direction}
                  </span>
                </TableCell>
                <TableCell className="tabular-price text-right text-muted-foreground">
                  {trade.entry}
                </TableCell>
                <TableCell className="tabular-price text-right text-muted-foreground">
                  {trade.exit}
                </TableCell>
                <TableCell
                  className={cn(
                    "tabular-price text-right font-bold",
                    isWin ? "text-success" : "text-destructive",
                  )}
                >
                  {isWin ? "+" : ""}
                  {pnl.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {trades.length > 5 && (
        <div className="mt-3 text-center">
          <Link href="/trades" className="text-sm text-primary hover:underline">
            View all {trades.length} trades →
          </Link>
        </div>
      )}
    </div>
  );
}
