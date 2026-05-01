"use client";
import { useApp } from "@/lib/store";
import { DAYS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default function SettingsView() {
  const { state, dispatch } = useApp();
  const settings = state.kitchenSettings;

  const update = (day: string, field: string, value: string | boolean) => {
    dispatch({
      type: "SET_KITCHEN_SETTINGS",
      payload: { ...settings, [day]: { ...settings[day], [field]: value } },
    });
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Kitchen Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const t = settings[day] || { enabled: true, open: "10:00", close: "22:00" };
            return (
              <div key={day} className="flex items-center gap-4 p-3 rounded-lg border bg-white">
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
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Open</Label>
                      <input
                        type="time"
                        value={t.open}
                        onChange={(e) => update(day, "open", e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <span className="text-gray-400 mt-4">–</span>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Close</Label>
                      <input
                        type="time"
                        value={t.close}
                        onChange={(e) => update(day, "close", e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
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
