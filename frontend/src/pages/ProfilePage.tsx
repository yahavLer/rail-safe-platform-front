import { useEffect, useMemo, useState } from "react";
import { Mail, Shield, Building2, UserRound } from "lucide-react";

import { session } from "@/auth/session";
import { organizationService } from "@/api/services/organizationService";
import type { OrganizationBoundary, UserRole } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABEL: Record<UserRole, string> = {
  CHIEF_RISK_MANAGER: "מנהל סיכונים ראשי",
  DIVISION_RISK_MANAGER: "מנהל סיכונים חטיבתי",
  DEPARTMENT_RISK_MANAGER: "מנהל סיכונים אגפי",
  EMPLOYEE: "עובד",
};

export default function ProfilePage() {
  const user = session.getUser();
  const orgId = session.getOrgId();
  const [organization, setOrganization] = useState<OrganizationBoundary | null>(null);
  const [orgError, setOrgError] = useState("");

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;
    organizationService
      .getById(orgId)
      .then((org) => {
        if (!cancelled) setOrganization(org);
      })
      .catch((e) => {
        console.error("Profile organization load failed", e);
        if (!cancelled) setOrgError("לא ניתן לטעון את פרטי הארגון כרגע");
      });

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const fullName = useMemo(() => {
    const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
    return name || user?.email || "משתמש";
  }, [user]);

  if (!user) return null;

  const details = [
    { icon: UserRound, label: "שם משתמש", value: fullName },
    { icon: Mail, label: "אימייל", value: user.email || "לא הוגדר" },
    { icon: Shield, label: "תפקיד", value: ROLE_LABEL[user.role] ?? user.role },
    {
      icon: Building2,
      label: "ארגון",
      value: organization?.name || orgError || "לא הוגדר",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">פרופיל</h1>
        <p className="mt-1 text-muted-foreground">פרטי המשתמש המחובר</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{fullName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-md border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="truncate font-medium">{item.value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
