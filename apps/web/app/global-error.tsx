"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root-level safety net. Only fires if an error escapes RootLayout itself
 * (below this, app/(dashboard)/error.tsx and per-page error.tsx boundaries
 * catch failures without ever tearing down the whole app) — this is the
 * structural fix for the class of bug that used to produce a silent blank
 * page with zero on-screen indication.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-[#0a0e14] p-6 text-slate-200">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-white/10 bg-[#111722] p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">
              TRADEX encountered a critical error
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              The application failed to render. This has been logged. Try
              reloading — if it persists, the issue is upstream of this page.
            </p>
          </div>
          {error.digest && (
            <code className="rounded bg-black/40 px-2 py-1 text-xs text-slate-500">
              digest: {error.digest}
            </code>
          )}
          <Button onClick={reset} className="mt-2">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
