import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCurrentOrgId } from "@/api/config";
import { riskService } from "@/api/services/riskService";
import { taskService } from "@/api/services/taskService";
import { organizationService } from "@/api/services/organizationService";
import { userService } from "@/api/services/userService";

import type {
  CategoryBoundary,
  RiskBoundary,
  RiskStatus,
  TaskBoundary,
  UserBoundary,
  UpdateRiskBoundary,
} from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

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

export function RiskEditPage() {
  const nav = useNavigate();
  const { riskId } = useParams<{ riskId: string }>();
  const orgId = getCurrentOrgId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [risk, setRisk] = useState<RiskBoundary | null>(null);
  const [tasks, setTasks] = useState<TaskBoundary[]>([]);
  const [users, setUsers] = useState<UserBoundary[]>([]);
  const [categories, setCategories] = useState<CategoryBoundary[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryCode: "",
    location: "",
    notes: "",
    riskManagerUserId: "",
    status: "OPEN" as RiskStatus,

    // אם תממשי UpdateRiskBoundary עם After:
    severityAfter: 0,
    frequencyAfter: 0,
  });

  const owner = useMemo(
    () => users.find((u) => u.id === form.riskManagerUserId),
    [users, form.riskManagerUserId]
  );

  async function loadAll() {
    if (!orgId || !riskId) return;

    setLoading(true);
    try {
      const [r, t, u, c] = await Promise.all([
        riskService.getById(riskId),
        taskService.list({ orgId, riskId }),
        userService.list({ orgId }),
        organizationService.listCategories(orgId),
      ]);

      setRisk(r);
      setTasks(t ?? []);
      setUsers(u ?? []);
      setCategories((c ?? []).filter((x) => x.active).sort((a, b) => a.displayOrder - b.displayOrder));

      setForm({
        title: r.title ?? "",
        description: r.description ?? "",
        categoryCode: r.categoryCode ?? "",
        location: r.location ?? "",
        notes: r.notes ?? "",
        riskManagerUserId: r.riskManagerUserId ?? "",
        status: r.status,

        severityAfter: r.severityAfter ?? 0,
        frequencyAfter: r.frequencyAfter ?? 0,
      });
    } catch (e: any) {
      toast.error("שגיאה בטעינת הסיכון", {
        description: e?.response?.data?.message || e?.message || "לא ניתן לטעון נתונים",
      });
      nav("/risks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orgId) {
      nav("/login");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, riskId]);

  async function onSave() {
    if (!orgId || !riskId || !risk) return;

    setSaving(true);
    try {
      const patch: UpdateRiskBoundary = {
        title: form.title,
        description: form.description,
        categoryCode: form.categoryCode,
        location: form.location || undefined,
        notes: form.notes || undefined,
        riskManagerUserId: form.riskManagerUserId || undefined,

        // אם הוספת ל-UpdateRiskBoundary + הבאק תומך:
        severityAfter: form.severityAfter || undefined,
        frequencyAfter: form.frequencyAfter || undefined,
      };

      await riskService.update(riskId, patch);

      if (form.status !== risk.status) {
        await riskService.updateStatus(riskId, { status: form.status });
      }

      toast.success("הסיכון עודכן בהצלחה");
      nav("/risks");
    } catch (e: any) {
      toast.error("עדכון הסיכון נכשל", {
        description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">טוען סיכון...</div>;
  }

  if (!risk) {
    return <div className="p-4 text-sm text-muted-foreground">לא נמצא סיכון</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">עריכת סיכון</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", statusBadgeStyles[form.status] ?? "border-muted/40")}
            >
              {STATUS_LABELS_HE[form.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">#{risk.id.slice(0, 8)}…</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/risks")}>
            ביטול
          </Button>
          <Button onClick={onSave} disabled={saving || !form.title.trim() || !form.description.trim()}>
            {saving ? "שומר..." : "שמור שינויים"}
          </Button>
        </div>
      </div>

      {/* פרטי סיכון */}
      <div className="card-elevated p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>כותרת *</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>קטגוריה *</Label>
            <Select value={form.categoryCode} onValueChange={(v) => setForm((p) => ({ ...p, categoryCode: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>תיאור *</Label>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>מיקום</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="לדוגמה: תחנת באר שבע צפון"
            />
          </div>

          <div className="space-y-2">
            <Label>סטטוס *</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as RiskStatus }))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS_HE) as RiskStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS_HE[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>אחראי/ת סיכון</Label>
            <Select value={form.riskManagerUserId} onValueChange={(v) => setForm((p) => ({ ...p, riskManagerUserId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר משתמש" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {owner ? `נבחר: ${owner.firstName} ${owner.lastName}` : "לא נבחר אחראי"}
            </div>
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>

        {/* (אופציונלי) סיכון אחרי מיטיגציות - אם הבאק תומך ב-update */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>סבירות אחרי</Label>
            <Select
              value={String(form.frequencyAfter || "")}
              onValueChange={(v) => setForm((p) => ({ ...p, frequencyAfter: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר רמה" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((x) => (
                  <SelectItem key={x} value={String(x)}>
                    רמה {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>השפעה אחרי</Label>
            <Select
              value={String(form.severityAfter || "")}
              onValueChange={(v) => setForm((p) => ({ ...p, severityAfter: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר רמה" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((x) => (
                  <SelectItem key={x} value={String(x)}>
                    רמה {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* מיטיגציות */}
      <div className="card-elevated p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">מיטיגציות (משימות)</div>
          <div className="text-sm text-muted-foreground">סה״כ: {tasks.length}</div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">אין מיטיגציות לסיכון הזה עדיין.</div>
        ) : (
          <div className="rounded-lg border divide-y">
            {tasks.map((t) => (
              <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                </div>
                <div className="text-xs text-muted-foreground">{t.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default RiskEditPage;
