import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { apiFetch, UnauthenticatedError } from "@/lib/api-client";
import type { User } from "@/lib/types";

async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiFetch("/auth/me");
    if (!response.ok) return null;
    return (await response.json()) as User;
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      // Middleware already verifies the JWT signature/expiry client-side of
      // Express, so this only fires if Express itself rejects an otherwise
      // structurally valid token (e.g. the user row was deleted).
      redirect("/login");
    }
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
