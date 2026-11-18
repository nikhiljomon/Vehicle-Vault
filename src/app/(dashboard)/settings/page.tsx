"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [reminderDays, setReminderDays] = useState("30,15,7,1,0");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Testing runner state
  const [testingJob, setTestingJob] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setReminderDays(data.reminderDays || "30,15,7,1,0");
          setEmailEnabled(data.emailEnabled ?? true);
          setInAppEnabled(data.inAppEnabled ?? true);
          setPushEnabled(data.pushEnabled ?? true);
        }
      })
      .catch((err) => console.error("Error loading settings:", err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderDays,
          emailEnabled,
          inAppEnabled,
          pushEnabled,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRunManualTest = async () => {
    setTestingJob(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error("Test trigger failed:", err);
    } finally {
      setTestingJob(false);
    }
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      alert("Push notifications enabled for VehicleVault!");
      setPushEnabled(true);
    } else {
      alert("Notification permission was denied.");
      setPushEnabled(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Vault & Notification Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize when and how you receive alerts before your documents expire
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Your settings have been saved successfully!
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Reminder Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Reminder Windows (Days Before Expiry)
              </h3>
              <p className="text-xs text-slate-500">
                Specify comma-separated days when reminders should trigger
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Alert Days Schedule
            </label>
            <input
              type="text"
              placeholder="e.g. 30, 15, 7, 1, 0"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-400">
              Default: <strong>30, 15, 7, 1, 0</strong> (Sends notifications at 30 days, 15 days, 1 week, 1 day prior, and on the expiry day).
            </p>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delivery Channels
              </h3>
              <p className="text-xs text-slate-500">
                Choose where you want to receive document alerts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Email Reminders
                  </h4>
                  <p className="text-xs text-slate-500">
                    Delivered to <strong>{session?.user?.email || "your email"}</strong>
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* In-App Notifications */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    In-App Notification Bell
                  </h4>
                  <p className="text-xs text-slate-500">
                    Show unread badge and dropdown alerts in the top bar
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Browser Push */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Browser / PWA Push Notifications
                  </h4>
                  <p className="text-xs text-slate-500">
                    Push alerts even when the browser or phone app is minimized
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestPushPermission}
                  className="px-2.5 py-1 text-[11px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium transition"
                >
                  Request Permission
                </button>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>

      {/* Manual Cron Testing Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Manual Reminder Job Testing
            </h3>
            <p className="text-xs text-slate-500">
              Trigger a test run of the reminder engine immediately to verify email/in-app alert delivery
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          In production, this check executes daily at 8:00 AM via <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600">node-cron</code> or via scheduled HTTP calls to <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600">/api/cron/reminders</code>. You can run it on-demand below:
        </p>

        <button
          type="button"
          onClick={handleRunManualTest}
          disabled={testingJob}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <Play className="w-4 h-4 text-emerald-400" />
          {testingJob ? "Evaluating Documents..." : "Execute Reminder Check Now"}
        </button>

        {testResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              Test Execution Summary:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400 mb-3">
              <div>Users scanned: <strong>{testResult.processedUsers}</strong></div>
              <div>Docs checked: <strong>{testResult.documentsChecked}</strong></div>
              <div>Emails sent: <strong>{testResult.emailsSent}</strong></div>
              <div>In-App created: <strong>{testResult.inAppCreated}</strong></div>
            </div>
            {testResult.details && testResult.details.length > 0 ? (
              <div className="space-y-1 text-[11px] text-blue-600 dark:text-blue-400">
                {testResult.details.map((d: any, idx: number) => (
                  <div key={idx}>
                    • {d.vehicleName}: {d.documentType} ({d.daysRemaining} days left) → [{d.channels.join(", ")}]
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400">No new alerts required for today&apos;s criteria (already notified or not in window).</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
