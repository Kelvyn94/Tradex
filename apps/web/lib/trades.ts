import { clientApi } from "./client-api";
import type { Trade, TradeFormInput } from "./types";

export function createTrade(input: TradeFormInput): Promise<Trade> {
  return clientApi<Trade>("/trades", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTrade(id: number, input: TradeFormInput): Promise<Trade> {
  return clientApi<Trade>(`/trades/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTrade(id: number): Promise<{ message: string }> {
  return clientApi<{ message: string }>(`/trades/${id}`, {
    method: "DELETE",
  });
}
