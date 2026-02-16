import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 

import { StatsCard } from "@/components/dashboard/StatsCard";
import { RiskMatrix } from "@/components/dashboard/RiskMatrix";
import { RecentRisks } from "@/components/dashboard/RecentRisks";

import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingDown,
  Shield,
} from "lucide-react";

import { riskService } from "@/api/services/riskService";
import { DEFAULT_ORG_ID } from "@/api/config";

// אם יש לך טיפוס UI משלך (RiskSeverity/RiskStatus) תשאירי.
// פה אני מכין "adapter" שמחזיר אובייקט בסגנון mock כדי לא לשבור קומפוננטות.
type UiRisk = {
  id: string;
  title: string;
  description: string;
  category: string;
  siteName?: string;
  likelihood: number;
  impact: number;
  score: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  createdAt: string;
  updatedAt: string;
};

function mapClassificationToUiSeverity(
  c: string
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  switch (c) {
    case "EXTREME_RED":
      return "CRITICAL";
    case "HIGH_ORANGE":
      return "HIGH";
    case "MEDIUM_YELLOW":
      return "MEDIUM";
    case "LOW_GREEN":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

export default function Dashboard() {
  const nav = useNavigate();
  const [uiRisks, setUiRisks] = useState<UiRisk[]>([]);
  const [loading, setLoading] = useState(false);

  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [byClassification, setByClassification] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!DEFAULT_ORG_ID) return;

    (async () => {
      setLoading(true);
      try {
        // 1) סיכונים
        const risks = await riskService.list({ orgId: DEFAULT_ORG_ID });

        // התאמה למבנה שהקומפוננטות שלך מצפות לקבל (כמו mock)
        const mapped: UiRisk[] = risks.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.categoryCode,
          siteName: r.location ?? undefined,
          likelihood: r.frequencyLevel,
          impact: r.severityLevel,
          score: r.riskScore,
          severity: mapClassificationToUiSeverity(r.classification),
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));

        setUiRisks(mapped);

        // 2) סטטיסטיקות
        const statusMap = await riskService.countByStatus(DEFAULT_ORG_ID);
        const classMap = await riskService.countByClassification(DEFAULT_ORG_ID);

        setByStatus(statusMap as any);
        setByClassification(classMap as any);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- חישוב סטטיסטיקות לתצוגה ----
  const stats = useMemo(() => {
    const totalRisks = uiRisks.length;

    const criticalRisks = byClassification["EXTREME_RED"] ?? 0;
    const highRisks = byClassification["HIGH_ORANGE"] ?? 0;

    // "בטיפול" — בבקאנד יש IN_TREATMENT (לפי RiskController שלך)
    const inProgressRisks = byStatus["IN_TREATMENT"] ?? 0;

    // "הופחתו החודש" — נניח MITIGATED (אם זה מה שאת רוצה להציג)
    const mitigatedThisMonth = byStatus["MITIGATED"] ?? 0;

    // "חריגי SLA" — אין כרגע endpoint אמיתי לזה, אז 0 עד שתגדירי SLA בבקאנד
    const overdueRisks = 0;

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      inProgressRisks,
      overdueRisks,
      mitigatedThisMonth,
    };
  }, [uiRisks, byStatus, byClassification]);

  function goToRisks(filters?: Record<string, string | number | undefined | null>) {
    const qs = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        qs.set(k, String(v));
      });
    }
    const suffix = qs.toString();
    nav(suffix ? `/risks?${suffix}` : "/risks");
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
        <p className="mt-1 text-muted-foreground">
          סקירה כללית של מצב הסיכונים במערכת
        </p>
        {loading && (
          <p className="mt-2 text-sm text-muted-foreground">טוען נתונים...</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="סה״כ סיכונים"
          value={stats.totalRisks}
          icon={Shield}
          variant="default"
          onClick={() => goToRisks()}
        />
        <StatsCard
          title="קריטיים"
          value={stats.criticalRisks}
          icon={AlertCircle}
          variant="critical"
          onClick={() => goToRisks({ classification: "EXTREME_RED" })}
        />
        <StatsCard
          title="גבוהים"
          value={stats.highRisks}
          icon={AlertTriangle}
          variant="high"
          onClick={() => goToRisks({ classification: "HIGH_ORANGE" })}
        />
        <StatsCard
          title="בטיפול"
          value={stats.inProgressRisks}
          icon={Clock}
          variant="medium"
          onClick={() => goToRisks({ status: "IN_TREATMENT" })}
        />
        <StatsCard
          title="חריגי SLA"
          value={stats.overdueRisks}
          icon={TrendingDown}
          variant={stats.overdueRisks > 0 ? "critical" : "low"}
        />
        <StatsCard
          title="הופחתו החודש"
          value={stats.mitigatedThisMonth}
          icon={CheckCircle}
          variant="low"
          onClick={() => goToRisks({ status: "MITIGATED" })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskMatrix
          risks={uiRisks as any}
          onCellClick={(likelihood, impact) => goToRisks({ score: likelihood * impact })} // ✅ תא במטריצה
        />
        <RecentRisks risks={uiRisks as any} />
      </div>
    </div>
  );
}