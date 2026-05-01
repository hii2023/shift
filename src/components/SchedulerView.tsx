"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Shift, Break, KitchenSettings } from "@/types";
import { DAYS } from "@/lib/constants";
import { timeToMinutes, minutesToTime, formatTime, timesOverlap } from "@/lib/timeUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2, Coffee, X, Pencil, Copy, Clock } from "lucide-react";

const CELL_WIDTH = 80; // pixels per hour
const ROW_HEIGHT = 60;
const SNAP_MINUTES = 15;

type DragState = {
  type: "shift-move" | "shift-resize" | "break-move";
  shiftId: string;
  breakId?: string;
  startX: number;
  origStartMin: number;
  origEndMin: number;
} | null;

type DragPreview = {
  shiftId: string;
  breakId?: string;
  newStartMin: number;
  newEndMin: number;
} | null;

export default function SchedulerView() {
  const { state, dispatch } = useApp();
  const { shifts, staff, kitchenSettings } = state;

  const [selectedDay, setSelectedDay] = useState("Mon");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [now, setNow] = useState(() => new Date());

  const [shiftDialog, setShiftDialog] = useState<{ open: boolean; shift?: Shift }>({ open: false });
  const [breakDialog, setBreakDialog] = useState<{ open: boolean; shiftId?: string; brk?: Break }>({
    open: false,
  });
  const [shiftForm, setShiftForm] = useState({ staffId: "", startTime: "10:00", endTime: "14:00" });
  const [breakForm, setBreakForm] = useState({ startTime: "12:00", endTime: "13:00" });

  // Drag refs — kept as refs so global event handlers don't need to be recreated
  const dragRef = useRef<DragState>(null);
  const hasMoved = useRef(false);
  const [dragPreview, setDragPreview] = useState<DragPreview>(null);
  const dragPreviewRef = useRef<DragPreview>(null);

  // Stable value refs for use inside event handlers
  const openMinutesRef = useRef(0);
  const closeMinutesRef = useRef(0);
  const totalMinutesRef = useRef(0);
  const totalHoursRef = useRef(0);
  const shiftsRef = useRef(shifts);

  const daySettings = kitchenSettings[selectedDay] || { enabled: true, open: "10:00", close: "22:00" };
  const openMinutes = timeToMinutes(daySettings.open);
  const closeMinutes = timeToMinutes(daySettings.close);
  const totalMinutes = closeMinutes - openMinutes;
  const totalHours = Math.ceil(totalMinutes / 60);

  // Keep refs in sync with latest render values (must be inside effect, not render body)
  useEffect(() => {
    openMinutesRef.current = openMinutes;
    closeMinutesRef.current = closeMinutes;
    totalMinutesRef.current = totalMinutes;
    totalHoursRef.current = totalHours;
    shiftsRef.current = shifts;
  });

  // Update "now" every 30 s for kitchen countdown (initialized from state initializer)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Global mouse handlers — set up once, reads current values via refs
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const pixelsPerMin = (totalHoursRef.current * CELL_WIDTH) / totalMinutesRef.current;
      const deltaX = e.clientX - dragRef.current.startX;
      if (Math.abs(deltaX) > 5) hasMoved.current = true;
      const deltaMins = Math.round(deltaX / pixelsPerMin / SNAP_MINUTES) * SNAP_MINUTES;
      const { type, shiftId, breakId, origStartMin, origEndMin } = dragRef.current;
      let preview: DragPreview = null;

      if (type === "shift-move") {
        const duration = origEndMin - origStartMin;
        const newStart = Math.max(
          openMinutesRef.current,
          Math.min(closeMinutesRef.current - duration, origStartMin + deltaMins)
        );
        preview = { shiftId, newStartMin: newStart, newEndMin: newStart + duration };
      } else if (type === "shift-resize") {
        const shift = shiftsRef.current.find((s) => s.id === shiftId);
        const minEnd = shift
          ? Math.max(origStartMin + 30, ...shift.breaks.map((b) => timeToMinutes(b.endTime)))
          : origStartMin + 30;
        const newEnd = Math.max(minEnd, Math.min(closeMinutesRef.current, origEndMin + deltaMins));
        preview = { shiftId, newStartMin: origStartMin, newEndMin: newEnd };
      } else if (type === "break-move") {
        const shift = shiftsRef.current.find((s) => s.id === shiftId);
        if (!shift) return;
        const shiftStartMin = timeToMinutes(shift.startTime);
        const shiftEndMin = timeToMinutes(shift.endTime);
        const duration = origEndMin - origStartMin;
        const newStart = Math.max(shiftStartMin, Math.min(shiftEndMin - duration, origStartMin + deltaMins));
        preview = { shiftId, breakId, newStartMin: newStart, newEndMin: newStart + duration };
      }

      if (preview) {
        dragPreviewRef.current = preview;
        setDragPreview(preview);
      }
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const preview = dragPreviewRef.current;

      if (preview && hasMoved.current) {
        if (drag.type === "shift-move" || drag.type === "shift-resize") {
          const shift = shiftsRef.current.find((s) => s.id === drag.shiftId);
          if (shift) {
            dispatch({
              type: "UPDATE_SHIFT",
              payload: {
                ...shift,
                startTime: minutesToTime(preview.newStartMin),
                endTime: minutesToTime(preview.newEndMin),
              },
            });
          }
        } else if (drag.type === "break-move") {
          const shift = shiftsRef.current.find((s) => s.id === drag.shiftId);
          const brk = shift?.breaks.find((b) => b.id === drag.breakId);
          if (shift && brk) {
            dispatch({
              type: "UPDATE_BREAK",
              payload: {
                shiftId: shift.id,
                brk: {
                  ...brk,
                  startTime: minutesToTime(preview.newStartMin),
                  endTime: minutesToTime(preview.newEndMin),
                },
              },
            });
          }
        }
      }

      dragRef.current = null;
      dragPreviewRef.current = null;
      setDragPreview(null);
      setTimeout(() => { hasMoved.current = false; }, 0);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dispatch]);

  if (!daySettings.enabled) {
    return (
      <div className="space-y-4">
        <DayTabs selected={selectedDay} onSelect={setSelectedDay} settings={kitchenSettings} />
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            Kitchen is closed on {selectedDay}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hours: string[] = [];
  for (let m = openMinutes; m <= closeMinutes; m += 60) {
    hours.push(minutesToTime(m));
  }

  const dayShifts = shifts.filter((s) => s.day === selectedDay);
  const filteredStaff = roleFilter === "All" ? staff : staff.filter((s) => s.role === roleFilter);

  // --- Drag starter handlers ---
  const startShiftMove = (e: React.MouseEvent, shift: Shift) => {
    e.preventDefault();
    e.stopPropagation();
    hasMoved.current = false;
    dragRef.current = {
      type: "shift-move",
      shiftId: shift.id,
      startX: e.clientX,
      origStartMin: timeToMinutes(shift.startTime),
      origEndMin: timeToMinutes(shift.endTime),
    };
  };

  const startShiftResize = (e: React.MouseEvent, shift: Shift) => {
    e.preventDefault();
    e.stopPropagation();
    hasMoved.current = false;
    dragRef.current = {
      type: "shift-resize",
      shiftId: shift.id,
      startX: e.clientX,
      origStartMin: timeToMinutes(shift.startTime),
      origEndMin: timeToMinutes(shift.endTime),
    };
  };

  const startBreakMove = (e: React.MouseEvent, shift: Shift, brk: Break) => {
    e.preventDefault();
    e.stopPropagation();
    hasMoved.current = false;
    dragRef.current = {
      type: "break-move",
      shiftId: shift.id,
      breakId: brk.id,
      startX: e.clientX,
      origStartMin: timeToMinutes(brk.startTime),
      origEndMin: timeToMinutes(brk.endTime),
    };
  };

  // --- Effective position helpers (override stored times with drag preview) ---
  const getEffectiveShiftTimes = (shift: Shift) => {
    if (dragPreview && dragPreview.shiftId === shift.id && !dragPreview.breakId) {
      return { startMin: dragPreview.newStartMin, endMin: dragPreview.newEndMin };
    }
    return { startMin: timeToMinutes(shift.startTime), endMin: timeToMinutes(shift.endTime) };
  };

  const getEffectiveBreakTimes = (shift: Shift, brk: Break) => {
    if (dragPreview && dragPreview.shiftId === shift.id && dragPreview.breakId === brk.id) {
      return { brkStartMin: dragPreview.newStartMin, brkEndMin: dragPreview.newEndMin };
    }
    return { brkStartMin: timeToMinutes(brk.startTime), brkEndMin: timeToMinutes(brk.endTime) };
  };

  // --- Kitchen countdown ---
  const jsDayToIndex = (d: number) => (d === 0 ? 6 : d - 1);
  const todayName = DAYS[jsDayToIndex(now.getDay())];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let kitchenStatus: { label: string; color: string } | null = null;
  if (todayName === selectedDay) {
    if (nowMinutes < openMinutes) {
      const diff = openMinutes - nowMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      kitchenStatus = {
        label: `Opens in ${h > 0 ? `${h}h ` : ""}${m}m`,
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    } else if (nowMinutes < closeMinutes) {
      const diff = closeMinutes - nowMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      kitchenStatus = {
        label: `Open · closes in ${h > 0 ? `${h}h ` : ""}${m}m`,
        color: "text-green-700 bg-green-50 border-green-200",
      };
    } else {
      kitchenStatus = { label: "Closed for today", color: "text-gray-500 bg-gray-100 border-gray-200" };
    }
  }

  // --- Copy to all days ---
  const copyToAllDays = () => {
    const sourceDayShifts = shifts.filter((s) => s.day === selectedDay);
    if (sourceDayShifts.length === 0) {
      alert("No shifts on this day to copy.");
      return;
    }
    const targetDays = DAYS.filter((d) => d !== selectedDay && kitchenSettings[d]?.enabled);
    if (targetDays.length === 0) {
      alert("No other open days to copy to.");
      return;
    }
    if (
      !confirm(
        `Copy all shifts from ${selectedDay} to ${targetDays.join(", ")}?\nThis will replace any existing shifts on those days.`
      )
    )
      return;
    dispatch({ type: "COPY_DAY", payload: { targetDays, sourceShifts: sourceDayShifts } });
  };

  // Validation warnings
  const warningsSet = new Set<string>();
  for (let m = openMinutes; m < closeMinutes; m += 60) {
    const slotStart = minutesToTime(m);
    const slotEnd = minutesToTime(m + 60);
    const activeShifts = dayShifts.filter((sh) =>
      timesOverlap(sh.startTime, sh.endTime, slotStart, slotEnd)
    );
    if (activeShifts.length > 0) {
      const chefs = activeShifts.filter((sh) => {
        const st = staff.find((s) => s.id === sh.staffId);
        return st?.role === "Chef";
      });
      if (chefs.length === 0) {
        warningsSet.add(`No chef assigned during ${formatTime(slotStart)} – ${formatTime(slotEnd)}`);
      }
    }
  }

  for (let m = openMinutes; m < closeMinutes; m += 15) {
    const checkTime = minutesToTime(m);
    const checkTimeNext = minutesToTime(m + 15);
    const activeShifts = dayShifts.filter((sh) =>
      timesOverlap(sh.startTime, sh.endTime, checkTime, checkTimeNext)
    );
    if (activeShifts.length > 1) {
      const allOnBreak = activeShifts.every((sh) =>
        sh.breaks.some((b) => timesOverlap(b.startTime, b.endTime, checkTime, checkTimeNext))
      );
      if (allOnBreak) {
        warningsSet.add(`All staff on break at ${formatTime(checkTime)}`);
      }
    }
  }

  const warnings = Array.from(warningsSet);

  const staffCounts: number[] = hours.slice(0, -1).map((h, i) => {
    const slotStart = h;
    const slotEnd = hours[i + 1];
    return dayShifts.filter((sh) => timesOverlap(sh.startTime, sh.endTime, slotStart, slotEnd)).length;
  });

  const openAddShift = (staffId?: string, clickedStartTime?: string) => {
    if (staff.length === 0) return;
    const sid = staffId || staff[0].id;
    const startTime = clickedStartTime || daySettings.open;
    const endMins = Math.min(timeToMinutes(startTime) + 240, closeMinutes);
    setShiftForm({ staffId: sid, startTime, endTime: minutesToTime(endMins) });
    setShiftDialog({ open: true });
  };

  const openEditShift = (shift: Shift) => {
    setShiftForm({ staffId: shift.staffId, startTime: shift.startTime, endTime: shift.endTime });
    setShiftDialog({ open: true, shift });
  };

  const saveShift = () => {
    const { staffId, startTime, endTime } = shiftForm;
    if (!staffId || !startTime || !endTime) return;
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      alert("Start time must be before end time.");
      return;
    }
    const conflicting = dayShifts.filter(
      (s) =>
        s.staffId === staffId &&
        s.id !== shiftDialog.shift?.id &&
        timesOverlap(s.startTime, s.endTime, startTime, endTime)
    );
    if (conflicting.length > 0) {
      alert("This staff member already has a shift during this time.");
      return;
    }
    if (shiftDialog.shift) {
      dispatch({
        type: "UPDATE_SHIFT",
        payload: { ...shiftDialog.shift, staffId, startTime, endTime },
      });
    } else {
      dispatch({ type: "ADD_SHIFT", payload: { staffId, day: selectedDay, startTime, endTime } });
    }
    setShiftDialog({ open: false });
  };

  const deleteShift = (id: string) => {
    dispatch({ type: "DELETE_SHIFT", payload: id });
    setShiftDialog({ open: false });
  };

  const openAddBreak = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;
    const bStart = minutesToTime(timeToMinutes(shift.startTime) + 60);
    const bEnd = minutesToTime(timeToMinutes(shift.startTime) + 90);
    setBreakForm({ startTime: bStart, endTime: bEnd });
    setBreakDialog({ open: true, shiftId });
  };

  const openEditBreak = (shiftId: string, brk: Break) => {
    setBreakForm({ startTime: brk.startTime, endTime: brk.endTime });
    setBreakDialog({ open: true, shiftId, brk });
  };

  const saveBreak = () => {
    const { shiftId, brk } = breakDialog;
    if (!shiftId) return;
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;
    const { startTime, endTime } = breakForm;
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      alert("Break start must be before end.");
      return;
    }
    if (
      timeToMinutes(startTime) < timeToMinutes(shift.startTime) ||
      timeToMinutes(endTime) > timeToMinutes(shift.endTime)
    ) {
      alert("Break must be within the shift time.");
      return;
    }
    if (brk) {
      dispatch({ type: "UPDATE_BREAK", payload: { shiftId, brk: { ...brk, ...breakForm } } });
    } else {
      dispatch({ type: "ADD_BREAK", payload: { shiftId, brk: breakForm } });
    }
    setBreakDialog({ open: false });
  };

  const deleteBreak = (shiftId: string, breakId: string) =>
    dispatch({ type: "DELETE_BREAK", payload: { shiftId, breakId } });

  const currentEditShift = shiftDialog.shift
    ? shifts.find((s) => s.id === shiftDialog.shift!.id) || shiftDialog.shift
    : undefined;

  return (
    <div className="space-y-4">
      <DayTabs selected={selectedDay} onSelect={setSelectedDay} settings={kitchenSettings} />

      {warnings.length > 0 && (
        <Alert className="bg-amber-50 border-amber-300 text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(daySettings.open)} – {formatTime(daySettings.close)}
          </span>
          {kitchenStatus && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${kitchenStatus.color}`}>
              {kitchenStatus.label}
            </span>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Filter:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="All">All Roles</option>
              <option value="Chef">Chef</option>
              <option value="Support Staff">Support Staff</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToAllDays}
            disabled={staff.length === 0 || dayShifts.length === 0}
            className="gap-2"
            title="Copy this day's shifts to all other open days"
          >
            <Copy className="w-4 h-4" /> Copy to All Days
          </Button>
          <Button
            size="sm"
            onClick={() => openAddShift()}
            disabled={staff.length === 0}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Shift
          </Button>
        </div>
      </div>

      {staff.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            Add staff members first to start scheduling.
          </CardContent>
        </Card>
      )}

      {staff.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm select-none">
          <div
            className="flex border-b bg-gray-50 sticky top-0 z-10"
            style={{ minWidth: 160 + totalHours * CELL_WIDTH }}
          >
            <div className="w-40 shrink-0 border-r px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Staff
            </div>
            <div className="flex">
              {hours.slice(0, -1).map((h, i) => (
                <div
                  key={h}
                  className="border-r"
                  style={{ width: CELL_WIDTH }}
                >
                  <div className="text-xs text-gray-500 font-medium text-center py-1 border-b">
                    {formatTime(h)}
                  </div>
                  <div className="text-center py-0.5">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        staffCounts[i] > 0
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-300"
                      }`}
                    >
                      {staffCounts[i] > 0 ? `${staffCounts[i]} staff` : "—"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-r" style={{ width: 0 }}>
                <div className="text-xs text-gray-500 font-medium text-center py-1 border-b whitespace-nowrap px-1">
                  {formatTime(hours[hours.length - 1])}
                </div>
              </div>
            </div>
          </div>

          {filteredStaff.map((member) => {
            const memberShifts = dayShifts.filter((s) => s.staffId === member.id);
            return (
              <div
                key={member.id}
                className="flex border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                style={{ height: ROW_HEIGHT, minWidth: 160 + totalHours * CELL_WIDTH }}
              >
                <div className="w-40 shrink-0 border-r px-3 py-2 flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{member.name}</div>
                    <div className="text-xs text-gray-500 truncate">{member.role}</div>
                  </div>
                </div>

                <div
                  className="relative cursor-pointer"
                  style={{ width: totalHours * CELL_WIDTH }}
                  onClick={(e) => {
                    if (hasMoved.current) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const fraction = x / (totalHours * CELL_WIDTH);
                    const clickedMinutes = openMinutes + fraction * totalMinutes;
                    const roundedMinutes = Math.round(clickedMinutes / 30) * 30;
                    const clamped = Math.max(openMinutes, Math.min(closeMinutes - 60, roundedMinutes));
                    openAddShift(member.id, minutesToTime(clamped));
                  }}
                >
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: i * CELL_WIDTH }}
                    />
                  ))}

                  {memberShifts.map((shift) => {
                    const { startMin: effStart, endMin: effEnd } = getEffectiveShiftTimes(shift);
                    const left = ((effStart - openMinutes) / totalMinutes) * (totalHours * CELL_WIDTH);
                    const width = ((effEnd - effStart) / totalMinutes) * (totalHours * CELL_WIDTH);
                    const effDuration = effEnd - effStart;
                    const isThisBeingDragged =
                      dragPreview?.shiftId === shift.id && !dragPreview?.breakId;

                    return (
                      <div
                        key={shift.id}
                        className={`absolute top-2 bottom-2 rounded-lg overflow-hidden shadow-sm ${
                          isThisBeingDragged ? "opacity-90 shadow-lg" : ""
                        }`}
                        style={{ left, width, backgroundColor: member.color, cursor: "grab" }}
                        onMouseDown={(e) => startShiftMove(e, shift)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasMoved.current) openEditShift(shift);
                        }}
                        title={`${member.name}: ${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}\nDrag to move · Drag right edge to resize`}
                      >
                        {shift.breaks.map((brk) => {
                          const { brkStartMin, brkEndMin } = getEffectiveBreakTimes(shift, brk);
                          const bLeft = ((brkStartMin - effStart) / effDuration) * 100;
                          const bWidth = ((brkEndMin - brkStartMin) / effDuration) * 100;
                          return (
                            <div
                              key={brk.id}
                              className="absolute inset-y-0 bg-white/50 border-x border-dashed border-white/80 flex items-center justify-center z-10 cursor-grab"
                              style={{ left: `${bLeft}%`, width: `${bWidth}%` }}
                              onMouseDown={(e) => startBreakMove(e, shift, brk)}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!hasMoved.current) openEditBreak(shift.id, brk);
                              }}
                              title={`Break: ${formatTime(brk.startTime)} – ${formatTime(brk.endTime)}\nDrag to reposition`}
                            >
                              <Coffee className="w-3 h-3 text-gray-600 opacity-70 pointer-events-none" />
                            </div>
                          );
                        })}
                        <div className="absolute inset-0 px-2 flex items-center z-20 pointer-events-none">
                          <div className="text-white text-xs font-medium drop-shadow-sm truncate">
                            {formatTime(minutesToTime(effStart))} – {formatTime(minutesToTime(effEnd))}
                          </div>
                        </div>
                        {/* Resize handle */}
                        <div
                          className="absolute top-0 right-0 bottom-0 w-3 z-30 flex items-center justify-center cursor-ew-resize"
                          onMouseDown={(e) => startShiftResize(e, shift)}
                          onClick={(e) => e.stopPropagation()}
                          title="Drag to resize"
                        >
                          <div className="w-0.5 h-4 bg-white/70 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredStaff.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              No staff match the selected filter.
            </div>
          )}
        </div>
      )}

      {staff.length > 0 && dayShifts.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Drag shifts to move · Drag right edge ▐ to resize · Drag ☕ break to reposition
        </p>
      )}

      <Dialog open={shiftDialog.open} onOpenChange={(o) => !o && setShiftDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{shiftDialog.shift ? "Edit Shift" : "Add Shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Staff Member</Label>
              <Select
                value={shiftForm.staffId}
                onValueChange={(v) => setShiftForm({ ...shiftForm, staffId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name} ({s.role})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="border rounded px-3 py-2 w-full text-sm"
                  min={daySettings.open}
                  max={daySettings.close}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="border rounded px-3 py-2 w-full text-sm"
                  min={daySettings.open}
                  max={daySettings.close}
                />
              </div>
            </div>

            {currentEditShift && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Breaks</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShiftDialog({ open: false });
                      setTimeout(() => openAddBreak(currentEditShift.id), 100);
                    }}
                    className="gap-1 h-7 text-xs"
                  >
                    <Coffee className="w-3 h-3" /> Add Break
                  </Button>
                </div>
                {currentEditShift.breaks.length === 0 ? (
                  <p className="text-xs text-gray-400">No breaks defined.</p>
                ) : (
                  <div className="space-y-2">
                    {currentEditShift.breaks.map((brk) => (
                      <div
                        key={brk.id}
                        className="flex items-center gap-2 text-sm bg-gray-50 rounded px-3 py-2"
                      >
                        <Coffee className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>
                          {formatTime(brk.startTime)} – {formatTime(brk.endTime)}
                        </span>
                        <div className="ml-auto flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-xs"
                            onClick={() => {
                              setShiftDialog({ open: false });
                              setTimeout(() => openEditBreak(currentEditShift.id, brk), 100);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                            onClick={() => deleteBreak(currentEditShift.id, brk.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {shiftDialog.shift && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteShift(shiftDialog.shift!.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShiftDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={saveShift}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={breakDialog.open} onOpenChange={(o) => !o && setBreakDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{breakDialog.brk ? "Edit Break" : "Add Break"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Break Start</Label>
                <input
                  type="time"
                  value={breakForm.startTime}
                  onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                  className="border rounded px-3 py-2 w-full text-sm"
                />
              </div>
              <div>
                <Label>Break End</Label>
                <input
                  type="time"
                  value={breakForm.endTime}
                  onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                  className="border rounded px-3 py-2 w-full text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBreakDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={saveBreak}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayTabs({
  selected,
  onSelect,
  settings,
}: {
  selected: string;
  onSelect: (d: string) => void;
  settings: KitchenSettings;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map((day) => {
        const s = settings[day] || { enabled: true };
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === day
                ? "bg-indigo-600 text-white shadow-sm"
                : s.enabled
                ? "bg-white border text-gray-700 hover:bg-gray-50"
                : "bg-gray-100 text-gray-400 border"
            }`}
          >
            {day}
            {!s.enabled && <span className="ml-1 text-xs">(closed)</span>}
          </button>
        );
      })}
    </div>
  );
}
