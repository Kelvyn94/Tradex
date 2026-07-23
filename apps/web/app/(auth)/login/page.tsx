import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login — TRADEX",
};

export default function LoginPage() {
  return (
    // useSearchParams (for the post-login "next" redirect target) requires
    // a Suspense boundary during static generation.
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
