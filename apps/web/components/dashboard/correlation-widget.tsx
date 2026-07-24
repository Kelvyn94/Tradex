import Link from "next/link";
import { Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { fetchDataEngine } from "@/lib/data-engine";
import { cn } from "@/lib/utils";

interface StrongCorrelation {
  asset1: string;
  asset2: string;
  correlation: number;
  strength: string;
  type: "POSITIVE" | "NEGATIVE";
}

interface CorrelationData {
  assets: string[];
  matrix: number[][];
  strongCorrelations: StrongCorrelation[];
}

/**
 * Small dashboard summary of the strongest cross-asset correlations,
 * linking to the full matrix at /correlation (which this same backend
 * endpoint already backs). A dedicated full-table page already existed
 * for this data - this widget is deliberately a lightweight summary,
 * not a duplicate of that page.
 */
export async function CorrelationWidget() {
  const data = await fetchDataEngine<CorrelationData>("/correlation");

  if (!data || !data.strongCorrelations) {
    return (
      <FeedOffline
        title="Correlation feed offline"
        description="Cross-asset correlation data is currently unavailable."
      />
    );
  }

  const topPairs = data.strongCorrelations.slice(0, 4);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Strongest Correlations</h3>
          </div>
          <Link href="/correlation" className="text-xs text-primary hover:underline">
            Full matrix &rarr;
          </Link>
        </div>
        {topPairs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No strong correlations detected currently.</p>
        ) : (
          <ul className="space-y-2">
            {topPairs.map((p) => (
              <li
                key={`${p.asset1}-${p.asset2}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-foreground">
                  {p.asset1} / {p.asset2}
                </span>
                <span
                  className={cn(
                    "tabular-price font-semibold",
                    p.type === "POSITIVE" ? "text-success" : "text-destructive",
                  )}
                >
                  {p.correlation.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
