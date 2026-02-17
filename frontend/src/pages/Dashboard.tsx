import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { RiskMatrix } from "@/components/dashboard/RiskMatrix";
import { RecentRisks } from "@/components/dashboard/RecentRisks";
import { RiskDrawer } from "@/components/risks/RiskDrawer";

import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingDown,
  Shield,
} from "lucide-react";

import { riskService } from "@/api/services/riskService";
import { getCurrentOrgId } from "@/api/config";

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  function openRiskDrawer(riskId: string) {
    setSelectedRiskId(riskId);
    setDrawerOpen(true);
  }

  useEffect(() => {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      // אם אין org מחובר – נשלח להתחברות (או אפשר רק להציג הודעה)
      nav("/login");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        // 1) סיכונים
        const risks = await riskService.list({ orgId });

        const mapped: UiRisk[] = risks.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? "",
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
        const statusMap = await riskService.countByStatus(orgId);
        const classMap = await riskService.countByClassification(orgId);

        setByStatus(statusMap as any);
        setByClassification(classMap as any);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  // ---- חישוב סטטיסטיקות לתצוגה ----
  const stats = useMemo(() => {
    const totalRisks = uiRisks.length;

    const criticalRisks = byClassification["EXTREME_RED"] ?? 0;
    const highRisks = byClassification["HIGH_ORANGE"] ?? 0;

    const inProgressRisks = byStatus["IN_TREATMENT"] ?? 0;
    const mitigatedThisMonth = byStatus["MITIGATED"] ?? 0;

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
        <p className="mt-1 text-muted-foreground">סקירה כללית של מצב הסיכונים במערכת</p>
        {loading && <p className="mt-2 text-sm text-muted-foreground">טוען נתונים...</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="סה״כ סיכונים" value={stats.totalRisks} icon={Shield} variant="default" onClick={() => goToRisks()} />
        <StatsCard title="קריטיים" value={stats.criticalRisks} icon={AlertCircle} variant="critical" onClick={() => goToRisks({ classification: "EXTREME_RED" })} />
        <StatsCard title="גבוהים" value={stats.highRisks} icon={AlertTriangle} variant="high" onClick={() => goToRisks({ classification: "HIGH_ORANGE" })} />
        <StatsCard title="בטיפול" value={stats.inProgressRisks} icon={Clock} variant="medium" onClick={() => goToRisks({ status: "IN_TREATMENT" })} />
        <StatsCard title="חריגי SLA" value={stats.overdueRisks} icon={TrendingDown} variant={stats.overdueRisks > 0 ? "critical" : "low"} />
        <StatsCard title="הופחתו החודש" value={stats.mitigatedThisMonth} icon={CheckCircle} variant="low" onClick={() => goToRisks({ status: "MITIGATED" })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskMatrix
          risks={uiRisks as any}
          onCellClick={(likelihood, impact) => goToRisks({ score: likelihood * impact })}
        />
        <RecentRisks risks={uiRisks as any} onRiskClick={openRiskDrawer} />
      </div>

      {/* Drawer */}
      <RiskDrawer open={drawerOpen} onOpenChange={setDrawerOpen} riskId={selectedRiskId} />
    </div>
  );
}
