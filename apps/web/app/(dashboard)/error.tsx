"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Catches any error thrown while rendering inside the authenticated shell
 * that a WidgetErrorBoundary didn't already contain (e.g. a Server
 * Component data-fetch throwing before it reaches a widget boundary).
 * The Sidebar/Header chrome outside this segment stays mounted — this
 * only replaces the page content, not the whole app.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-10 text-center">
      <AlertOctagon className="h-8 w-8 text-destructive" />
      <div>
        <h2 className="text-base font-semibold text-foreground">
          This page failed to load
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred rendering this route."}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
