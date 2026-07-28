import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { apiFetch } from "@/lib/api-client";

interface FOMCOutcome {
  available: boolean;
  meetingDate?: string;
  rateDecisionSummary?: string;
  stance?: "HAWKISH" | "DOVISH" | "NEUTRAL" | null;
  confidence?: number | null;
  rationale?: string | null;
  keyPhrases?: string[] | null;
  stanceError?: string | null;
  error?: string;
}

// Colors match this app's existing risk-sentiment convention (see
// sentiment-widget.tsx / macro-regime-strip.tsx): tightening-leaning
// reads as destructive/red, easing-leaning as success/green, balanced
// as warning/amber - not a claim that hawkish is inherently "bad."
const STANCE_STYLE: Record<string, { label: string; variant: "destructive" | "success" | "warning" }> = {
  HAWKISH: { label: "Hawkish", variant: "destructive" },
  DOVISH: { label: "Dovish", variant: "success" },
  NEUTRAL: { label: "Neutral", variant: "warning" },
};

async function getFOMCOutcome(): Promise<FOMCOutcome | null> {
  try {
    const response = await apiFetch("/fomc/latest");
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.data as FOMCOutcome | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Most recent FOMC meeting's rate decision (a fact, from FRED's
 * DFEDTARU/DFEDTARL) plus an AI read of the actual statement text's
 * hawkish/dovish/neutral tone (a judgment call, from Groq via
 * ai.service.js's classifyFOMCStance). See fomc.service.js for why
 * these are kept as two separate things rather than blended.
 */
export async function FOMCOutcomeWidget() {
  const outcome = await getFOMCOutcome();

  if (!outcome || !outcome.available) {
    return (
      <FeedOffline
        title="FOMC outcome unavailable"
        description={outcome?.error ?? "Fed statement/rate-decision data is currently unavailable."}
      />
    );
  }

  const stanceStyle = outcome.stance ? STANCE_STYLE[outcome.stance] : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">FOMC Outcome</h3>
          </div>
          <span className="text-xs text-muted-foreground">{outcome.meetingDate}</span>
        </div>

        <p className="text-sm text-foreground">{outcome.rateDecisionSummary}</p>

        <div className="mt-3">
          {stanceStyle ? (
            <div className="flex items-start gap-2">
              <Badge variant={stanceStyle.variant} className="shrink-0">
                {stanceStyle.label}
                {typeof outcome.confidence === "number" && ` (${Math.round(outcome.confidence * 100)}%)`}
              </Badge>
              {outcome.rationale && (
                <p className="text-xs text-muted-foreground">{outcome.rationale}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Hawkish/dovish read unavailable{outcome.stanceError ? `: ${outcome.stanceError}` : "."}
            </p>
          )}
        </div>

        {outcome.keyPhrases && outcome.keyPhrases.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {outcome.keyPhrases.map((phrase, i) => (
              <li key={i} className="text-xs italic text-muted-foreground/80">
                &ldquo;{phrase}&rdquo;
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
