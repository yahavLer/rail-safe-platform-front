// src/pages/ControlsLibraryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Shield, Plus, Upload, Download, Trash2, Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_ORG_ID } from "@/api/config";

type ControlSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ControlTemplate = {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  recommendedSeverity: ControlSeverity;
  defaultDueDays: number;
  updatedAt: string;
  createdAt: string;
};

const severityLabel: Record<ControlSeverity, string> = {
  LOW: "נמוך",
  MEDIUM: "בינוני",
  HIGH: "גבוה",
  CRITICAL: "קריטי",
};

function storageKey(orgId: string) {
  return `railsafe.controls.v1.${orgId}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ControlsLibraryPage() {
  const orgId = DEFAULT_ORG_ID || (import.meta as any)?.env?.VITE_ORG_ID || "default";

  const [controls, setControls] = useState<ControlTemplate[]>([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ControlTemplate | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    recommendedSeverity: "MEDIUM" as ControlSeverity,
    defaultDueDays: 14,
  });

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) {
      // seed קטן כדי שלא יהיה “ריק”
      const now = new Date().toISOString();
      const seed: ControlTemplate[] = [
        {
          id: uid(),
          title: "תדרוך בטיחות לפני עבודה",
          description: "ביצוע תדרוך קצר לעובדים לפני ביצוע עבודה בסביבה מסוכנת.",
          category: "הדרכה",
          tags: ["הדרכה", "עובדים"],
          recommendedSeverity: "MEDIUM",
          defaultDueDays: 7,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uid(),
          title: "בדיקת ציוד תקופתית",
          description: "בדיקה תקופתית לציוד/מתקן בהתאם להנחיות ותקן.",
          category: "תחזוקה",
          tags: ["תחזוקה", "בדיקה"],
          recommendedSeverity: "HIGH",
          defaultDueDays: 30,
          createdAt: now,
          updatedAt: now,
        },
      ];
      localStorage.setItem(storageKey(orgId), JSON.stringify(seed));
      setControls(seed);
      return;
    }
    try {
      setControls(JSON.parse(raw));
    } catch {
      setControls([]);
    }
  }, [orgId]);

  useEffect(() => {
    localStorage.setItem(storageKey(orgId), JSON.stringify(controls));
  }, [controls, orgId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return controls;

    return controls.filter((c) => {
      const inTags = c.tags.some((t) => t.toLowerCase().includes(s));
      return (
        c.title.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        (c.category ?? "").toLowerCase().includes(s) ||
        inTags
      );
    });
  }, [controls, q]);

  function startCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      category: "",
      tags: "",
      recommendedSeverity: "MEDIUM",
      defaultDueDays: 14,
    });
    setOpen(true);
  }

  function startEdit(c: ControlTemplate) {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description,
      category: c.category ?? "",
      tags: c.tags.join(", "),
      recommendedSeverity: c.recommendedSeverity,
      defaultDueDays: c.defaultDueDays,
    });
    setOpen(true);
  }

  function save() {
    const now = new Date().toISOString();
    const tags = form.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!form.title.trim()) return;

    if (editing) {
      setControls((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category.trim() || undefined,
                tags,
                recommendedSeverity: form.recommendedSeverity,
                defaultDueDays: Number(form.defaultDueDays) || 0,
                updatedAt: now,
              }
            : c
        )
      );
    } else {
      const created: ControlTemplate = {
        id: uid(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        tags,
        recommendedSeverity: form.recommendedSeverity,
        defaultDueDays: Number(form.defaultDueDays) || 0,
        createdAt: now,
        updatedAt: now,
      };
      setControls((prev) => [created, ...prev]);
    }

    setOpen(false);
  }

  function remove(id: string) {
    setControls((prev) => prev.filter((c) => c.id !== id));
  }

  function exportLibrary() {
    downloadJson(`controls_library_${orgId}.json`, controls);
  }

  function importLibrary(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result ?? "[]"));
        if (!Array.isArray(data)) return;
        // merge by id (new overwrites)
        const map = new Map<string, ControlTemplate>();
        for (const c of controls) map.set(c.id, c);
        for (const c of data) {
          if (!c?.id || !c?.title) continue;
          map.set(c.id, c);
        }
        setControls(Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">ספריית בקרות</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            ספרייה פנימית של בקרות/מיטיגציות לשימוש חוזר (נשמר לפי ארגון)
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={startCreate}>
            <Plus className="ml-2 h-4 w-4" />
            בקרה חדשה
          </Button>

          <Button variant="outline" onClick={exportLibrary}>
            <Download className="ml-2 h-4 w-4" />
            יצוא JSON
          </Button>

          <label className="inline-flex items-center">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importLibrary(f);
                e.currentTarget.value = "";
              }}
            />
            <Button variant="outline" type="button">
              <Upload className="ml-2 h-4 w-4" />
              ייבוא JSON
            </Button>
          </label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי כותרת/תיאור/תגיות…" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <Card key={c.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">{c.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{severityLabel[c.recommendedSeverity]}</Badge>
                  {c.category && <Badge variant="secondary">{c.category}</Badge>}
                  {!!c.tags.length && c.tags.slice(0, 4).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{c.description}</p>
              <p>
                דיפולט יעד: <span className="text-foreground font-medium">{c.defaultDueDays}</span> ימים • עודכן:{" "}
                <span className="text-foreground">{format(new Date(c.updatedAt), "d MMM yyyy", { locale: he })}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת בקרה" : "בקרה חדשה"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">כותרת</label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">תיאור</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">קטגוריה</label>
              <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">תגיות (מופרדות בפסיק)</label>
              <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">רמת סיכון מומלצת</label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.recommendedSeverity}
                onChange={(e) => setForm((p) => ({ ...p, recommendedSeverity: e.target.value as any }))}
              >
                <option value="LOW">נמוך</option>
                <option value="MEDIUM">בינוני</option>
                <option value="HIGH">גבוה</option>
                <option value="CRITICAL">קריטי</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">דיפולט יעד (ימים)</label>
              <Input
                type="number"
                value={form.defaultDueDays}
                onChange={(e) => setForm((p) => ({ ...p, defaultDueDays: Number(e.target.value) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={save} disabled={!form.title.trim()}>
              שמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
