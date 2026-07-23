import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export const metadata: Metadata = {
  title: "Verify Email — TRADEX",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailStatus />
    </Suspense>
  );
}
