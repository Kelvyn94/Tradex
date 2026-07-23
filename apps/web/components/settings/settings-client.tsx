"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Activity,
  Bell,
  Clock,
  Copy,
  Download,
  Globe,
  RefreshCw,
  Shield,
  Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { clientApi, ApiError } from "@/lib/client-api";
import type { User } from "@/lib/types";

interface SettingsState {
  ntfyEnabled: boolean;
  webPushEnabled: boolean;
  signalsOnly: boolean;
  dailySummary: boolean;
  darkMode: boolean;
}

interface SettingsClientProps {
  user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = React.useState<SettingsState>({
    ntfyEnabled: true,
    webPushEnabled: false,
    signalsOnly: true,
    dailySummary: false,
    darkMode: true,
  });
  const [sendingTest, setSendingTest] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  function toggleSetting(key: keyof SettingsState) {
    // toast() triggers its own setState internally — calling it from inside
    // the setSettings updater (rather than as a separate statement) trips
    // React's "Cannot update a component while rendering a different
    // component" warning, since updater functions must stay pure.
    const nextValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: nextValue }));
    toast.success(`${key} ${nextValue ? "enabled" : "disabled"}`);
  }

  async function handleTestNotification() {
    setSendingTest(true);
    try {
      await clientApi("/ai/test-notification", { method: "POST" });
      toast.success("📱 Test notification sent! Check your phone.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to send test notification";
      toast.error(message);
    } finally {
      setSendingTest(false);
    }
  }

  async function handleLogoutAllDevices() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const topic = `tradex_${user.username.toLowerCase()}`;

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <Bell className="h-4 w-4" /> Notification Settings
          </h3>

          <div className="space-y-4">
            {/* ntfy.sh */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">ntfy.sh Push Notifications</h4>
                <Badge variant={settings.ntfyEnabled ? "success" : "destructive"}>
                  {settings.ntfyEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Get instant trading alerts on your phone. Works on iOS, Android, and Desktop.
                <br />
                <span className="text-xs text-muted-foreground/70">
                  📱 Download ntfy app:{" "}
                  <a
                    href="https://apps.apple.com/app/ntfy/id1625396347"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    iOS
                  </a>{" "}
                  •{" "}
                  <a
                    href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Android
                  </a>
                </span>
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  disabled={sendingTest}
                  className="gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5" /> {sendingTest ? "Sending..." : "Send Test"}
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSetting("ntfyEnabled")}
                  className={
                    settings.ntfyEnabled
                      ? "rounded px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                      : "rounded px-3 py-1 text-sm text-success hover:bg-success/10"
                  }
                >
                  {settings.ntfyEnabled ? "Disable" : "Enable"}
                </button>
              </div>
              {settings.ntfyEnabled && (
                <div className="mt-2 rounded border border-border bg-card p-2">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    📋 Your topic: <code className="text-primary">{topic}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(topic);
                        toast.success("Topic copied!");
                      }}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Web Push */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">Web Push Notifications</h4>
                <Badge variant={settings.webPushEnabled ? "success" : "secondary"}>
                  {settings.webPushEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Receive alerts directly in your browser. No app installation needed.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => toggleSetting("webPushEnabled")}
                  className={
                    settings.webPushEnabled
                      ? "rounded px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                      : "rounded px-3 py-1 text-sm text-success hover:bg-success/10"
                  }
                >
                  {settings.webPushEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <h4 className="mb-3 font-medium text-foreground">Alert Preferences</h4>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trade Signals Only</span>
                  <Switch
                    checked={settings.signalsOnly}
                    onCheckedChange={() => toggleSetting("signalsOnly")}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Performance Summary</span>
                  <Switch
                    checked={settings.dailySummary}
                    onCheckedChange={() => toggleSetting("dailySummary")}
                  />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <Activity className="h-4 w-4" /> Appearance
          </h3>
          <div className="rounded-lg border border-border bg-background/50 p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-muted-foreground">Dark Mode</span>
              <Switch checked={settings.darkMode} onCheckedChange={() => toggleSetting("darkMode")} />
            </label>
            <p className="mt-2 text-xs text-muted-foreground/70">
              TRADEX is currently dark-only by design — this toggle is a placeholder for a future light theme.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <Shield className="h-4 w-4" /> Security
          </h3>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4">
            <div>
              <div className="font-medium text-foreground">Session</div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Signed in as {user.username}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={loggingOut}
              className="text-sm text-destructive hover:underline disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout All Devices"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-primary">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="cursor-not-allowed rounded-lg border border-border bg-background/50 p-3 text-left opacity-50"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Download className="h-3.5 w-3.5" /> Export Data
              </div>
              <div className="text-xs text-muted-foreground">Coming soon</div>
            </button>
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={sendingTest}
              className="rounded-lg border border-border bg-background/50 p-3 text-left transition-colors hover:border-primary disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Bell className="h-3.5 w-3.5" /> Test Notification
              </div>
              <div className="text-xs text-muted-foreground">
                {sendingTest ? "Sending..." : "Send test alert"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-lg border border-border bg-background/50 p-3 text-left transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <RefreshCw className="h-3.5 w-3.5" /> Sync Data
              </div>
              <div className="text-xs text-muted-foreground">Refresh all data</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
