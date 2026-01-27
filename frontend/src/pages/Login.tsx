import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { organizationService } from "@/api/services/organizationService";
import { userService } from "@/api/services/userService";
import type { OrganizationBoundary, UserBoundary } from "@/api/types";

const SESSION_KEY = "railsafe.session";
const ORG_ID_KEY = "railsafe.orgId";

export default function Login() {
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<OrganizationBoundary[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const [orgId, setOrgId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingOrgs(true);
        const list = await organizationService.listOrganizations();
        setOrgs(list);

        // If an orgId was saved earlier (after org signup), preselect it
        const savedOrgId = localStorage.getItem(ORG_ID_KEY);
        if (savedOrgId) setOrgId(savedOrgId);
      } catch (e: any) {
        toast.error("שגיאה בטעינת ארגונים", {
          description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
        });
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      orgId.trim().length > 0 &&
      email.trim().includes("@") &&
      password.length >= 6 &&
      !loadingOrgs
    );
  }, [orgId, email, password, loadingOrgs]);

  const onSubmit = async () => {
    if (!canSubmit) {
      toast.error("חסר מידע", { description: "בחרי ארגון והזיני אימייל וסיסמה תקינים" });
      return;
    }

    try {
      setSubmitting(true);

      const user: UserBoundary = await userService.login({
        orgId,
        email: email.trim(),
        password,
      });

      // Save session + org
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(ORG_ID_KEY, orgId);

      toast.success("התחברת בהצלחה!", {
        description: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      });

      // Route by role
      if (user.role === "CHIEF_RISK_MANAGER") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (e: any) {
      toast.error("התחברות נכשלה", {
        description:
          e?.response?.data?.message ||
          e?.message ||
          "אימייל/סיסמה/ארגון לא נכונים",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">התחברות</h1>
        <p className="mt-1 text-muted-foreground">
          בחרי ארגון והזיני פרטי משתמש כדי להיכנס למערכת
        </p>
      </div>

      <div className="card-elevated p-6 space-y-5">
        <div className="space-y-2">
          <Label>ארגון</Label>
          <Select value={orgId} onValueChange={setOrgId} disabled={loadingOrgs}>
            <SelectTrigger>
              <SelectValue placeholder={loadingOrgs ? "טוען ארגונים..." : "בחר ארגון"} />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            אם הרגע יצרת ארגון – הוא אמור להופיע כאן.
          </p>
        </div>

        <div className="space-y-2">
          <Label>אימייל</Label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label>סיסמה</Label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <Button className="w-full" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "מתחבר..." : "התחבר"}
        </Button>

        <Button variant="outline" className="w-full" onClick={() => navigate("/signup/org")}>
          אין לך ארגון? צור ארגון
        </Button>
      </div>
    </div>
  );
}
