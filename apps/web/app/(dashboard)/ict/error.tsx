"use client";

import { useEffect } from "react";
import { SatelliteDish } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ICTError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[ict-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
      <SatelliteDish className="h-8 w-8 text-muted-foreground" />
      <div>
        <h2 className="text-base font-semibold text-foreground">ICT analysis feed offline</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Structure/order-block analysis depends on the external Data Engine,
          which isn&apos;t reachable right now. Everything else in TRADEX keeps
          working normally.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Retry connection
      </Button>
    </div>
  );
}
