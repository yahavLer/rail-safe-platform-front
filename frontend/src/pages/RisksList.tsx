import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { riskService } from "@/api/services/riskService";
import { getCurrentOrgId } from "@/api/config";
import type { RiskBoundary, RiskClassification } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RiskDrawer } from "@/components/risks/RiskDrawer";
import { RiskTable } from "@/components/risks/RiskTable";

function toUiSeverity(c: RiskClassification) {
  switch (c) {
    case "EXTREME_RED": return "קריטי";
    case "HIGH_ORANGE": return "גבוה";
    case "MEDIUM_YELLOW": return "בינוני";
    case "LOW_GREEN": return "נמוך";
  }
}

export default function RisksList() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const orgId = getCurrentOrgId();

  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [classificationFilter, setClassificationFilter] = useState<RiskClassification | null>(null);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const isRiskClassification = (v: string): v is RiskClassification =>
    ["EXTREME_RED", "HIGH_ORANGE", "MEDIUM_YELLOW", "LOW_GREEN"].includes(v);

  useEffect(() => {
    const c = searchParams.get("classification");
    setClassificationFilter(c && isRiskClassification(c) ? c : null);

    const s = searchParams.get("score");
    const n = s ? Number(s) : NaN;
    setScoreFilter(Number.isFinite(n) ? n : null);

    const st = searchParams.get("status");
    setStatusFilter(st ? st : null);
  }, [searchParams]);

  useEffect(() => {
    if (!orgId) {
      setRisks([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const data = await riskService.list({ orgId });
        setRisks(data);
      } catch (e) {
        console.error("RisksList load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const filteredRisks = useMemo(() => {
    let list = risks;

    if (classificationFilter) list = list.filter(r => r.classification === classificationFilter);
    if (scoreFilter !== null) list = list.filter(r => r.riskScore === scoreFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(r =>
      (r.title ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q) ||
      (r.categoryCode ?? "").toLowerCase().includes(q)
    );
  }, [risks, search, classificationFilter, scoreFilter, statusFilter]);

  function clearUrlFilters() {
    setSearchParams({});
  }

  function openRiskDrawer(riskId: string) {
    setSelectedRiskId(riskId);
    setDrawerOpen(true);
  }

  if (!orgId) {
    return (
      <div className="mt-6 text-sm text-red-600">
        אין ארגון מחובר. <button className="underline" onClick={() => nav("/login")}>התחברי</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">ניהול סיכונים</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredRisks.length} סיכונים מוצגים
            {loading ? " • טוען..." : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => nav("/risks/new")}>+ סיכון חדש</Button>
          <Button variant="outline" onClick={() => console.log("export CSV")}>
            יצוא CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center rounded-xl border p-3">
        <div className="flex-1 min-w-[240px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש סיכונים..."
          />
        </div>

        {(classificationFilter || scoreFilter !== null || statusFilter) && (
          <div className="flex flex-wrap items-center gap-2">
            {classificationFilter && (
              <Badge variant="outline">סיווג: {toUiSeverity(classificationFilter)}</Badge>
            )}
            {scoreFilter !== null && (
              <Badge variant="outline">מדד: {scoreFilter}</Badge>
            )}
            {statusFilter && (
              <Badge variant="outline">סטטוס: {statusFilter}</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearUrlFilters}>
              נקה סינון
            </Button>
          </div>
        )}
      </div>

      <RiskTable
        risks={filteredRisks}
        onViewRisk={(riskId: string) => openRiskDrawer(riskId)}
        onEditRisk={(riskId: string) => nav(`/risks/${riskId}/edit`)}
      />

      <RiskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        riskId={selectedRiskId}
      />
    </div>
  );
}
