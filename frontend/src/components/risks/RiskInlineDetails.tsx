import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { riskService } from "@/api/services/riskService";
import { taskService } from "@/api/services/taskService";
import { userService } from "@/api/services/userService";

import type {
  RiskBoundary,
  RiskClassification,
  RiskStatus,
  TaskBoundary,
  TaskStatus,
  UserBoundary,
} from "@/api/types";

const NONE = "__none__";

const CLASSIFICATION_LABELS: Record<RiskClassification, string> = {
  EXTREME_RED: "קריטי - קיצוני",
  HIGH_ACTION_ORANGE: "גבוה - נדרש טיפול",
  TOLERABLE_YELLOW: "בינוני - נסבל",
  NEGLIGIBLE_GREEN: "נמוך - זניח",
};

const classificationBadgeStyles: Record<RiskClassification, string> = {
  EXTREME_RED: "bg-risk-critical-bg text-risk-critical border-risk-critical/20",
  HIGH_ACTION_ORANGE: "bg-risk-high-bg text-risk-high border-risk-high/20",
  TOLERABLE_YELLOW: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  NEGLIGIBLE_GREEN: "bg-risk-low-bg text-risk-low border-risk-low/20",
};

const STATUS_LABELS_HE: Record<RiskStatus, string> = {
  DRAFT: "טיוטה",
  OPEN: "פתוח",
  MITIGATION_PLANNED: "תכנון מיטיגציה",
  IN_PROGRESS: "בטיפול",
  CLOSED: "נסגר",
};

const statusBadgeStyles: Partial<Record<RiskStatus, string>> = {
  OPEN: "bg-status-new/10 text-status-new border-status-new/20",
  MITIGATION_PLANNED: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  IN_PROGRESS: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  CLOSED: "bg-status-closed/10 text-status-closed border-status-closed/20",
  DRAFT: "bg-muted/30 text-muted-foreground border-muted/40",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "לביצוע",
  IN_PROGRESS: "בתהליך",
  DONE: "בוצע",
  CANCELED: "בוטל",
};

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toInstantIso(value: string) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`).toISOString();
  return new Date(value).toISOString();
}

function isoToDateInput(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function RiskInlineDetails({
  orgId,
  riskId,
  categoryName,
  onClose,
  onRiskUpdated,
}: {
  orgId: string;
  riskId: string;
  categoryName?: string;
  onClose: () => void;
  onRiskUpdated?: (updated: RiskBoundary) => void;
}) {
    const [risk, setRisk] = useState<RiskBoundary | null>(null);
    const [tasks, setTasks] = useState<TaskBoundary[]>([]);
    const [users, setUsers] = useState<UserBoundary[]>([]);

    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [editAssigneeOpen, setEditAssigneeOpen] = useState(false);
    // ---------- Create Task dialog ----------
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    dueDate: "",
    });

    // ---------- Edit Task dialog ----------
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    dueDate: "",
    });

    // ---------- Edit Risk dialog ----------
    const [editRiskOpen, setEditRiskOpen] = useState(false);
    const [statusEditOpen, setStatusEditOpen] = useState(false);

    const [riskEditForm, setRiskEditForm] = useState({
    title: "",
    description: "",
    location: "",
    severityLevel: 1,
    frequencyLevel: 1,
    riskManagerUserId: "",
    status: "OPEN" as RiskStatus,
    });
    const [riskManagerOpen, setRiskManagerOpen] = useState(false);
    const userLabelById = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u) => {
        const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        m[u.id] = full || u.email || u.id;
    });
    return m;
    }, [users]);

    const riskManagerName = useMemo(() => {
    if (!risk?.riskManagerUserId) return "—";
    return userLabelById[risk.riskManagerUserId] ?? risk.riskManagerUserId;
    }, [risk?.riskManagerUserId, userLabelById]);

    const doneCount = useMemo(() => tasks.filter((t) => t.status === "DONE").length, [tasks]);

    // ---------- Load users ----------
    useEffect(() => {
    let alive = true;
    (async () => {
        try {
        setUsersLoading(true);
        const list = await userService.list({ orgId });
        if (!alive) return;
        setUsers(list);
        } catch (e) {
        console.error("load users failed", e);
        } finally {
        if (alive) setUsersLoading(false);
        }
    })();
    return () => {
        alive = false;
    };
    }, [orgId]);

    // ---------- Load risk + tasks ----------
    useEffect(() => {
    let alive = true;

    (async () => {
        setLoading(true);
        setError(null);
        try {
        const [r, t] = await Promise.all([
            riskService.getById(riskId),
            taskService.list({ orgId, riskId }),
        ]);
        if (!alive) return;
        setRisk(r);
        setTasks(t);
        } catch (e) {
        const err = e as AxiosError<any>;
        console.error("load details failed", e);
        if (!alive) return;
        setError(`שגיאה בטעינת פירוט: ${err.response?.status ?? ""}`);
        } finally {
        if (alive) setLoading(false);
        }
    })();

    return () => {
        alive = false;
    };
    }, [orgId, riskId]);

    // ---------- Actions ----------
    async function createTask() {
    try {
        const created = await taskService.create({
        orgId,
        riskId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assigneeUserId: taskForm.assigneeUserId || undefined,
        dueDate: toInstantIso(taskForm.dueDate),
        });

        setTasks((prev) => [created, ...prev]);
        setCreateTaskOpen(false);
        setTaskForm({ title: "", description: "", assigneeUserId: "", dueDate: "" });
    } catch (e) {
        console.error("createTask failed", e);
    }
    }

    async function changeStatus(taskId: string, status: TaskStatus) {
    try {
        const updated = await taskService.updateStatus(taskId, { status });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
        console.error("changeStatus failed", e);
    }
    }

    async function saveTaskEdit() {
    if (!editingTaskId) return;

    try {
        const updated = await taskService.update(editingTaskId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        assigneeUserId: editForm.assigneeUserId || undefined,
        dueDate: toInstantIso(editForm.dueDate),
        });

        setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
        setEditTaskOpen(false);
        setEditingTaskId(null);
    } catch (e) {
        console.error("saveTaskEdit failed", e);
    }
    }

    function exportRisk() {
    if (!risk) return;
    downloadCsv(`risk-${risk.id}.csv`, [
        {
        id: risk.id,
        title: risk.title,
        category: categoryName ?? risk.categoryCode,
        categoryCode: risk.categoryCode,
        riskScore: risk.riskScore,
        classification: risk.classification,
        status: risk.status,
        location: risk.location ?? "",
        riskManager: riskManagerName,
        riskManagerUserId: risk.riskManagerUserId ?? "",
        frequencyLevel: risk.frequencyLevel,
        severityLevel: risk.severityLevel,
        description: risk.description ?? "",
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt,
        },
    ]);
    }

    function exportTasks() {
    if (!tasks.length) return;
    downloadCsv(
        `tasks-risk-${riskId}.csv`,
        tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignee: t.assigneeUserId ? (userLabelById[t.assigneeUserId] ?? t.assigneeUserId) : "לא שויך",
        assigneeUserId: t.assigneeUserId ?? "",
        dueDate: t.dueDate ?? "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        }))
    );
    }
    function openRiskEdit() {
        if (!risk) return;
        setRiskEditForm({
            title: risk.title ?? "",
            description: risk.description ?? "",
            location: risk.location ?? "",
            severityLevel: Number(risk.severityLevel ?? 1),
            frequencyLevel: Number(risk.frequencyLevel ?? 1),
            riskManagerUserId: risk.riskManagerUserId ?? "",
            status: risk.status,
        });
        setEditRiskOpen(true);
    }

    async function saveRiskEdit() {
        if (!risk) return;

        try {
            const updatedCore = await riskService.update(risk.id, {
            title: riskEditForm.title.trim(),
            description: riskEditForm.description.trim(),
            location: riskEditForm.location.trim() || undefined,
            severityLevel: Number(riskEditForm.severityLevel),
            frequencyLevel: Number(riskEditForm.frequencyLevel),
            riskManagerUserId: riskEditForm.riskManagerUserId || undefined,
            });

            let updated = updatedCore;

            // 2) עדכון סטטוס רק אם השתנה
            if (riskEditForm.status !== updatedCore.status) {
            updated = await riskService.updateStatus(risk.id, { status: riskEditForm.status });
            }

            setRisk(updated);
            onRiskUpdated?.(updated);
            setEditRiskOpen(false);
        } catch (e) {
            console.error("saveRiskEdit failed", e);
        }
    }
    async function updateRiskStatusInline(nextStatus: RiskStatus) {
    if (!risk) return;

    const prev = risk;

    // אופציונלי: עדכון אופטימי כדי שירגיש מיידי
    setRisk({ ...risk, status: nextStatus });

    try {
        const updated = await riskService.updateStatus(risk.id, { status: nextStatus });
        setRisk(updated);
        onRiskUpdated?.(updated);
    } catch (e) {
        console.error("updateRiskStatusInline failed", e);
        setRisk(prev); // rollback
    } finally {
        setStatusEditOpen(false);
    }
    }
  const after = useMemo(() => {
    const r: any = risk ?? {};
    return {
      severityAfter: r.severityAfter as number | undefined,
      frequencyAfter: r.frequencyAfter as number | undefined,
      scoreAfter: r.scoreAfter as number | undefined,
      classificationAfter: r.classificationAfter as RiskClassification | undefined,
    };
  }, [risk]);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">פירוט סיכון</div>
          <div className="text-xs text-muted-foreground">
            משימות שבוצעו: {doneCount}/{tasks.length}
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} aria-label="סגור">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">טוען נתונים…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !risk ? (
        <div className="text-sm text-muted-foreground">לא נמצא סיכון.</div>
      ) : (
        <div dir="rtl" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* שמאל: לאחר טיפול */}
          <div className="rounded-xl border p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">לאחר טיפול</div>
            </div>

            {after.classificationAfter ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", classificationBadgeStyles[after.classificationAfter])}
                  >
                    {CLASSIFICATION_LABELS[after.classificationAfter]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">עוצמה חדשה</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">חומרה חדשה</div>
                    <div className="text-lg font-semibold">{after.severityAfter ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">תדירות חדשה</div>
                    <div className="text-lg font-semibold">{after.frequencyAfter ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">ציון חדש</div>
                    <div className="text-lg font-semibold">{after.scoreAfter ?? "—"}</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  לפני טיפול: ציון {risk.riskScore} • חומרה {risk.severityLevel} • תדירות {risk.frequencyLevel}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                טרם עודכנו נתוני “לאחר טיפול”.
                <div className="text-xs mt-2">
                  (כשתחברי endpoint לעדכון After — כאן יוצג הצמצום)
                </div>
              </div>
            )}
          </div>

          {/* אמצע: מיטיגציות */}
          <div className="rounded-xl border p-4 bg-background">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold">מיטיגציות</div>
                <div className="text-xs text-muted-foreground">
                  מנהל סיכון: <span className="font-medium">{riskManagerName}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCreateTaskOpen(true)}>
                  הוסף מיטיגציה
                </Button>
                <Button variant="outline" onClick={exportTasks} disabled={!tasks.length}>
                  ייצוא
                </Button>
              </div>
            </div>

            <div className="rounded-xl border divide-y">
              {tasks.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">אין עדיין מיטיגציות לסיכון הזה.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        אחראי טיפול:{" "}
                        {t.assigneeUserId
                          ? userLabelById[t.assigneeUserId] ?? t.assigneeUserId
                          : "לא שויך"}
                        {t.dueDate ? ` • יעד: ${isoToDateInput(t.dueDate)}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        סטטוס: {TASK_STATUS_LABELS[t.status]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingTaskId(t.id);
                          setEditForm({
                            title: t.title,
                            description: t.description,
                            assigneeUserId: t.assigneeUserId ?? "",
                            dueDate: isoToDateInput(t.dueDate),
                          });
                          setEditTaskOpen(true);
                        }}
                        aria-label="עריכת מיטיגציה"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <div className="w-[150px]">
                        <Select value={t.status} onValueChange={(v) => changeStatus(t.id, v as TaskStatus)}>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ימין: פרטי סיכון + ייצוא */}
          <div className="rounded-xl border p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">פרטי סיכון</div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openRiskEdit}>
                <Pencil className="ml-2 h-4 w-4" />
                עריכה
                </Button>

                <Button variant="outline" size="sm" onClick={exportRisk}>
                ייצוא
                </Button>
            </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">שם סיכון</div>
                <div className="text-lg font-semibold">{risk.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">קטגוריה</div>
                  <div className="text-sm font-medium">{categoryName ?? risk.categoryCode}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">ציון</div>
                  <div className="text-lg font-semibold">{risk.riskScore}</div>
                </div>
              </div>

            <div className="flex flex-wrap gap-2 items-center">
            <Badge
                variant="outline"
                className={cn("text-xs", classificationBadgeStyles[risk.classification])}
            >
                {CLASSIFICATION_LABELS[risk.classification]}
            </Badge>

            {/* סטטוס: לחיצה -> Select */}
            {statusEditOpen ? (
            <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-[190px]">
                <Select
                    value={risk.status}
                    onValueChange={(v) => updateRiskStatusInline(v as RiskStatus)}
                >
                    <SelectTrigger className="h-8">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="DRAFT">טיוטה</SelectItem>
                    <SelectItem value="OPEN">פתוח</SelectItem>
                    <SelectItem value="MITIGATION_PLANNED">תכנון מיטיגציה</SelectItem>
                    <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                    <SelectItem value="CLOSED">נסגר</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setStatusEditOpen(false)}
                aria-label="סגור שינוי סטטוס"
                >
                <X className="h-4 w-4" />
                </Button>
            </div>
            ) : (
            <button
                type="button"
                onClick={() => setStatusEditOpen(true)}
                className="focus:outline-none"
                title="לחצי לשינוי סטטוס"
            >
                <Badge
                variant="outline"
                className={cn("text-xs cursor-pointer", statusBadgeStyles[risk.status] ?? "border-muted/40")}
                >
                {STATUS_LABELS_HE[risk.status]}
                </Badge>
            </button>
            )}
            </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">חומרה</div>
                  <div className="text-lg font-semibold">{risk.severityLevel}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">תדירות</div>
                  <div className="text-lg font-semibold">{risk.frequencyLevel}</div>
                </div>
              </div>

              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">מיקום</div>
                <div className="text-sm">{risk.location ?? "—"}</div>
              </div>

              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">מנהל סיכון</div>
                <div className="text-sm">{riskManagerName}</div>
              </div>

              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">תיאור</div>
                <div className="text-sm whitespace-pre-line">{risk.description ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* ---------------- Create task dialog ---------------- */}
          <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת מיטיגציה</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>כותרת</Label>
                  <Input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((s) => ({ ...s, title: e.target.value }))}
                    placeholder="לדוגמה: הצבת שילוט / הדרכת צוות"
                  />
                </div>

                <div className="space-y-1">
                  <Label>תיאור</Label>
                  <Textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((s) => ({ ...s, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-1">
                <Label>אחראי טיפול במיטיגציה</Label>

                <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={assigneeOpen}
                        className="w-full justify-between"
                        disabled={usersLoading}
                    >
                        {taskForm.assigneeUserId
                        ? (userLabelById[taskForm.assigneeUserId] ?? "בחרי אחראי")
                        : "לא שויך"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={usersLoading ? "טוען משתמשים…" : "התחילי להקליד שם…"} />
                        <CommandEmpty>לא נמצא עובד.</CommandEmpty>

                        <CommandGroup>
                        {/* לא שויך */}
                        <CommandItem
                            value="לא שויך"
                            onSelect={() => {
                            setTaskForm((s) => ({ ...s, assigneeUserId: "" }));
                            setAssigneeOpen(false);
                            }}
                        >
                            <Check className={cn("mr-2 h-4 w-4", !taskForm.assigneeUserId ? "opacity-100" : "opacity-0")} />
                            לא שויך
                        </CommandItem>

                        {/* עובדים */}
                        {users.map((u) => {
                            const label = userLabelById[u.id];
                            const selected = taskForm.assigneeUserId === u.id;

                            return (
                            <CommandItem
                                key={u.id}
                                value={label} // cmdk מסנן לפי value
                                onSelect={() => {
                                setTaskForm((s) => ({ ...s, assigneeUserId: u.id }));
                                setAssigneeOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                {label}
                            </CommandItem>
                            );
                        })}
                        </CommandGroup>
                    </Command>
                    </PopoverContent>
                </Popover>
                </div>

                <div className="space-y-1">
                  <Label>תאריך יעד</Label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((s) => ({ ...s, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={createTask} disabled={!taskForm.title.trim() || !taskForm.description.trim()}>
                  שמור
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ---------------- Edit task dialog ---------------- */}
          <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>עריכת מיטיגציה</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>כותרת</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <Label>תיאור</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-1">
                <Label>אחראי טיפול במיטיגציה</Label>

                <Popover open={editAssigneeOpen} onOpenChange={setEditAssigneeOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={editAssigneeOpen}
                        className="w-full justify-between"
                        disabled={usersLoading}
                    >
                        {editForm.assigneeUserId
                        ? (userLabelById[editForm.assigneeUserId] ?? "בחרי אחראי")
                        : "לא שויך"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={usersLoading ? "טוען משתמשים…" : "התחילי להקליד שם…"} />
                        <CommandEmpty>לא נמצא עובד.</CommandEmpty>

                        <CommandGroup>
                        <CommandItem
                            value="לא שויך"
                            onSelect={() => {
                            setEditForm((s) => ({ ...s, assigneeUserId: "" }));
                            setEditAssigneeOpen(false);
                            }}
                        >
                            <Check className={cn("mr-2 h-4 w-4", !editForm.assigneeUserId ? "opacity-100" : "opacity-0")} />
                            לא שויך
                        </CommandItem>

                        {users.map((u) => {
                            const label = userLabelById[u.id];
                            const selected = editForm.assigneeUserId === u.id;

                            return (
                            <CommandItem
                                key={u.id}
                                value={label}
                                onSelect={() => {
                                setEditForm((s) => ({ ...s, assigneeUserId: u.id }));
                                setEditAssigneeOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                {label}
                            </CommandItem>
                            );
                        })}
                        </CommandGroup>
                    </Command>
                    </PopoverContent>
                </Popover>
                </div>

                <div className="space-y-1">
                  <Label>תאריך יעד</Label>
                  <Input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm((s) => ({ ...s, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditTaskOpen(false);
                    setEditingTaskId(null);
                  }}
                >
                  ביטול
                </Button>
                <Button onClick={saveTaskEdit} disabled={!editForm.title.trim() || !editForm.description.trim()}>
                  שמור שינויים
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        {/* ---------------- Edit Risk dialog ---------------- */}
        <Dialog open={editRiskOpen} onOpenChange={setEditRiskOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>עריכת סיכון</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                <div className="space-y-1">
                    <Label>שם סיכון</Label>
                    <Input
                    value={riskEditForm.title}
                    onChange={(e) => setRiskEditForm((s) => ({ ...s, title: e.target.value }))}
                    />
                </div>

                <div className="space-y-1">
                    <Label>תיאור</Label>
                    <Textarea
                    value={riskEditForm.description}
                    onChange={(e) => setRiskEditForm((s) => ({ ...s, description: e.target.value }))}
                    rows={4}
                    />
                </div>

                <div className="space-y-1">
                    <Label>מיקום</Label>
                    <Input
                    value={riskEditForm.location}
                    onChange={(e) => setRiskEditForm((s) => ({ ...s, location: e.target.value }))}
                    />
                </div>
                <div className="space-y-1">
                <Label>סטטוס</Label>
                <Select
                    value={riskEditForm.status}
                    onValueChange={(v) => setRiskEditForm((s) => ({ ...s, status: v as RiskStatus }))}
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="DRAFT">טיוטה</SelectItem>
                    <SelectItem value="OPEN">פתוח</SelectItem>
                    <SelectItem value="MITIGATION_PLANNED">תכנון מיטיגציה</SelectItem>
                    <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                    <SelectItem value="CLOSED">נסגר</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                {/* מנהל סיכון עם חיפוש (Combobox) */}
                <div className="space-y-1">
                    <Label>מנהל סיכון</Label>

                    <Popover open={riskManagerOpen} onOpenChange={setRiskManagerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={riskManagerOpen}
                        className="w-full justify-between"
                        disabled={usersLoading}
                        >
                        {riskEditForm.riskManagerUserId
                            ? (userLabelById[riskEditForm.riskManagerUserId] ?? "בחרי מנהל סיכון")
                            : "לא שויך"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                        <CommandInput placeholder={usersLoading ? "טוען משתמשים…" : "התחילי להקליד שם…"} />
                        <CommandEmpty>לא נמצא עובד.</CommandEmpty>

                        <CommandGroup>
                            <CommandItem
                            value="לא שויך"
                            onSelect={() => {
                                setRiskEditForm((s) => ({ ...s, riskManagerUserId: "" }));
                                setRiskManagerOpen(false);
                            }}
                            >
                            <Check className={cn("mr-2 h-4 w-4", !riskEditForm.riskManagerUserId ? "opacity-100" : "opacity-0")} />
                            לא שויך
                            </CommandItem>

                            {users.map((u) => {
                            const label = userLabelById[u.id];
                            const selected = riskEditForm.riskManagerUserId === u.id;

                            return (
                                <CommandItem
                                key={u.id}
                                value={label}
                                onSelect={() => {
                                    setRiskEditForm((s) => ({ ...s, riskManagerUserId: u.id }));
                                    setRiskManagerOpen(false);
                                }}
                                >
                                <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                {label}
                                </CommandItem>
                            );
                            })}
                        </CommandGroup>
                        </Command>
                    </PopoverContent>
                    </Popover>
                </div>

                {/* חומרה + תדירות */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                    <Label>חומרה</Label>
                    <Select
                        value={String(riskEditForm.severityLevel)}
                        onValueChange={(v) => setRiskEditForm((s) => ({ ...s, severityLevel: Number(v) }))}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="space-y-1">
                    <Label>תדירות</Label>
                    <Select
                        value={String(riskEditForm.frequencyLevel)}
                        onValueChange={(v) => setRiskEditForm((s) => ({ ...s, frequencyLevel: Number(v) }))}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                </div>

                <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditRiskOpen(false)}>ביטול</Button>
                <Button
                    onClick={saveRiskEdit}
                    disabled={!riskEditForm.title.trim() || !riskEditForm.description.trim()}
                >
                    שמור
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>

        </div>
      )}
    </div>
  );
}