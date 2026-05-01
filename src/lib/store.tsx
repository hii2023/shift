"use client";
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from "react";
import { AppData, Staff, Shift, KitchenSettings, Break } from "@/types";
import { STAFF_COLORS, DEFAULT_KITCHEN_SETTINGS } from "./constants";
import {
  SyncConfig,
  SyncStatus,
  loadSyncConfig,
  saveSyncConfig,
  clearSyncConfig,
  loadFromGist,
  saveToGist,
  createGist,
  findKitchenGist,
} from "./gistSync";

const defaultData: AppData = {
  kitchenSettings: DEFAULT_KITCHEN_SETTINGS as KitchenSettings,
  staff: [],
  shifts: [],
};

type Action =
  | { type: "LOAD"; payload: AppData }
  | { type: "SET_KITCHEN_SETTINGS"; payload: KitchenSettings }
  | { type: "ADD_STAFF"; payload: Omit<Staff, "id" | "color"> }
  | { type: "UPDATE_STAFF"; payload: Staff }
  | { type: "DELETE_STAFF"; payload: string }
  | { type: "ADD_SHIFT"; payload: Omit<Shift, "id" | "breaks"> }
  | { type: "UPDATE_SHIFT"; payload: Shift }
  | { type: "DELETE_SHIFT"; payload: string }
  | { type: "ADD_BREAK"; payload: { shiftId: string; brk: Omit<Break, "id"> } }
  | { type: "UPDATE_BREAK"; payload: { shiftId: string; brk: Break } }
  | { type: "DELETE_BREAK"; payload: { shiftId: string; breakId: string } }
  | { type: "COPY_DAY"; payload: { targetDays: string[]; sourceShifts: Shift[] } };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "LOAD":
      return action.payload;
    case "SET_KITCHEN_SETTINGS":
      return { ...state, kitchenSettings: action.payload };
    case "ADD_STAFF": {
      const color = STAFF_COLORS[state.staff.length % STAFF_COLORS.length];
      return {
        ...state,
        staff: [...state.staff, { ...action.payload, id: crypto.randomUUID(), color }],
      };
    }
    case "UPDATE_STAFF":
      return { ...state, staff: state.staff.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    case "DELETE_STAFF":
      return {
        ...state,
        staff: state.staff.filter((s) => s.id !== action.payload),
        shifts: state.shifts.filter((sh) => sh.staffId !== action.payload),
      };
    case "ADD_SHIFT":
      return { ...state, shifts: [...state.shifts, { ...action.payload, id: crypto.randomUUID(), breaks: [] }] };
    case "UPDATE_SHIFT":
      return { ...state, shifts: state.shifts.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    case "DELETE_SHIFT":
      return { ...state, shifts: state.shifts.filter((s) => s.id !== action.payload) };
    case "ADD_BREAK": {
      const { shiftId, brk } = action.payload;
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === shiftId ? { ...s, breaks: [...s.breaks, { ...brk, id: crypto.randomUUID() }] } : s
        ),
      };
    }
    case "UPDATE_BREAK": {
      const { shiftId, brk } = action.payload;
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === shiftId ? { ...s, breaks: s.breaks.map((b) => (b.id === brk.id ? brk : b)) } : s
        ),
      };
    }
    case "DELETE_BREAK": {
      const { shiftId, breakId } = action.payload;
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === shiftId ? { ...s, breaks: s.breaks.filter((b) => b.id !== breakId) } : s
        ),
      };
    }
    case "COPY_DAY": {
      const { targetDays, sourceShifts } = action.payload;
      const remaining = state.shifts.filter((s) => !targetDays.includes(s.day));
      const copies = targetDays.flatMap((day) =>
        sourceShifts.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          day,
          breaks: s.breaks.map((b) => ({ ...b, id: crypto.randomUUID() })),
        }))
      );
      return { ...state, shifts: [...remaining, ...copies] };
    }
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppData;
  dispatch: React.Dispatch<Action>;
  syncStatus: SyncStatus;
  syncConfig: SyncConfig | null;
  connectSync: (token: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectSync: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const DEBOUNCE_MS = 2000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultData);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncConfig, setSyncConfigState] = useState<SyncConfig | null>(null);

  // Keep a ref to the latest state so the debounced save can use it
  const stateRef = useRef(state);
  const syncConfigRef = useRef(syncConfig);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    syncConfigRef.current = syncConfig;
  }, [syncConfig]);

  // Load data on mount
  useEffect(() => {
    async function init() {
      const cfg = loadSyncConfig();
      if (cfg?.token) {
        setSyncStatus("loading");
        let gistId = cfg.gistId;
        if (!gistId) {
          gistId = await findKitchenGist(cfg.token);
          if (gistId) {
            const updated = { ...cfg, gistId };
            saveSyncConfig(updated);
            setSyncConfigState(updated);
          } else {
            setSyncConfigState(cfg);
          }
        } else {
          setSyncConfigState(cfg);
        }

        if (gistId) {
          const data = await loadFromGist(cfg.token, gistId);
          if (data) {
            dispatch({ type: "LOAD", payload: data as AppData });
            setSyncStatus("saved");
            initializedRef.current = true;
            return;
          }
        }
        setSyncStatus("idle");
      }

      // Fallback to localStorage
      try {
        const saved = localStorage.getItem("shiftScheduler");
        if (saved) dispatch({ type: "LOAD", payload: JSON.parse(saved) });
      } catch {
        // ignore parse errors
      }
      initializedRef.current = true;
    }
    // Run once on mount only
    init();
  }, []);

  // Save to localStorage + debounced Gist save on every state change
  useEffect(() => {
    if (!initializedRef.current) return;
    localStorage.setItem("shiftScheduler", JSON.stringify(state));

    const cfg = syncConfigRef.current;
    if (!cfg?.token || !cfg?.gistId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      const ok = await saveToGist(cfg.token, cfg.gistId!, stateRef.current);
      setSyncStatus(ok ? "saved" : "error");
    }, DEBOUNCE_MS);
  }, [state]);

  const connectSync = useCallback(async (token: string): Promise<{ ok: boolean; error?: string }> => {
    if (!token.trim()) return { ok: false, error: "Token is required." };
    setSyncStatus("loading");

    // Verify token by hitting /user
    const testRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
    });
    if (!testRes.ok) {
      setSyncStatus("error");
      return { ok: false, error: "Invalid token. Make sure it has the 'gist' scope." };
    }

    // Look for an existing Gist first
    let gistId = await findKitchenGist(token);
    if (gistId) {
      // Load existing data from the found Gist
      const data = await loadFromGist(token, gistId);
      if (data) dispatch({ type: "LOAD", payload: data as AppData });
    } else {
      // Create a new Gist with current data
      gistId = await createGist(token, stateRef.current);
      if (!gistId) {
        setSyncStatus("error");
        return { ok: false, error: "Failed to create Gist. Check your token permissions." };
      }
    }

    const cfg: SyncConfig = { token, gistId };
    saveSyncConfig(cfg);
    setSyncConfigState(cfg);
    setSyncStatus("saved");
    return { ok: true };
  }, []);

  const disconnectSync = useCallback(() => {
    clearSyncConfig();
    setSyncConfigState(null);
    setSyncStatus("idle");
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, syncStatus, syncConfig, connectSync, disconnectSync }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
