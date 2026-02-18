import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { riskService } from "@/api/services/riskService";
import { taskService } from "@/api/services/taskService";
import { getCurrentOrgId } from "@/api/config";
import type { RiskBoundary, TaskBoundary, TaskStatus } from "@/api/types";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function mapClassificationToUiSeverity(c?: string) {
  switch (c) {
    case "EXTREME_RED": return "CRITICAL";
    case "HIGH_ORANGE": return "HIGH";
    case "MEDIUM_YELLOW": return "MEDIUM";
    case "LOW_GREEN": return "LOW";
    default: return "MEDIUM";
  }
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RiskDrawer({
  open,
  onOpenChange,
  riskId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  riskId: string | null;
}) {
  const [risk, setRisk] = useState<RiskBoundary | null>(null);
  const [tasks, setTasks] = useState<TaskBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "לביצוע",
  IN_PROGRESS: "בתהליך",
  DONE: "בוצע",
  CANCELED: "בוטל",
  };

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    dueDate: "", // yyyy-mm-dd or datetime-local
  });

  function toInstantIso(value: string) {
    if (!value) return undefined;
    // אם זה רק תאריך (yyyy-mm-dd) -> נשגר כ-ISO בתחילת היום
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`).toISOString();
    }
    // אם זה datetime-local (yyyy-mm-ddThh:mm)
    return new Date(value).toISOString();
  }

  async function createTask() {
    const orgId = getCurrentOrgId();
    if (!riskId || !orgId) {
      setError("אין ארגון מחובר. התחברי מחדש.");
      return;
    }

    try {
      const created = await taskService.create({
        orgId: orgId, // ✅ ב-POST זה נשאר orgId
        riskId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assigneeUserId: taskForm.assigneeUserId.trim() || undefined,
        dueDate: toInstantIso(taskForm.dueDate),
      });


      setTasks(prev => [created, ...prev]);
      setCreateTaskOpen(false);
      setTaskForm({ title: "", description: "", assigneeUserId: "", dueDate: "" });
    } catch (e) {
      console.error("createTask failed", e);
    }
  }

  async function changeStatus(taskId: string, status: TaskStatus) {
    try {
      const updated = await taskService.updateStatus(taskId, { status });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error("changeStatus failed", e);
    }
  }
  useEffect(() => {
    const orgId = getCurrentOrgId();
    if (!open || !riskId || !orgId) return;

    (async () => {
      setLoading(true);
      setError(null);
      setRisk(null);
      setTasks([]);

      try {
        const r = await riskService.getById(riskId);
        setRisk(r);
      } catch (e) {
        const err = e as AxiosError<any>;
        setError(`שגיאה בטעינת סיכון: ${err.response?.status ?? ""}`);
        setLoading(false);
        return;
      }

      try {
        // ✅ ב-GET list הפרמטר נקרא orgId (Query param)
        const t = await taskService.list({ orgId, riskId });
        setTasks(t);
      } catch (e) {
        const err = e as AxiosError<any>;
        setError(`שגיאה בטעינת מיטיגציות: ${err.response?.status ?? ""}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, riskId]);



  const severity = useMemo(
    () => mapClassificationToUiSeverity(risk?.classification),
    [risk]
  );

  const doneCount = useMemo(
    () => tasks.filter(t => t.status === "DONE").length,
    [tasks]
  );

  async function markDone(taskId: string) {
    try {
      const updated = await taskService.updateStatus(taskId, { status: "DONE" });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error("markDone failed", e);
    }
  }

  function exportRisk() {
    if (!risk) return;
    downloadCsv(`risk-${risk.id}.csv`, [{
      id: risk.id,
      title: risk.title,
      description: risk.description ?? "",
      categoryCode: risk.categoryCode,
      frequencyLevel: risk.frequencyLevel,
      severityLevel: risk.severityLevel,
      riskScore: risk.riskScore,
      classification: risk.classification,
      status: risk.status,
      location: risk.location ?? "",
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
    }]);
  }

  function exportTasks() {
    if (!tasks.length) return;
    downloadCsv(`tasks-risk-${riskId}.csv`, tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assigneeUserId: t.assigneeUserId ?? "",
      dueDate: t.dueDate ?? "",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[760px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between gap-2">
            <span>פירוט סיכון</span>
            {loading && <span className="text-sm text-muted-foreground">טוען…</span>}
          </SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">טוען נתונים…</div>
        ) : error ? (
          <div className="mt-6 text-sm text-red-600">
            {error}
            <div className="text-xs text-muted-foreground mt-2">
              debug: riskId={riskId ?? "null"} orgId={getCurrentOrgId() || "null"}
            </div>
          </div>
        ) : !risk ? (
          <div className="mt-6 text-sm text-muted-foreground">
            לא נטען סיכון (בדקי שה־riskId מגיע).
            <div className="text-xs text-muted-foreground mt-2">
              debug: riskId={riskId ?? "null"} orgId={getCurrentOrgId() || "null"}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">{risk.title}</div>
                <div className="text-sm text-muted-foreground">
                  עוצמה: <span className="font-medium">{severity}</span> •
                  משימות שבוצעו: {doneCount}/{tasks.length}
                </div>
              </div>
              <Button variant="outline" onClick={exportRisk}>ייצוא סיכון</Button>
            </div>

            <Tabs defaultValue="risk">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="risk">פרטי סיכון</TabsTrigger>
                <TabsTrigger value="tasks">מיטיגציות</TabsTrigger>
                <TabsTrigger value="residual">לאחר טיפול</TabsTrigger>
              </TabsList>

              {/* 1) פרטי סיכון */}
              <TabsContent value="risk" className="mt-4 space-y-3">
                <div className="rounded-xl border p-4">
                  <div className="text-sm text-muted-foreground mb-1">תיאור</div>
                  <div className="text-sm">{risk.description ?? "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">תדירות</div>
                    <div className="text-lg font-semibold">{risk.frequencyLevel}</div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">חומרה</div>
                    <div className="text-lg font-semibold">{risk.severityLevel}</div>
                  </div>
                </div>
              </TabsContent>

              {/* 2) מיטיגציות */}
              <TabsContent value="tasks" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    (בהמשך נחבר שמות משתמשים במקום UUID)
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCreateTaskOpen(true)}>
                      הוסף משימה (מיטיגציה)
                    </Button>

                    <Button variant="outline" onClick={exportTasks} disabled={!tasks.length}>
                      ייצוא משימות (מיטיגציות)
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border divide-y">
                  {tasks.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">אין עדיין משימות לסיכון הזה.</div>
                  ) : (
                    tasks.map(t => (
                      <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            סטטוס: {TASK_STATUS_LABELS[t.status]} • אחראי: {t.assigneeUserId ?? "לא שויך"}
                          </div>
                        </div>

                        <div className="w-[160px]">
                          <Select
                            value={t.status}
                            onValueChange={(v) => changeStatus(t.id, v as TaskStatus)}
                          >
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

                    ))
                  )}
                </div>
              </TabsContent>

              {/* 3) לאחר טיפול */}
              <TabsContent value="residual" className="mt-4 space-y-3">
                <div className="rounded-xl border p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    כאן נציג רמת סיכון חדשה + צבע/סמל חדש אחרי ביצוע המשימות.
                  </div>

                  <div className="text-sm">
                    כרגע יש לך ב־RiskBoundary שדות:
                    severityAfter / frequencyAfter / scoreAfter / classificationAfter.
                    ברגע שתספי בבאק endpoint לעדכון “After”, נוכל לחבר פה UI של עדכון + תצוגה.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוספת מיטיגציה (משימה)</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>כותרת</Label>
                    <Input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(s => ({ ...s, title: e.target.value }))}
                      placeholder="לדוגמה: ניקוי אזור הסיכון / הצבת שילוט"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>תיאור</Label>
                    <Textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm(s => ({ ...s, description: e.target.value }))}
                      placeholder="מה עושים בפועל כדי להפחית סיכון?"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>אחראי (UserId)</Label>
                    <Input
                      value={taskForm.assigneeUserId}
                      onChange={(e) => setTaskForm(s => ({ ...s, assigneeUserId: e.target.value }))}
                      placeholder="אופציונלי"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>תאריך יעד</Label>
                    <Input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(s => ({ ...s, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateTaskOpen(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={createTask}
                    disabled={!taskForm.title.trim() || !taskForm.description.trim()}
                  >
                    שמור משימה
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
