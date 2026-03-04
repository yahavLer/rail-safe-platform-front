import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userService } from "@/api/services/userService";
import type { UserBoundary } from "@/api/types";
import { riskService } from "@/api/services/riskService";
import { organizationService } from "@/api/services/organizationService";
import { getCurrentOrgId } from "@/api/config";
import type {
  RiskBoundary,
  RiskClassification,
  RiskStatus,
  CategoryBoundary,
} from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RiskTable } from "@/components/risks/RiskTable";

function toUiSeverity(c: RiskClassification) {
  switch (c) {
    case "EXTREME_RED":
      return "קריטי";
    case "HIGH_ACTION_ORANGE":
      return "גבוה - נדרש טיפול";
    case "TOLERABLE_YELLOW":
      return "בינוני - נסבל";
    case "NEGLIGIBLE_GREEN":
      return "נמוך - זניח";
  }
}

function toUiStatus(s: RiskStatus) {
  switch (s) {
    case "DRAFT":
      return "טיוטה";
    case "OPEN":
      return "פתוח";
    case "MITIGATION_PLANNED":
      return "תכנון מיטיגציה";
    case "IN_PROGRESS":
      return "בטיפול";
    case "CLOSED":
      return "נסגר";
  }
}

const isRiskClassification = (v: string): v is RiskClassification =>
  ["EXTREME_RED", "HIGH_ACTION_ORANGE", "TOLERABLE_YELLOW", "NEGLIGIBLE_GREEN"].includes(v);

const isRiskStatus = (v: string): v is RiskStatus =>
  ["OPEN", "MITIGATION_PLANNED", "IN_PROGRESS", "CLOSED", "DRAFT"].includes(v);

export default function RisksList() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const orgId = getCurrentOrgId();

  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryNameByCode, setCategoryNameByCode] = useState<Record<string, string>>({});

  // ✅ שורה מתרחבת במקום Drawer
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [classificationFilter, setClassificationFilter] = useState<RiskClassification | null>(null);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RiskStatus | null>(null);

  const [users, setUsers] = useState<UserBoundary[]>([]);

  const userLabelById = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      m[u.id] = full || u.email || u.id;
    });
    return m;
  }, [users]);
  useEffect(() => {
    const c = searchParams.get("classification");
    setClassificationFilter(c && isRiskClassification(c) ? c : null);

    const s = searchParams.get("score");
    const n = s ? Number(s) : NaN;
    setScoreFilter(Number.isFinite(n) ? n : null);

    const st = searchParams.get("status");
    setStatusFilter(st && isRiskStatus(st) ? st : null);
  }, [searchParams]);

  useEffect(() => {
    // אם מתנתקים/מתחברים לארגון אחר - סוגרים הרחבה
    setExpandedRiskId(null);

    if (!orgId) {
      setRisks([]);
      setCategoryNameByCode({});
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [risksRes, catsRes, usersRes] = await Promise.allSettled([
          riskService.list({ orgId }),
          organizationService.listCategories(orgId),
          userService.list({ orgId }),
        ]);

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value);
        } else {
          console.error("RisksList load users failed", usersRes.reason);
          setUsers([]);
        }

        if (risksRes.status === "fulfilled") {
          setRisks(risksRes.value);
        } else {
          console.error("RisksList load risks failed", risksRes.reason);
          setRisks([]);
        }

        if (catsRes.status === "fulfilled") {
          const categories = catsRes.value as CategoryBoundary[];
          const map = Object.fromEntries(categories.map((c) => [c.code, c.name]));
          setCategoryNameByCode(map);
        } else {
          console.error("RisksList load categories failed", catsRes.reason);
          setCategoryNameByCode({});
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const filteredRisks = useMemo(() => {
    let list = risks;

    if (classificationFilter) list = list.filter((r) => r.classification === classificationFilter);
    if (scoreFilter !== null) list = list.filter((r) => r.riskScore === scoreFilter);
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const catName = categoryNameByCode[r.categoryCode] ?? "";
      return (
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.categoryCode ?? "").toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [risks, search, classificationFilter, scoreFilter, statusFilter, categoryNameByCode]);

  function clearUrlFilters() {
    setSearchParams({});
  }

  function toggleExpand(riskId: string | null) {
    setExpandedRiskId(riskId);
  }

  if (!orgId) {
    return (
      <div className="mt-6 text-sm text-red-600">
        אין ארגון מחובר.{" "}
        <button className="underline" onClick={() => nav("/login")}>
          התחברי
        </button>
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
            {scoreFilter !== null && <Badge variant="outline">מדד: {scoreFilter}</Badge>}
            {statusFilter && <Badge variant="outline">סטטוס: {toUiStatus(statusFilter)}</Badge>}

            <Button variant="ghost" size="sm" onClick={clearUrlFilters}>
              נקה סינון
            </Button>
          </div>
        )}
      </div>

      <RiskTable
        orgId={orgId}
        risks={filteredRisks}
        categoryNameByCode={categoryNameByCode}
        userLabelById={userLabelById}
        expandedRiskId={expandedRiskId}
        onToggleExpand={toggleExpand}
        onEditRisk={(riskId) => nav(`/risks/${riskId}/edit`)}
        onRiskUpdated={(updated) =>
          setRisks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
      />
    </div>
  );
}