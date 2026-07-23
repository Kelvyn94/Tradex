// Mirrors the actual response shapes returned by apps/api (verified against
// authController.js, analyticsController.js, Trade.js). Keeping these in one
// place is what prevents the frontend from guessing a contract the backend
// doesn't actually honor — the exact bug class fixed twice during the
// pre-migration debugging pass (Dashboard.jsx, AIAssistant.jsx).

export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyDigest {
  id: number;
  digest_date: string;
  content: string;
  created_at: string;
}

export interface Trade {
  id: number;
  user_id: number;
  date: string;
  instrument: string;
  direction: "Long" | "Short";
  entry: string;
  exit: string;
  size: string;
  stop_loss: string | null;
  take_profit: string | null;
  pnl: string;
  pnl_percentage: string;
  risk_reward_ratio: string | null;
  tags: string[];
  notes: string;
  created_at: string;
  updated_at: string;
  instrument_type?: string;
  pip_value?: string;
  pips?: string;
  pip_profit?: string;
  risk_in_dollars?: string;
}

// Payload shape the API expects for create/update — camelCase, matching
// validation.js's express-validator rules exactly.
export interface TradeFormInput {
  date: string;
  instrument: string;
  direction: "Long" | "Short";
  entry: number;
  exit: number;
  size: number;
  stopLoss: number | null;
  takeProfit: number | null;
  tags: string[];
  notes: string;
}

export interface DashboardStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  largestWin: number;
  largestLoss: number;
  maxConsecWin: number;
  maxConsecLoss: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
}

export interface MonthlyPoint {
  month: string;
  pnl: number;
}

export interface DashboardData {
  stats: DashboardStats;
  equity: EquityPoint[];
  monthly: MonthlyPoint[];
  recentTrades: Trade[];
}

export interface SentimentSynthesis {
  overallSentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  rationale: string;
  keyThemes: string[];
  tradingImplication: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface SentimentResponse {
  success: boolean;
  instrument: string;
  timestamp: string;
  synthesis: SentimentSynthesis;
  details: {
    articlesAnalyzed: number;
    sources: string[];
  };
}

// Asset groups smtDetection.service.js scans — single source of truth so
// the SMT Matrix UI never drifts from what the backend actually detects.
export const ASSET_GROUPS = {
  gold: { primary: "XAUUSD", correlated: ["XAGUSD", "XAUEUR", "XAUGBP"], label: "Gold & Metals" },
  forex: { primary: "EURUSD", correlated: ["GBPUSD"], label: "Forex Majors" },
  indices: { primary: "NAS100", correlated: ["US500", "US30"], label: "US Indices" },
} as const;
