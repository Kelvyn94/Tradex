import { Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import type { DailyDigest } from "@/lib/types";

async function getDailyDigest(): Promise<DailyDigest | null> {
  try {
    const response = await apiFetch("/insights/daily");
    if (!response.ok) return null;
    const body = await response.json();
    return body.data as DailyDigest;
  } catch {
    return null;
  }
}

export async function DailyBrief() {
  const digest = await getDailyDigest();

  if (!digest) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Today&apos;s brief hasn&apos;t been generated yet — check back shortly.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Daily ICT Brief
        </h3>
        <span className="tabular-price text-[10px] text-muted-foreground">
          {new Date(digest.digest_date).toLocaleDateString()}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {digest.content}
      </p>
    </div>
  );
}
