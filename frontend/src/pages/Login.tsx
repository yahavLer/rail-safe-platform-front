import { session } from "@/auth/session";
import { setCurrentOrgId } from "@/api/config";

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

import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<OrganizationBoundary[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const [orgId, setOrgId] = useState("");
  const [orgQuery, setOrgQuery] = useState(""); // ✅ חיפוש ארגון

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false); // ✅ עין
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingOrgs(true);
        const list = await organizationService.listOrganizations();
        setOrgs(list);

        // ✅ Preselect org from session if exists - validate it
        const saved = session.getOrgId();
        if (saved) {
          const byId = list.find((o) => o.id === saved);
          const byName = list.find((o) => o.name === saved); // אם פעם נשמר בטעות שם
          if (byId) setOrgId(byId.id);
          else if (byName) setOrgId(byName.id);
          else setOrgId("");
        }
      } catch (e: any) {
        toast.error("שגיאה בטעינת ארגונים", {
          description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
        });
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  const filteredOrgs = useMemo(() => {
    const q = orgQuery.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => (o.name ?? "").toLowerCase().includes(q));
  }, [orgs, orgQuery]);

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
      toast.error("חסר מידע", {
        description: "בחרי ארגון והזיני אימייל וסיסמה תקינים",
      });
      return;
    }

    try {
      setSubmitting(true);

      const user: UserBoundary = await userService.login({
        orgId,
        email: email.trim(),
        password,
      });

      // ✅ Save session + org (יציב)
      session.setUser(user);
      session.setOrgId(orgId);

      // ✅ חשוב ל-NewRisk: שיהיה גם ב-config וגם בלוקאלסטורג'
      setCurrentOrgId(orgId);
      localStorage.setItem("railsafe.orgId", orgId); // ליתר ביטחון

      toast.success("התחברת בהצלחה!", {
        description: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      });

      if (user.role === "CHIEF_RISK_MANAGER") {
        navigate("/risk-definitions");
      } else {
        navigate("/dashboard");
      }
    } catch (e: any) {
      toast.error("התחברות נכשלה", {
        description:
          e?.response?.data?.message || e?.message || "אימייל/סיסמה/ארגון לא נכונים",
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
        {/* ✅ Organization with search */}
        <div className="space-y-2">
          <Label>ארגון</Label>

          <Input
            placeholder="התחילי להקליד כדי לחפש ארגון..."
            value={orgQuery}
            onChange={(e) => setOrgQuery(e.target.value)}
            disabled={loadingOrgs}
          />

          <Select value={orgId} onValueChange={setOrgId} disabled={loadingOrgs}>
            <SelectTrigger>
              <SelectValue
                placeholder={loadingOrgs ? "טוען ארגונים..." : "בחר ארגון"}
              />
            </SelectTrigger>

            <SelectContent>
              {filteredOrgs.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  לא נמצא ארגון.
                </div>
              ) : (
                filteredOrgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            אפשר לחפש ואז לבחור מהרשימה.
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

        {/* ✅ Password + Eye */}
        <div className="space-y-2">
          <Label>סיסמה</Label>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="לפחות 6 תווים"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pl-10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              onMouseDown={(e) => e.preventDefault()}
              className="absolute inset-y-0 left-2 flex items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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