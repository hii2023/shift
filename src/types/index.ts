export type Role = "Chef" | "Support Staff" | "Other";

export type Staff = {
  id: string;
  name: string;
  role: Role;
  tags: string[];
  color: string;
};

export type Break = {
  id: string;
  startTime: string;
  endTime: string;
};

export type Shift = {
  id: string;
  staffId: string;
  day: string;
  startTime: string;
  endTime: string;
  breaks: Break[];
};

export type DayTiming = {
  enabled: boolean;
  open: string;
  close: string;
};

export type KitchenSettings = {
  [day: string]: DayTiming;
};

export type AppData = {
  kitchenSettings: KitchenSettings;
  staff: Staff[];
  shifts: Shift[];
};
