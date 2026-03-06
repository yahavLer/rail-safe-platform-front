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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getCurrentOrgId } from "@/api/config";
import { taskService } from "@/api/services/taskService";
import { riskService } from "@/api/services/riskService";
import { userService } from "@/api/services/userService";

import type {
  RiskBoundary,
  TaskBoundary,
  TaskStatus,
  UserBoundary,
  RiskStatus,
} from "@/api/types";

type ViewMode = "cards" | "table" | "list";

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

  // ✅ תוספות לטבלה/פילטרים
  riskLocation?: string;
  riskManagerUserId?: string;
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
    case "HIGH_ACTION_ORANGE":
      return "גבוה";
    case "TOLERABLE_YELLOW":
      return "בינוני";
    case "NEGLIGIBLE_GREEN":
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
  return new Date(`${value}T00:00:00`).toISOString();
}

function isWithinRange(iso?: string, from?: string, to?: string) {
  if (!from && !to) return true;
  if (!iso) return false;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;

  const fromD = from ? new Date(`${from}T00:00:00`) : null;
  const toD = to ? new Date(`${to}T23:59:59`) : null;

  if (fromD && d < fromD) return false;
  if (toD && d > toD) return false;
  return true;
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

  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const [rows, setRows] = useState<MitigationRow[]>([]);
  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [users, setUsers] = useState<UserBoundary[]>([]);

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

  // ✅ פילטרים כלליים (לכל מצבי התצוגה)
  const [assigneeQuery, setAssigneeQuery] = useState(""); // חיפוש לפי שם/מייל
  const [dueFrom, setDueFrom] = useState(""); // טווח תאריך יעד
  const [dueTo, setDueTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState(""); // טווח תאריכים "לטיפול" (updatedAt)
  const [updatedTo, setUpdatedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  // ✅ פילטרים “לפי עמודה” בטבלה
  const [colRisk, setColRisk] = useState("");
  const [colLocation, setColLocation] = useState("");
  const [colRiskManager, setColRiskManager] = useState("");
  const [colAssignee, setColAssignee] = useState("");
  const [colMitigation, setColMitigation] = useState("");

  // אם orgId משתנה — ננקה ונמשוך מחדש
  useEffect(() => {
    setRows([]);
    setRisks([]);
    setUsers([]);
    setErr(null);
  }, [orgId]);

  const userLabelById = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      m[u.id] = full || u.email || u.id;
    });
    return m;
  }, [users]);

  async function load() {
    if (!orgId) {
      setErr("אין OrgId מחובר. התחברי כדי לראות מיטיגציות ארגוניות.");
      setRows([]);
      setRisks([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const [tasks, riskList, userList] = await Promise.all([
        taskService.list({ orgId }),
        riskService.list({ orgId }),
        userService.list({ orgId }),
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
          riskClassification: (r as any)?.classification,
          riskCategoryCode: (r as any)?.categoryCode,

          riskLocation: (r as any)?.location,
          riskManagerUserId: (r as any)?.riskManagerUserId,
        };
      });

      mapped.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

      setRisks(riskList);
      setUsers(userList);
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
    const a = assigneeQuery.trim().toLowerCase();

    return rows.filter((r) => {
      // חיפוש כללי
      const okQ =
        !s ||
        (r.title ?? "").toLowerCase().includes(s) ||
        (r.description ?? "").toLowerCase().includes(s) ||
        (r.riskTitle ?? "").toLowerCase().includes(s) ||
        (r.riskCategoryCode ?? "").toLowerCase().includes(s) ||
        (r.status ?? "").toLowerCase().includes(s);

      if (!okQ) return false;

      // פילטר סטטוס
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      // פילטר אחראי לפי שם/מייל
      if (a) {
        const label = r.assigneeUserId ? (userLabelById[r.assigneeUserId] ?? r.assigneeUserId) : "";
        if (!label.toLowerCase().includes(a)) return false;
      }

      // טווח תאריך יעד
      if (!isWithinRange(r.dueDate, dueFrom, dueTo)) return false;

      // טווח "לטיפול" (updatedAt)
      if (!isWithinRange(r.updatedAt, updatedFrom, updatedTo)) return false;

      // פילטרים לפי עמודות (רלוונטי בעיקר לטבלה, אבל אפשר להשאיר גם לכל המצבים)
      const riskName = (r.riskTitle ?? "").toLowerCase();
      const loc = (r.riskLocation ?? "").toLowerCase();
      const rmName = r.riskManagerUserId ? (userLabelById[r.riskManagerUserId] ?? r.riskManagerUserId) : "";
      const rm = rmName.toLowerCase();
      const assName = r.assigneeUserId ? (userLabelById[r.assigneeUserId] ?? r.assigneeUserId) : "";
      const ass = assName.toLowerCase();
      const mit = (r.title ?? "").toLowerCase();

      if (colRisk.trim() && !riskName.includes(colRisk.trim().toLowerCase())) return false;
      if (colLocation.trim() && !loc.includes(colLocation.trim().toLowerCase())) return false;
      if (colRiskManager.trim() && !rm.includes(colRiskManager.trim().toLowerCase())) return false;
      if (colAssignee.trim() && !ass.includes(colAssignee.trim().toLowerCase())) return false;
      if (colMitigation.trim() && !mit.includes(colMitigation.trim().toLowerCase())) return false;

      return true;
    });
  }, [
    rows,
    q,
    assigneeQuery,
    dueFrom,
    dueTo,
    updatedFrom,
    updatedTo,
    statusFilter,
    colRisk,
    colLocation,
    colRiskManager,
    colAssignee,
    colMitigation,
    userLabelById,
  ]);

  // ✅ קיבוץ לטבלה: סיכון -> שורות מיטיגציות
  const groupedByRisk = useMemo(() => {
    const m = new Map<string, { riskId: string; riskTitle: string; riskLocation: string; riskManager: string; items: MitigationRow[] }>();

    filtered.forEach((t) => {
      const riskTitle = t.riskTitle ?? "—";
      const riskLocation = t.riskLocation ?? "—";
      const riskManager =
        t.riskManagerUserId
          ? (userLabelById[t.riskManagerUserId] ?? t.riskManagerUserId)
          : "—";

      if (!m.has(t.riskId)) {
        m.set(t.riskId, { riskId: t.riskId, riskTitle, riskLocation, riskManager, items: [] });
      }
      m.get(t.riskId)!.items.push(t);
    });

    const arr = Array.from(m.values());
    arr.forEach((g) => g.items.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")));
    arr.sort((a, b) => a.riskTitle.localeCompare(b.riskTitle));
    return arr;
  }, [filtered, userLabelById]);

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

        await taskService.create({
          orgId,
          riskId: form.riskId,
          title,
          description,
          assigneeUserId: form.assigneeUserId.trim() || undefined,
          dueDate: toInstantIsoFromDateInput(form.dueDate),
        });

        toast.success("מיטיגציה נוצרה");
        setOpen(false);
        await load();
        return;
      }

      const taskId = editing.id;
      const ops: Promise<any>[] = [];

      ops.push(
        taskService.update(taskId, {
          title,
          description,
          dueDate: toInstantIsoFromDateInput(form.dueDate),
        } as any)
      );

      if (form.status !== editing.status) {
        ops.push(taskService.updateStatus(taskId, { status: form.status }));
      }

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
      riskTitle: t.riskTitle ?? "",
      mitigationTitle: t.title,
      description: t.description ?? "",
      status: t.status,
      assignee: t.assigneeUserId ? (userLabelById[t.assigneeUserId] ?? t.assigneeUserId) : "",
      dueDate: t.dueDate ?? "",
      riskLocation: t.riskLocation ?? "",
      riskManager: t.riskManagerUserId ? (userLabelById[t.riskManagerUserId] ?? t.riskManagerUserId) : "",
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

      {/* ✅ תצוגות */}
      <Card>
        <CardHeader>
          <CardTitle>תצוגה</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={viewMode === "cards" ? "default" : "outline"} onClick={() => setViewMode("cards")}>
            כרטיסיות
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} onClick={() => setViewMode("table")}>
            טבלה
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            רשימה
          </Button>
        </CardContent>
      </Card>

      {/* ✅ פילטרים כלליים */}
      <Card>
        <CardHeader>
          <CardTitle>חיפוש וסינון</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי כותרת/תיאור/סיכון/קטגוריה/סטטוס…"
          />

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">חיפוש לפי אחראי (שם/מייל)</div>
              <Input value={assigneeQuery} onChange={(e) => setAssigneeQuery(e.target.value)} placeholder="לדוגמה: Yael / yael@" />
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">טווח תאריך יעד (Due Date)</div>
              <div className="flex gap-2">
                <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
                <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-muted-foreground">טווח תאריכים לטיפול (עודכן)</div>
              <div className="flex gap-2">
                <Input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)} />
                <Input type="date" value={updatedTo} onChange={(e) => setUpdatedTo(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid gap-1 lg:max-w-[260px]">
            <div className="text-sm text-muted-foreground">סטטוס</div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">הכל</SelectItem>
                <SelectItem value="TODO">לביצוע</SelectItem>
                <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
                <SelectItem value="DONE">בוצע</SelectItem>
                <SelectItem value="CANCELED">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ✅ TABLE VIEW (מקובץ לפי סיכון + פילטר בכל עמודה) */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>טבלת מיטיגציות (מקובץ לפי סיכון)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid gap-2 lg:grid-cols-5">
              <Input value={colRisk} onChange={(e) => setColRisk(e.target.value)} placeholder="סינון: סיכון" />
              <Input value={colMitigation} onChange={(e) => setColMitigation(e.target.value)} placeholder="סינון: מיטיגציה" />
              <Input value={colLocation} onChange={(e) => setColLocation(e.target.value)} placeholder="סינון: מיקום" />
              <Input value={colRiskManager} onChange={(e) => setColRiskManager(e.target.value)} placeholder="סינון: אחראי סיכון" />
              <Input value={colAssignee} onChange={(e) => setColAssignee(e.target.value)} placeholder="סינון: אחראי מיטיגציה" />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם הסיכון</TableHead>
                  <TableHead className="text-right">מיקום</TableHead>
                  <TableHead className="text-right">אחראי סיכון</TableHead>

                  <TableHead className="text-right">מיטיגציה</TableHead>
                  <TableHead className="text-center">סטטוס</TableHead>
                  <TableHead className="text-right">אחראי מיטיגציה</TableHead>
                  <TableHead className="text-right">תאריך יעד</TableHead>
                  <TableHead className="text-right">עודכן</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupedByRisk.map((g) => (
                  g.items.map((t, idx) => {
                    const assigneeName = t.assigneeUserId ? (userLabelById[t.assigneeUserId] ?? t.assigneeUserId) : "לא שויך";
                    const due = t.dueDate ? format(new Date(t.dueDate), "d MMM yyyy", { locale: he }) : "—";
                    const upd = t.updatedAt ? format(new Date(t.updatedAt), "d MMM yyyy", { locale: he }) : "—";

                    return (
                      <TableRow key={t.id}>
                        {idx === 0 && (
                          <>
                            <TableCell rowSpan={g.items.length} className="align-top font-medium">
                              <div className="space-y-1">
                                <div>{g.riskTitle}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t.riskClassification ? `סיווג: ${classificationLabel(t.riskClassification)}` : ""}
                                  {t.riskCategoryCode ? ` • ${t.riskCategoryCode}` : ""}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell rowSpan={g.items.length} className="align-top">
                              {g.riskLocation}
                            </TableCell>

                            <TableCell rowSpan={g.items.length} className="align-top">
                              {g.riskManager}
                            </TableCell>
                          </>
                        )}

                        <TableCell className="text-right">
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{t.description || "—"}</div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline">{TASK_STATUS_LABELS[t.status]}</Badge>
                        </TableCell>

                        <TableCell className="text-right">{assigneeName}</TableCell>
                        <TableCell className="text-right">{due}</TableCell>
                        <TableCell className="text-right">{upd}</TableCell>

                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ))}

                {!loading && groupedByRisk.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-right text-muted-foreground">
                      אין מיטיגציות להצגה.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ✅ CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((t) => {
            const assigneeName = t.assigneeUserId ? (userLabelById[t.assigneeUserId] ?? t.assigneeUserId) : "לא שויך";
            const riskManagerName = t.riskManagerUserId ? (userLabelById[t.riskManagerUserId] ?? t.riskManagerUserId) : "—";
            return (
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
                      אחראי: <span className="text-foreground">{assigneeName}</span>
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

                  <div className="flex flex-wrap gap-3">
                    <span>
                      מיקום סיכון: <span className="text-foreground">{t.riskLocation ?? "—"}</span>
                    </span>
                    <span>
                      אחראי סיכון: <span className="text-foreground">{riskManagerName}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!loading && !filtered.length && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                אין מיטיגציות להצגה.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ✅ SIMPLE LIST VIEW */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>רשימה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map((t) => {
              const assigneeName = t.assigneeUserId ? (userLabelById[t.assigneeUserId] ?? t.assigneeUserId) : "לא שויך";
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground">
                      {t.riskTitle ?? "—"} • {t.riskCategoryCode ?? ""}
                    </div>
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      אחראי: {assigneeName} • יעד: {t.dueDate ? format(new Date(t.dueDate), "d MMM yyyy", { locale: he }) : "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TASK_STATUS_LABELS[t.status]}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {!loading && !filtered.length && (
              <div className="text-sm text-muted-foreground">אין מיטיגציות להצגה.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Create/Edit */}
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
                כרגע זה UserId. אם תרצי — נהפוך את זה לבחירה עם חיפוש לפי שם (כמו שעשינו במיטיגציות בסיכון).
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