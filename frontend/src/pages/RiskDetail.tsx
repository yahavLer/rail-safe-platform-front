import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { riskService } from "@/api/services/riskService";
import { getCurrentOrgId } from "@/api/config";
import type { RiskBoundary } from "@/api/types";

export default function RiskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const orgId = getCurrentOrgId();

  const [risk, setRisk] = useState<RiskBoundary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setError("אין ארגון מחובר. התחברי מחדש.");
      return;
    }
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await riskService.getById(id);
        setRisk(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "שגיאה בטעינת סיכון");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, orgId]);

  // אם את עוד לא מרנדרת פה UI — לפחות זה ימנע מצב "שקט" בלי להבין מה קורה:
  if (!orgId) {
    return (
      <div className="mt-6 text-sm text-red-600">
        אין ארגון מחובר. <button className="underline" onClick={() => navigate("/login")}>התחברי</button>
      </div>
    );
  }

  if (loading) return <div className="mt-6 text-sm text-muted-foreground">טוען…</div>;
  if (error) return <div className="mt-6 text-sm text-red-600">{error}</div>;
  if (!risk) return <div className="mt-6 text-sm text-muted-foreground">לא נמצא סיכון.</div>;

  return (
    <div className="space-y-3">
      <div className="text-2xl font-bold">{risk.title}</div>
      <div className="text-sm text-muted-foreground">{risk.description ?? "—"}</div>
      {/* פה תמשיכי עם שאר התצוגה שלך */}
    </div>
  );
}
