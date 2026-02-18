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
import { organizationService } from "@/api/services/organizationService";
import { getCurrentOrgId } from "@/api/config";

import type {
  RiskBoundary,
  RiskMatrixBoundary,
  RiskStatus,
  RiskClassification,
} from "@/api/types";

export default function Dashboard() {
  const nav = useNavigate();

  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [matrix, setMatrix] = useState<RiskMatrixBoundary | null>(null);
  const [loading, setLoading] = useState(false);

  const [byStatus, setByStatus] = useState<Record<RiskStatus, number>>({} as any);
  const [byClassification, setByClassification] =
    useState<Record<RiskClassification, number>>({} as any);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  function openRiskDrawer(riskId: string) {
    setSelectedRiskId(riskId);
    setDrawerOpen(true);
  }

  useEffect(() => {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      nav("/login");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [risksRes, matrixRes, statusMap, classMap] = await Promise.all([
          riskService.list({ orgId }),
          organizationService.getRiskMatrix(orgId),
          riskService.countByStatus(orgId),
          riskService.countByClassification(orgId),
        ]);

        setRisks(risksRes);
        setMatrix(matrixRes);
        setByStatus(statusMap as any);
        setByClassification(classMap as any);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  const stats = useMemo(() => {
    const totalRisks = risks.length;

    const criticalRisks = byClassification["EXTREME_RED"] ?? 0;
    const highRisks = byClassification["HIGH_ACTION_ORANGE"] ?? 0;

    const mitigationPlanned = byStatus["MITIGATION_PLANNED"] ?? 0;
    const inProgress = byStatus["IN_PROGRESS"] ?? 0;

    // אם עדיין אין SLA אצלך — נשאר 0
    const overdueRisks = 0;

    const closed = byStatus["CLOSED"] ?? 0;

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      mitigationPlanned,
      inProgress,
      overdueRisks,
      closed,
    };
  }, [risks, byStatus, byClassification]);

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
          onClick={() => goToRisks({ classification: "HIGH_ACTION_ORANGE" })}
        />

        <StatsCard
          title="בתכנון מיטיגציה"
          value={stats.mitigationPlanned}
          icon={Clock}
          variant="medium"
          onClick={() => goToRisks({ status: "MITIGATION_PLANNED" })}
        />

        <StatsCard
          title="חריגי SLA"
          value={stats.overdueRisks}
          icon={TrendingDown}
          variant={stats.overdueRisks > 0 ? "critical" : "low"}
        />

        <StatsCard
          title="נסגרו"
          value={stats.closed}
          icon={CheckCircle}
          variant="low"
          onClick={() => goToRisks({ status: "CLOSED" })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskMatrix
          risks={risks}
          matrix={matrix}
          onCellClick={(likelihood, impact) => goToRisks({ score: likelihood * impact })}
        />

        <RecentRisks risks={risks} onRiskClick={openRiskDrawer} />
      </div>

      <RiskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        riskId={selectedRiskId}
      />
    </div>
  );
}
