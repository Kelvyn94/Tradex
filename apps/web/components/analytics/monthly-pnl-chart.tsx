"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { MonthlyPoint } from "@/lib/types";

interface MonthlyPnlChartProps {
  data: MonthlyPoint[];
}

export function MonthlyPnlChart({ data }: MonthlyPnlChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 opacity-40" />
        <p className="text-sm">No trades yet to break down by month</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((point, index) => (
              <Cell
                key={point.month ?? index}
                fill={point.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
