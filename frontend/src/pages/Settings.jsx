// frontend/src/pages/Settings.jsx
import React, { useState } from "react";
import {
  Bell,
  Smartphone,
  Globe,
  Activity,
  User,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react";
import api from "../api/client";
import toast from "react-hot-toast";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    ntfyEnabled: true,
    webPushEnabled: false,
    signalsOnly: true,
    dailySummary: false,
    darkMode: true,
    emailNotifications: false,
  });

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const response = await api.post("/ai/test-notification");
      toast.success("📱 Test notification sent! Check your phone.");
      console.log("Notification response:", response.data);
    } catch (error) {
      console.error(
        "Notification error:",
        error.response?.data || error.message,
      );
      toast.error(
        error.response?.data?.message || "Failed to send test notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    const status = !settings[key] ? "enabled" : "disabled";
    toast.success(`${key} ${status}`);
  };

  // Get user info from localStorage
  const userData = JSON.parse(localStorage.getItem("tradex_user") || "{}");
  const username = userData.username || "Trader";
  const email = userData.email || "trader@example.com";
  const initials = username.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-accent" />
            Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure your TRADEX experience and notification preferences
          </p>
        </div>
        <div className="text-xs text-gray-500">
          v2.0.0 • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Profile Section */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </h3>
        <div className="flex items-center gap-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {initials}
          </div>
          <div>
            <div className="text-white font-medium">{username}</div>
            <div className="text-sm text-gray-400">{email}</div>
            <div className="text-xs text-gray-500 mt-1">
              Member since {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Settings
        </h3>

        <div className="space-y-4">
          {/* ntfy.sh - Primary */}
          <div className="flex items-start gap-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-accent" />
                <h4 className="text-white font-medium">
                  ntfy.sh Push Notifications
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    settings.ntfyEnabled
                      ? "bg-success/20 text-success"
                      : "bg-danger/20 text-danger"
                  }`}
                >
                  {settings.ntfyEnabled ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Get instant trading alerts on your phone. Works on iOS, Android,
                and Desktop.
                <br />
                <span className="text-xs text-gray-500">
                  📱 Download ntfy app:
                  <a
                    href="https://apps.apple.com/app/ntfy/id1625396347"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline ml-1"
                  >
                    iOS
                  </a>
                  {" • "}
                  <a
                    href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Android
                  </a>
                </span>
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="text-sm btn-outline flex items-center gap-1"
                >
                  <Bell className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Test"}
                </button>
                <button
                  onClick={() => toggleSetting("ntfyEnabled")}
                  className={`text-sm px-3 py-1 rounded ${
                    settings.ntfyEnabled
                      ? "text-danger hover:bg-danger/10"
                      : "text-success hover:bg-success/10"
                  }`}
                >
                  {settings.ntfyEnabled ? "Disable" : "Enable"}
                </button>
              </div>
              {settings.ntfyEnabled && (
                <div className="mt-2 p-2 bg-dark-800 rounded border border-dark-600">
                  <p className="text-xs text-gray-400">
                    📋 Your topic:{" "}
                    <code className="text-accent">
                      tradex_{username.toLowerCase()}
                    </code>
                    <button
                      className="ml-2 text-accent hover:text-accent/80"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `tradex_${username.toLowerCase()}`,
                        );
                        toast.success("Topic copied!");
                      }}
                    >
                      📋 Copy
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Web Push - Secondary */}
          <div className="flex items-start gap-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                <h4 className="text-white font-medium">
                  Web Push Notifications
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    settings.webPushEnabled
                      ? "bg-success/20 text-success"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {settings.webPushEnabled ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Receive alerts directly in your browser. No app installation
                needed.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => toggleSetting("webPushEnabled")}
                  className={`text-sm px-3 py-1 rounded ${
                    settings.webPushEnabled
                      ? "text-danger hover:bg-danger/10"
                      : "text-success hover:bg-success/10"
                  }`}
                >
                  {settings.webPushEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>

          {/* Alert Preferences */}
          <div className="p-4 bg-dark-900 rounded-lg border border-dark-700">
            <h4 className="text-white font-medium mb-3">Alert Preferences</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300">
                  Trade Signals Only
                </span>
                <button
                  onClick={() => toggleSetting("signalsOnly")}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    settings.signalsOnly ? "bg-accent" : "bg-dark-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.signalsOnly ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300">
                  Daily Performance Summary
                </span>
                <button
                  onClick={() => toggleSetting("dailySummary")}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    settings.dailySummary ? "bg-accent" : "bg-dark-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.dailySummary
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Appearance
        </h3>
        <div className="p-4 bg-dark-900 rounded-lg border border-dark-700">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-300">Dark Mode</span>
            <button
              onClick={() => toggleSetting("darkMode")}
              className={`w-10 h-5 rounded-full transition-colors ${
                settings.darkMode ? "bg-accent" : "bg-dark-600"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.darkMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security
        </h3>
        <div className="p-4 bg-dark-900 rounded-lg border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Session</div>
              <div className="text-sm text-gray-400">
                Last login: Today at {new Date().toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="text-danger hover:text-danger/80 text-sm"
            >
              Logout All Devices
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-sm font-cond text-accent tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              window.location.href = "/api/trades/export";
            }}
            className="p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-accent transition-colors text-left"
          >
            <div className="text-accent text-sm font-medium">
              📊 Export Data
            </div>
            <div className="text-xs text-gray-500">Download CSV</div>
          </button>
          <button
            onClick={handleTestNotification}
            disabled={loading}
            className="p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-accent transition-colors text-left disabled:opacity-50"
          >
            <div className="text-accent text-sm font-medium">
              📱 Test Notification
            </div>
            <div className="text-xs text-gray-500">
              {loading ? "Sending..." : "Send test alert"}
            </div>
          </button>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-accent transition-colors text-left"
          >
            <div className="text-accent text-sm font-medium">📈 Sync Data</div>
            <div className="text-xs text-gray-500">Refresh all data</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
