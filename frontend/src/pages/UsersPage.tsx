// src/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Users, Plus } from "lucide-react";

import { DEFAULT_ORG_ID } from "@/api/config";
import { userService } from "@/api/services/userService";

import type { UserBoundary, UserRole, CreateUserBoundary } from "@/api/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "מנהל",
  CHIEF_RISK_MANAGER: "מנהל סיכונים ראשי",
  DIVISION_RISK_MANAGER: "מנהל סיכונים חטיבתי",
  DEPARTMENT_RISK_MANAGER: "מנהל סיכונים מחלקתי",
  EMPLOYEE: "עובד",
};

export default function UsersPage() {
  const orgId = DEFAULT_ORG_ID || (import.meta as any)?.env?.VITE_ORG_ID;

  const [users, setUsers] = useState<UserBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "EMPLOYEE" as UserRole,
    password: "",
  });

  async function load() {
    if (!orgId) {
      setErr("אין OrgId. הגדירי VITE_ORG_ID או DEFAULT_ORG_ID.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await userService.list({ orgId });
      setUsers(data);
    } catch (e) {
      console.error(e);
      setErr("נכשלה טעינת משתמשים. בדקי שה-User Service רץ ושיש OrgId תקין.");
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
    if (!s) return users;

    return users.filter((u) => {
      const full = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        full.includes(s) ||
        u.email.toLowerCase().includes(s) ||
        String(u.role).toLowerCase().includes(s)
      );
    });
  }, [users, q]);

  async function updateRole(userId: string, role: UserRole) {
    const prev = users;
    setUsers((p) => p.map((u) => (u.id === userId ? { ...u, role } : u)));

    try {
      await userService.updateRole(userId, { role }); // ✅ לפי השירות שלך
    } catch (e) {
      console.error(e);
      setUsers(prev);
      setErr("נכשל עדכון תפקיד (Role).");
    }
  }

  async function toggleActive(userId: string, active: boolean) {
    const prev = users;
    setUsers((p) => p.map((u) => (u.id === userId ? { ...u, active } : u)));

    try {
      await userService.update(userId, { active }); // ✅ לפי השירות שלך + UpdateUserBoundary
    } catch (e) {
      console.error(e);
      setUsers(prev);
      setErr("נכשל עדכון סטטוס משתמש (Active).");
    }
  }

  async function createUser() {
    if (!orgId) return;
    setErr(null);

    try {
      // אם CreateUserBoundary אצלך לא כולל password – אפשר להסיר את השורה או להשאיר עם cast.
      const payload = {
        orgId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password.trim() || undefined,
      } as unknown as CreateUserBoundary;

      const created = await userService.create(payload);

      setUsers((p) => [created, ...p]);
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", role: "EMPLOYEE", password: "" });
    } catch (e) {
      console.error(e);
      setErr("נכשלה יצירת משתמש. ייתכן שהשרת מצפה לשדות אחרים.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">משתמשים</h1>
          </div>
          <p className="mt-1 text-muted-foreground">ניהול משתמשים והרשאות בארגון</p>
          {loading && <p className="mt-2 text-sm text-muted-foreground">טוען…</p>}
          {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            הוסף משתמש
          </Button>
          <Button variant="outline" onClick={load}>רענון</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם/מייל/תפקיד…" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>רשימת משתמשים</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">מייל</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">אקטיבי</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-right">
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-muted-foreground">{u.id}</div>
                  </TableCell>

                  <TableCell className="text-right">{u.email}</TableCell>

                  <TableCell className="text-right">
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                    >
                      <option value="ADMIN">אדמין</option> 
                      <option value="CHIEF_RISK_MANAGER">מנהל סיכונים ראשי</option>
                      <option value="DIVISION_RISK_MANAGER">מנהל סיכונים חטיבתי</option>
                      <option value="DEPARTMENT_RISK_MANAGER">מנהל סיכונים מחלקתי</option>
                      <option value="EMPLOYEE">עובד</option>
                    </select>

                    <div className="mt-1">
                      <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch checked={u.active} onCheckedChange={(v) => toggleActive(u.id, v)} />
                      <span className="text-sm">{u.active ? "כן" : "לא"}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-muted-foreground">
                    אין משתמשים להצגה.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>הוספת משתמש</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">שם פרטי</label>
              <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">שם משפחה</label>
              <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">מייל</label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">תפקיד</label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
              >
                <option value="CHIEF_RISK_MANAGER">מנהל סיכונים ראשי</option>
                <option value="DIVISION_RISK_MANAGER">מנהל סיכונים חטיבתי</option>
                <option value="DEPARTMENT_RISK_MANAGER">מנהל סיכונים מחלקתי</option>
                <option value="EMPLOYEE">עובד</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-muted-foreground">סיסמה (אופציונלי)</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button
              onClick={createUser}
              disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
            >
              יצירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
