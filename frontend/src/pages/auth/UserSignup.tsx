import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { UserPlus, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { userService } from "@/api/services/userService";

const ORG_ID_KEY = "railsafe.orgId";

export default function UserSignup() {
  const navigate = useNavigate();

  const [orgId, setOrgId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "RISK_MANAGER" | "EMPLOYEE",
  });

  useEffect(() => {
    const saved = localStorage.getItem(ORG_ID_KEY);
    if (saved) setOrgId(saved);
  }, []);

  const canSubmit =
    orgId &&
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.email.includes("@") &&
    form.password.length >= 6;

  const onSubmit = async () => {
    if (!canSubmit) {
      toast.error("חסר מידע", { description: "בדקי שכל השדות מלאים ותקינים" });
      return;
    }

    try {
      setSubmitting(true);

      await userService.register({
        organizationId: orgId,
        ...form,
      });

      toast.success("המשתמש נוצר בהצלחה!", {
        description: "כעת אפשר להתחבר למערכת",
      });

      navigate("/login");
    } catch (e: any) {
      toast.error("יצירת משתמש נכשלה", {
        description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">יצירת משתמש</h1>
        <p className="mt-1 text-muted-foreground">
          המשתמש ישויך לארגון הקיים (ORG_ID)
        </p>
      </div>

      <div className="card-elevated p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">פרטי משתמש</p>
            <p className="text-sm text-muted-foreground">MVP – עם Role</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgId">ORG_ID (ארגון)</Label>
          <div className="flex gap-2">
            <Input
              id="orgId"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="UUID של הארגון"
            />
            <div className="flex items-center rounded-xl border px-3 text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            נשמר אוטומטית אחרי יצירת ארגון. אפשר לשנות ידנית אם צריך.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>שם פרטי</Label>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>שם משפחה</Label>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>אימייל</Label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>סיסמה</Label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>תפקיד</Label>
          <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
            <SelectTrigger>
              <SelectValue placeholder="בחר תפקיד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="RISK_MANAGER">Risk Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "יוצר משתמש..." : (
            <>
              צור משתמש <CheckCircle2 className="mr-2 h-4 w-4" />
            </>
          )}
        </Button>

        <Button variant="outline" className="w-full" onClick={() => navigate("/signup/org")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה ליצירת ארגון
        </Button>
      </div>
    </div>
  );
}
