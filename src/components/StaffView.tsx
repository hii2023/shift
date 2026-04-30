"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Staff, Role } from "@/types";
import { ROLES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, User } from "lucide-react";

type FormState = { name: string; role: Role; tags: string; color: string };
const defaultForm: FormState = { name: "", role: "Chef", tags: "", color: "#4f46e5" };

export default function StaffView() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role, tags: s.tags.join(", "), color: s.color });
    setOpen(true);
  };

  const save = () => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!form.name.trim()) return;
    if (editing) {
      dispatch({
        type: "UPDATE_STAFF",
        payload: { ...editing, name: form.name.trim(), role: form.role, tags, color: form.color },
      });
    } else {
      dispatch({ type: "ADD_STAFF", payload: { name: form.name.trim(), role: form.role, tags } });
    }
    setOpen(false);
  };

  const remove = (id: string) => dispatch({ type: "DELETE_STAFF", payload: id });

  const roleColor: Record<Role, string> = {
    Chef: "bg-orange-100 text-orange-700",
    "Support Staff": "bg-blue-100 text-blue-700",
    Other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Staff Members ({state.staff.length})</h2>
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {state.staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No staff added yet.</p>
            <p className="text-sm">Add staff members to start scheduling.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.staff.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: s.color }}
                >
                  {s.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[s.role]}`}>
                      {s.role}
                    </span>
                    {s.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(s.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Staff name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. Salad prep, Cutting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
