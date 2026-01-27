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
type Role =
  | "CHIEF_RISK_MANAGER"
  | "DIVISION_RISK_MANAGER"
  | "DEPARTMENT_RISK_MANAGER"
  | "EMPLOYEE";

export default function UserSignup() {
  const navigate = useNavigate();

  const [orgId, setOrgId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    divisionId: "",
    departmentId: "",
    role: "CHIEF_RISK_MANAGER" as Role,
  });

  useEffect(() => {
    const saved = localStorage.getItem(ORG_ID_KEY);
    if (saved) setOrgId(saved);
  }, []);
  // -------- Role-based required fields --------
  const needsDivision =
    form.role === "DIVISION_RISK_MANAGER" || form.role === "DEPARTMENT_RISK_MANAGER";
  const needsDepartment = form.role === "DEPARTMENT_RISK_MANAGER";

  const divisionOk = !needsDivision || form.divisionId.trim().length > 0;
  const departmentOk = !needsDepartment || form.departmentId.trim().length > 0;

  const canSubmit =
    orgId.trim().length > 0 &&
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.email.includes("@") &&
    form.password.length >= 6 &&
    divisionOk &&
    departmentOk;

  const onSubmit = async () => {
    if (!canSubmit) {
      toast.error("חסר מידע", { description: "בדקי שכל השדות מלאים ותקינים" });
      return;
    }

    try {
      setSubmitting(true);

      // we send division/department only if relevant (cleaner payload)
      const payload: any = {
        orgId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };

      if (needsDivision) payload.divisionId = form.divisionId.trim();
      if (needsDepartment) payload.departmentId = form.departmentId.trim();

      await userService.create(payload);

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

   const onRoleChange = (role: Role) => {
    // When switching roles, clear irrelevant fields to avoid confusion
    if (role === "CHIEF_RISK_MANAGER" || role === "EMPLOYEE") {
      setForm({ ...form, role, divisionId: "", departmentId: "" });
      return;
    }

    if (role === "DIVISION_RISK_MANAGER") {
      setForm({ ...form, role, departmentId: "" }); // keep divisionId if already typed
      return;
    }

    // DEPARTMENT_RISK_MANAGER
    setForm({ ...form, role });
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
              <SelectItem value="CHIEF_RISK_MANAGER">Chief Risk Manager</SelectItem>
              <SelectItem value="DIVISION_RISK_MANAGER">Division Risk Manager</SelectItem>
              <SelectItem value="DEPARTMENT_RISK_MANAGER">Department Risk Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
           <p className="text-xs text-muted-foreground">
            לפי התפקיד ייתכן שתידרשי להגדיר Division/Department.
          </p>
        </div>

        {/* Role-based fields */}
        {needsDivision && (
          <div className="space-y-2">
            <Label>divisionId</Label>
            <Input
              value={form.divisionId}
              onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
              placeholder="UUID של Division"
            />
            {!divisionOk && (
              <p className="text-xs text-destructive">חובה להזין divisionId לתפקיד זה</p>
            )}
          </div>
        )}

        {needsDepartment && (
          <div className="space-y-2">
            <Label>departmentId</Label>
            <Input
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              placeholder="UUID של Department"
            />
            {!departmentOk && (
              <p className="text-xs text-destructive">חובה להזין departmentId לתפקיד זה</p>
            )}
          </div>
        )}

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
