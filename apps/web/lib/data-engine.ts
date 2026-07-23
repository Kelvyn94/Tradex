import { apiFetch } from "./api-client";

export interface Insight {
  title: string;
  description: string;
  confidence: number;
  asset_symbol: string;
  created_at: string;
}

export interface Signal {
  asset_symbol: string;
  signal_type: "BUY" | "SELL" | "HOLD";
  confidence: number;
}

/**
 * Fetches a Data Engine endpoint and returns null on any failure instead of
 * throwing. The external Data Engine is a separate, currently-unreachable
 * service (out of scope to fix per current directive) — every caller of
 * this must treat null as an expected, designed state, not an error.
 */
export async function fetchDataEngine<T>(path: string): Promise<T | null> {
  try {
    const response = await apiFetch(`/data-engine${path}`);
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}
