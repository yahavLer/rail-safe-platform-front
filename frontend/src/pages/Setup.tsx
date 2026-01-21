// src/pages/Setup.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { organizationService } from "@/api/services/organizationService";
import { userService } from "@/api/services/userService";

export default function Setup() {
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // שדות משתמש (תתאימי לפי CreateUserBoundary אצלך ב-frontend types)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);

  const createOrg = async () => {
    try {
      setLoadingOrg(true);
      const org = await organizationService.create({ name: orgName });
      setOrgId(org.id);

      // מומלץ: לשמור orgId כדי שכל האפליקציה תדע מי הארגון הפעיל
      localStorage.setItem("orgId", org.id);

      toast.success("הארגון נוצר בהצלחה", { description: org.name });
    } catch (e: any) {
      toast.error("יצירת ארגון נכשלה", {
        description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
      });
    } finally {
      setLoadingOrg(false);
    }
  };

  const createUser = async () => {
    if (!orgId) return;

    try {
      setLoadingUser(true);

      // ⚠️ חשוב: תתאימי את השדות פה 1:1 ל-CreateUserBoundary אצלך ב-src/api/types
      // אם למשל אצלך זה organizationId / orgId / role / externalAuthId וכו׳ — תשני בהתאם.
      const payload: any = {
        organizationId: orgId,
        firstName,
        lastName,
        email,
      };

      const user = await userService.create(payload);

      toast.success("המשתמש נוצר בהצלחה", { description: `${user.firstName} ${user.lastName}` });

      // אחרי שיש orgId פעיל — אפשר להיכנס לאפליקציה
      navigate("/");
    } catch (e: any) {
      toast.error("יצירת משתמש נכשלה", {
        description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">התחלה מהירה</h1>
        <p className="text-muted-foreground mt-1">
          ניצור ארגון ראשון, ואז ניצור משתמש בארגון.
        </p>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>1) יצירת ארגון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>שם הארגון</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="לדוגמה: רכבת ישראל" />
          </div>

          <Button onClick={createOrg} disabled={!orgName || loadingOrg}>
            {loadingOrg ? "יוצר..." : "צור ארגון"}
          </Button>

          {orgId && (
            <div className="text-sm text-muted-foreground">
              Org ID: <span className="font-mono">{orgId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>2) יצירת משתמש בארגון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!orgId ? (
            <div className="text-sm text-muted-foreground">קודם צרי ארגון כדי להמשיך.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם פרטי</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>שם משפחה</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
              </div>

              <Button onClick={createUser} disabled={!firstName || !lastName || !email || loadingUser}>
                {loadingUser ? "יוצר..." : "צור משתמש והמשך"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
