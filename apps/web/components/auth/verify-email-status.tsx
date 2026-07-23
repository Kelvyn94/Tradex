"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Status = "verifying" | "success" | "error";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = React.useState<Status>("verifying");
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok || !data.success) {
          setStatus("error");
          setMessage(data.error ?? "Verification failed");
          return;
        }
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Unable to reach the server. Check your connection and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Verifying your email</h2>
        <p className="mt-1 text-sm text-muted-foreground">This will just take a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Email verified</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email address has been confirmed.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <XCircle className="h-8 w-8 text-destructive" />
      <h2 className="mt-4 text-2xl font-bold text-foreground">Verification failed</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Link href="/login" className="mt-6 text-sm text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
