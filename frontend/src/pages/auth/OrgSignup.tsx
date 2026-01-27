import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { organizationService } from "@/api/services/organizationService";
import { Building2, ArrowLeft, Sparkles } from "lucide-react";

const ORG_ID_KEY = "railsafe.orgId";

export default function OrgSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (name.trim().length < 2) {
      toast.error("שם ארגון קצר מדי");
      return;
    }
    if (password.length < 6) {
      toast.error("סיסמה קצרה מדי", { description: "לפחות 6 תווים" });
      return;
    }

    try {
      setSubmitting(true);

      const org = await organizationService.create({ name: name.trim(), password });

      localStorage.setItem(ORG_ID_KEY, org.id);
      toast.success("הארגון נוצר!", { description: `ORG_ID: ${org.id}` });

      navigate("/signup/user");
    } catch (e: any) {
      toast.error("יצירת ארגון נכשלה", {
        description: e?.response?.data?.message || e?.message || "שגיאה לא ידועה",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">יצירת ארגון</h1>
        <p className="mt-1 text-muted-foreground">
          ניצור ארגון חדש ונאתחל עבורו מטריצת סיכונים וקטגוריות
        </p>
      </div>

      <div className="card-elevated p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">פרטי הארגון</p>
            <p className="text-sm text-muted-foreground">שם + סיסמה (MVP)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgName">שם ארגון</Label>
          <Input
            id="orgName"
            placeholder='לדוגמה: "רכבת ישראל - אגף תפעול"'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            אחרי יצירה תקבלי ORG_ID שנשמר אוטומטית ליצירת משתמשים.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="orgPassword">סיסמת ארגון</Label>
          <Input
            id="orgPassword"
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            הסיסמה נשמרת בבקאנד כ־hash ומשמשת בהמשך (אם תחליטי להשתמש בה לכניסת ארגון).
          </p>
        </div>
        <Button className="w-full" onClick={onSubmit} disabled={submitting}>
          {submitting ? "יוצר ארגון..." : (
            <>
              צור ארגון <Sparkles className="mr-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
        יש לך כבר משתמש? התחברי <ArrowLeft className="mr-2 h-4 w-4" />
      </Button>
    </div>
  );
}
