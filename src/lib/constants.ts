export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = typeof DAYS[number];

export const ROLES = ["Chef", "Support Staff", "Other"] as const;

export const STAFF_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626", "#d97706",
  "#16a34a", "#0891b2", "#0284c7", "#9333ea", "#c026d3"
];

export const DEFAULT_KITCHEN_SETTINGS: Record<string, { enabled: boolean; open: string; close: string }> = Object.fromEntries(
  DAYS.map((d) => [d, { enabled: true, open: "10:00", close: "22:00" }])
);
