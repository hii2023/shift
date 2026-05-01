"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { DAYS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

export default function SettingsView() {
  const { state, dispatch, syncConfig, syncStatus, connectSync, disconnectSync } = useApp();
  const settings = state.kitchenSettings;

  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const update = (day: string, field: string, value: string | boolean) => {
    dispatch({
      type: "SET_KITCHEN_SETTINGS",
      payload: { ...settings, [day]: { ...settings[day], [field]: value } },
    });
  };

  const handleConnect = async () => {
    setConnectError("");
    setConnecting(true);
    const result = await connectSync(token.trim());
    setConnecting(false);
    if (result.ok) {
      setToken("");
    } else {
      setConnectError(result.error ?? "Connection failed.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Cloud Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Sync (Cross-Device)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncConfig ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {syncStatus === "saving" || syncStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : syncStatus === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {syncStatus === "saving"
                    ? "Saving to GitHub Gist…"
                    : syncStatus === "loading"
                    ? "Loading from GitHub Gist…"
                    : syncStatus === "error"
                    ? "Sync error — check your token or network"
                    : "Connected · auto-saving to GitHub Gist"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Gist ID:{" "}
                <a
                  href={`https://gist.github.com/${syncConfig.gistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline hover:text-indigo-600 inline-flex items-center gap-0.5"
                >
                  {syncConfig.gistId}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-xs text-gray-500">
                To use this on another device, open the app, go to Settings → Cloud Sync, and enter the same
                GitHub token.
              </p>
              <Button variant="outline" size="sm" onClick={disconnectSync} className="text-red-600 hover:text-red-700">
                <CloudOff className="w-4 h-4 mr-2" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect a{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist&description=Kitchen+Scheduler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5"
                >
                  GitHub Personal Access Token
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                (with <code className="bg-gray-100 px-1 rounded text-xs">gist</code> scope) to
                automatically sync your schedule across devices.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  className="font-mono text-sm"
                />
                <Button onClick={handleConnect} disabled={connecting || !token.trim()} className="shrink-0">
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
                  Connect
                </Button>
              </div>
              {connectError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {connectError}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Your token is stored only in this browser and sent directly to GitHub. It is never shared with
                any third party.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Kitchen Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const t = settings[day] || { enabled: true, open: "10:00", close: "22:00" };
            return (
              <div key={day} className="p-3 rounded-lg border bg-white">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => update(day, "enabled", e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="font-semibold w-10">{day}</span>
                  </label>
                  {t.enabled ? (
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <div>
                        <Label htmlFor={`open-${day}`} className="text-xs text-gray-500 mb-1 block">Open</Label>
                        <input
                          id={`open-${day}`}
                          type="time"
                          value={t.open}
                          onChange={(e) => update(day, "open", e.target.value)}
                          className="border rounded px-2 py-1.5 text-sm w-full"
                        />
                      </div>
                      <span className="text-gray-400 mt-4">–</span>
                      <div>
                        <Label htmlFor={`close-${day}`} className="text-xs text-gray-500 mb-1 block">Close</Label>
                        <input
                          id={`close-${day}`}
                          type="time"
                          value={t.close}
                          onChange={(e) => update(day, "close", e.target.value)}
                          className="border rounded px-2 py-1.5 text-sm w-full"
                        />
                      </div>
                      <span className="text-sm text-gray-500 mt-4">
                        ({calcHours(t.open, t.close)}h)
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function calcHours(open: string, close: string): string {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const diff = ch * 60 + cm - (oh * 60 + om);
  return (diff / 60).toFixed(1);
}

