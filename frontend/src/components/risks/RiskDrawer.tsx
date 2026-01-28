import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { riskService } from "@/api/services/riskService";
import { taskService } from "@/api/services/taskService";
import { DEFAULT_ORG_ID } from "@/api/config";
import type { RiskBoundary, TaskBoundary, TaskStatus } from "@/api/types";

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

  useEffect(() => {
    if (!open || !riskId || !DEFAULT_ORG_ID) return;

    (async () => {
      setLoading(true);
      try {
        const [r, t] = await Promise.all([
          riskService.getById(riskId),
          taskService.list({ orgId: DEFAULT_ORG_ID, riskId }),
        ]);
        setRisk(r);
        setTasks(t);
      } catch (e) {
        console.error("RiskDrawer load failed", e);
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

        {!risk ? (
          <div className="mt-6 text-sm text-muted-foreground">בחרי סיכון כדי לראות פירוט.</div>
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
                  <Button variant="outline" onClick={exportTasks} disabled={!tasks.length}>
                    ייצוא משימות
                  </Button>
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
                            סטטוס: {t.status} • אחראי: {t.assigneeUserId ?? "לא שויך"}
                          </div>
                        </div>

                        {t.status !== "DONE" && (
                          <Button onClick={() => markDone(t.id)}>סמן בוצע</Button>
                        )}
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
