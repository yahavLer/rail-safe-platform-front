// src/pages/ControlsLibraryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Shield, Plus, Download, Trash2, Pencil, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getCurrentOrgId } from "@/api/config";
import { taskService } from "@/api/services/taskService";
import { riskService } from "@/api/services/riskService";

import type { RiskBoundary, TaskBoundary, TaskStatus } from "@/api/types";

type MitigationRow = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeUserId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  riskId: string;
  riskTitle?: string;
  riskClassification?: string;
  riskCategoryCode?: string;
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "לביצוע",
  IN_PROGRESS: "בתהליך",
  DONE: "בוצע",
  CANCELED: "בוטל",
};

function classificationLabel(c?: string) {
  switch (c) {
    case "EXTREME_RED":
      return "קריטי";
    case "HIGH_ORANGE":
      return "גבוה";
    case "MEDIUM_YELLOW":
      return "בינוני";
    case "LOW_GREEN":
      return "נמוך";
    default:
      return c ?? "—";
  }
}

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

function toInstantIsoFromDateInput(value: string) {
  if (!value) return undefined;
  // yyyy-mm-dd -> תחילת יום
  return new Date(`${value}T00:00:00`).toISOString();
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = String(v ?? "");
    const needsQuotes = /[,"\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ControlsLibraryPage() {
  const orgId = getCurrentOrgId();

  const [rows, setRows] = useState<MitigationRow[]>([]);
  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MitigationRow | null>(null);

  const [form, setForm] = useState({
    riskId: "",
    title: "",
    description: "",
    assigneeUserId: "",
    dueDate: "", // yyyy-mm-dd
    status: "TODO" as TaskStatus,
  });

  // אם orgId משתנה — ננקה ונמשוך מחדש
  useEffect(() => {
    setRows([]);
    setRisks([]);
    setErr(null);
  }, [orgId]);

  async function load() {
    if (!orgId) {
      setErr("אין OrgId מחובר. התחברי כדי לראות מיטיגציות ארגוניות.");
      setRows([]);
      setRisks([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const [tasks, riskList] = await Promise.all([
        taskService.list({ organizationId: orgId }),
        riskService.list({ orgId }),
      ]);

      const riskMap = new Map<string, RiskBoundary>();
      riskList.forEach((r) => riskMap.set(r.id, r));

      const mapped: MitigationRow[] = (tasks as TaskBoundary[]).map((t) => {
        const r = riskMap.get(t.riskId);
        return {
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          assigneeUserId: t.assigneeUserId ?? undefined,
          dueDate: t.dueDate ?? undefined,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,

          riskId: t.riskId,
          riskTitle: r?.title,
          riskClassification: r?.classification,
          riskCategoryCode: r?.categoryCode,
        };
      });

      mapped.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

      setRisks(riskList);
      setRows(mapped);
    } catch (e) {
      console.error(e);
      setErr("נכשלה טעינת מיטיגציות. בדקי ש-Task Service + Risk Service רצים ו-orgId תקין.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      return (
        (r.title ?? "").toLowerCase().includes(s) ||
        (r.description ?? "").toLowerCase().includes(s) ||
        (r.riskTitle ?? "").toLowerCase().includes(s) ||
        (r.riskCategoryCode ?? "").toLowerCase().includes(s) ||
        (r.status ?? "").toLowerCase().includes(s)
      );
    });
  }, [rows, q]);

  function startCreate() {
    if (!orgId) return;

    const firstRiskId = risks[0]?.id ?? "";
    setEditing(null);
    setForm({
      riskId: firstRiskId,
      title: "",
      description: "",
      assigneeUserId: "",
      dueDate: "",
      status: "TODO",
    });
    setOpen(true);
  }

  function startEdit(row: MitigationRow) {
    setEditing(row);
    setForm({
      riskId: row.riskId,
      title: row.title ?? "",
      description: row.description ?? "",
      assigneeUserId: row.assigneeUserId ?? "",
      dueDate: toDateInputValue(row.dueDate),
      status: row.status,
    });
    setOpen(true);
  }

  async function save() {
    if (!orgId) return;

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) return;

    try {
      if (!editing) {
        if (!form.riskId) {
          toast.error("חובה לבחור סיכון לשיוך המיטיגציה");
          return;
        }

        const created = await taskService.create({
          organizationId: orgId,
          riskId: form.riskId,
          title,
          description,
          assigneeUserId: form.assigneeUserId.trim() || undefined,
          dueDate: toInstantIsoFromDateInput(form.dueDate),
        });

        toast.success("מיטיגציה נוצרה");
        setOpen(false);

        // רענון מהיר (כדי להביא גם riskTitle + מיון נכון)
        await load();
        return;
      }

      // edit
      const taskId = editing.id;

      const ops: Promise<any>[] = [];

      // עדכון שדות כלליים
      ops.push(
        taskService.update(taskId, {
          title,
          description,
          dueDate: toInstantIsoFromDateInput(form.dueDate),
        } as any)
      );

      // סטטוס
      if (form.status !== editing.status) {
        ops.push(taskService.updateStatus(taskId, { status: form.status }));
      }

      // אחראי (רק אם הוזן)
      const newAssignee = form.assigneeUserId.trim();
      if (newAssignee && newAssignee !== (editing.assigneeUserId ?? "")) {
        ops.push(taskService.updateAssignee(taskId, newAssignee));
      }

      await Promise.all(ops);

      toast.success("מיטיגציה עודכנה");
      setOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("שמירה נכשלה", { description: "בדקי שהבקאנד תומך בשדות שנשלחו." });
    }
  }

  async function remove(taskId: string) {
    try {
      await taskService.delete(taskId);
      toast.success("נמחק");
      setRows((prev) => prev.filter((x) => x.id !== taskId));
    } catch (e) {
      console.error(e);
      toast.error("מחיקה נכשלה");
    }
  }

  function exportCsv() {
    if (!filtered.length) return;

    const rowsForCsv = filtered.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      riskId: t.riskId,
      riskTitle: t.riskTitle ?? "",
      riskClassification: t.riskClassification ?? "",
      riskCategoryCode: t.riskCategoryCode ?? "",
      assigneeUserId: t.assigneeUserId ?? "",
      dueDate: t.dueDate ?? "",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    downloadCsv(`mitigations_${format(new Date(), "yyyyMMdd_HHmm")}.csv`, rowsForCsv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">ספריית מיטיגציות</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            רשימת כל המשימות (מיטיגציות) מכל הסיכונים בארגון
          </p>

          {loading && <p className="mt-2 text-sm text-muted-foreground">טוען…</p>}
          {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        </div>

        <div className="flex gap-2">
          <Button onClick={startCreate} disabled={!orgId || risks.length === 0}>
            <Plus className="ml-2 h-4 w-4" />
            מיטיגציה חדשה
          </Button>

          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="ml-2 h-4 w-4" />
            יצוא CSV
          </Button>

          <Button variant="outline" onClick={load} disabled={!orgId || loading}>
            <RefreshCw className="ml-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי כותרת/תיאור/סיכון/קטגוריה/סטטוס…"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-xl truncate">{t.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{TASK_STATUS_LABELS[t.status]}</Badge>
                  {t.riskClassification && (
                    <Badge variant="outline">סיווג סיכון: {classificationLabel(t.riskClassification)}</Badge>
                  )}
                  {t.riskCategoryCode && <Badge variant="secondary">{t.riskCategoryCode}</Badge>}
                  {t.riskTitle && <Badge variant="outline">סיכון: {t.riskTitle}</Badge>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => startEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-foreground/90">{t.description || "—"}</p>

              <div className="flex flex-wrap gap-3">
                <span>
                  אחראי: <span className="text-foreground">{t.assigneeUserId ?? "לא שויך"}</span>
                </span>
                <span>
                  יעד:{" "}
                  <span className="text-foreground">
                    {t.dueDate ? format(new Date(t.dueDate), "d MMM yyyy", { locale: he }) : "—"}
                  </span>
                </span>
                <span>
                  עודכן:{" "}
                  <span className="text-foreground">
                    {t.updatedAt ? format(new Date(t.updatedAt), "d MMM yyyy", { locale: he }) : "—"}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && !filtered.length && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              אין מיטיגציות להצגה.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת מיטיגציה" : "מיטיגציה חדשה"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            {!editing && (
              <div className="grid gap-1">
                <label className="text-sm text-muted-foreground">שיוך לסיכון *</label>
                <Select value={form.riskId} onValueChange={(v) => setForm((p) => ({ ...p, riskId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרי סיכון" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">כותרת *</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm text-muted-foreground">סטטוס</label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as TaskStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">לביצוע</SelectItem>
                    <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
                    <SelectItem value="DONE">בוצע</SelectItem>
                    <SelectItem value="CANCELED">בוטל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm text-muted-foreground">תאריך יעד</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">אחראי (UserId)</label>
              <Input
                value={form.assigneeUserId}
                onChange={(e) => setForm((p) => ({ ...p, assigneeUserId: e.target.value }))}
                placeholder="אופציונלי"
              />
              <div className="text-xs text-muted-foreground">
                הערה: כרגע עדכון אחראי מתבצע רק אם מזינים UserId (ולא “ניקוי”).
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={save} disabled={!form.title.trim() || (!editing && !form.riskId)}>
              שמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
