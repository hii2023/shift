"use client";
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { AppData, Staff, Shift, KitchenSettings, Break } from "@/types";
import { STAFF_COLORS, DEFAULT_KITCHEN_SETTINGS } from "./constants";

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
  | { type: "DELETE_BREAK"; payload: { shiftId: string; breakId: string } };

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
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppData; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultData);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shiftScheduler");
      if (saved) dispatch({ type: "LOAD", payload: JSON.parse(saved) });
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shiftScheduler", JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
