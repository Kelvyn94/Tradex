"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // router.refresh() doesn't expose a completion callback; a short
    // timeout is enough to give the spin a visible beat without lying
    // about a longer operation than what's actually happening.
    setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="w-fit gap-2">
      {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
      Refresh
    </Button>
  );
}
