import { clientApi } from "./client-api";

export interface BacktestTrade {
  asset: string;
  side: string;
  entry_price: number;
  exit_price: number;
  size: number;
  entry_time: string;
  exit_time: string;
  pnl: number;
  pnl_percent: number;
}

export interface BacktestResult {
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  avg_drawdown: number;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  expectancy: number;
  total_pnl: number;
  trades: BacktestTrade[];
  assets_used: string[];
}

export interface BacktestRequest {
  strategy: string;
  assets: string[];
  timeframe?: string;
  lookback?: number;
  start_date?: string;
  end_date?: string;
  strategy_params?: Record<string, unknown>;
  initial_capital?: number;
}

export function runBacktest(input: BacktestRequest): Promise<{ data: BacktestResult }> {
  return clientApi<{ data: BacktestResult }>("/data-engine/backtest/run", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const BACKTEST_STRATEGIES = [
  { value: "simple_momentum", label: "Simple Momentum" },
  { value: "ict_aggressive", label: "ICT Aggressive" },
  { value: "ict_correlation_combined", label: "ICT + Correlation Combined" },
  { value: "pairs_trading_v2", label: "Pairs Trading (Multi-Entry)" },
];
