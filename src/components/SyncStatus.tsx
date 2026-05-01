"use client";
import { useApp } from "@/lib/store";
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SyncStatus() {
  const { syncStatus, syncConfig } = useApp();

  if (!syncConfig) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400" title="Cloud sync not configured">
        <CloudOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Local only</span>
      </div>
    );
  }

  if (syncStatus === "loading") {
    return (
      <div className="flex items-center gap-1 text-xs text-indigo-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Syncing…</span>
      </div>
    );
  }

  if (syncStatus === "saving") {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    );
  }

  if (syncStatus === "error") {
    return (
      <div className="flex items-center gap-1 text-xs text-red-500" title="Sync error — check Settings">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sync error</span>
      </div>
    );
  }

  if (syncStatus === "saved") {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600" title="Synced to GitHub Gist">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  }

  // idle + configured
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500" title="Cloud sync connected">
      <Cloud className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Connected</span>
    </div>
  );
}
