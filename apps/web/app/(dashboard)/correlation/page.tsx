import type { Metadata } from "next";
import { Network } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeedOffline } from "@/components/data-engine/feed-offline";
import { fetchDataEngine } from "@/lib/data-engine";

export const metadata: Metadata = { title: "Correlation Matrix — TRADEX" };

interface CorrelationMatrix {
  assets: string[];
  matrix: number[][];
}

export default async function CorrelationPage() {
  const correlation = await fetchDataEngine<CorrelationMatrix>("/correlation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <Network className="h-5 w-5 text-primary" /> Correlation Matrix
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-asset correlation for SMT divergence confirmation
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          {!correlation || !correlation.assets?.length ? (
            <FeedOffline
              title="Correlation feed offline"
              description="The cross-asset correlation matrix depends on the external Data Engine."
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-muted-foreground" />
                    {correlation.assets.map((asset) => (
                      <th key={asset} className="p-2 text-center text-muted-foreground">
                        {asset}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlation.matrix.map((row, i) => (
                    <tr key={correlation.assets[i]}>
                      <td className="p-2 font-semibold text-foreground">{correlation.assets[i]}</td>
                      {row.map((value, j) => (
                        <td
                          key={j}
                          className="tabular-price p-2 text-center"
                          style={{
                            color:
                              value > 0.5
                                ? "hsl(var(--success))"
                                : value < -0.5
                                  ? "hsl(var(--destructive))"
                                  : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {value.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
