import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsClient } from "@/components/settings/settings-client";
import { WidgetErrorBoundary } from "@/components/boundaries/widget-error-boundary";
import { apiFetch, UnauthenticatedError } from "@/lib/api-client";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Settings — TRADEX" };

async function getUser(): Promise<User | null> {
  try {
    const response = await apiFetch("/auth/me");
    if (!response.ok) return null;
    return (await response.json()) as User;
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Unable to load your profile right now. Try refreshing the page.
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
            <SettingsIcon className="h-5 w-5 text-primary" /> Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your TRADEX experience and notification preferences
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          v2.0.0 • {new Date().toLocaleDateString()}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <UserIcon className="h-4 w-4" /> Profile
          </h3>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-background/50 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
              {initials}
            </div>
            <div>
              <div className="font-medium text-foreground">{user.username}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="mt-1 text-xs text-muted-foreground/70">
                Member since {memberSince}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <WidgetErrorBoundary label="Settings">
        <SettingsClient user={user} />
      </WidgetErrorBoundary>
    </div>
  );
}
