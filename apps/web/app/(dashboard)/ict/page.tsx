import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { ICTAnalyzer } from "@/components/ict/ict-analyzer";

export const metadata: Metadata = { title: "ICT Analysis — TRADEX" };

export default function ICTPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <Brain className="h-5 w-5 text-primary" /> ICT Analysis
        </h1>
        <p className="text-sm text-muted-foreground">
          Market structure, order blocks, and fair value gaps per asset
        </p>
      </div>
      <ICTAnalyzer />
    </div>
  );
}
