import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { riskService } from "@/api/services/riskService";
import { DEFAULT_ORG_ID } from "@/api/config";
import type { RiskBoundary, RiskClassification } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskDrawer } from "@/components/risks/RiskDrawer";

// אם יש לך כבר רכיבים קיימים לפילטרים/טבלה – תשאירי אותם במקום,
// המטרה פה: להחזיר layout + להוסיף Drawer בלי לשבור.
import { RiskTable } from "@/components/risks/RiskTable"; // <-- אם זה השם אצלך

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

  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [loading, setLoading] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  // פילטרים בסיסיים (אם כבר יש לך פילטרים קיימים – תשאירי את שלך)
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!DEFAULT_ORG_ID) return;

    (async () => {
      setLoading(true);
      try {
        const data = await riskService.list({ orgId: DEFAULT_ORG_ID });
        setRisks(data);
      } catch (e) {
        console.error("RisksList load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRisks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return risks;
    return risks.filter(r =>
      (r.title ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q) ||
      (r.categoryCode ?? "").toLowerCase().includes(q)
    );
  }, [risks, search]);

  function openRiskDrawer(riskId: string) {
    setSelectedRiskId(riskId);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Header + Actions כמו בתמונה */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">ניהול סיכונים</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredRisks.length} סיכונים מוצגים
            {loading ? " • טוען..." : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => nav("/risks/new")}>
            + סיכון חדש
          </Button>

          <Button variant="outline" onClick={() => {
            // אם יש לך כבר export קיים – השאירי אותו
            // כאן רק placeholder
            console.log("export CSV");
          }}>
            יצוא CSV
          </Button>
        </div>
      </div>

      {/* Filters Row כמו בתמונה */}
      <div className="flex flex-wrap gap-2 items-center rounded-xl border p-3">
        {/* אם יש לך Select-ים קיימים, פשוט תחזירי אותם כאן */}
        <div className="flex-1 min-w-[240px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש סיכונים..."
          />
        </div>
      </div>

      {/* Table */}
      <RiskTable
        risks={filteredRisks}
        onViewRisk={(riskId: string) => openRiskDrawer(riskId)}
        onEditRisk={(riskId: string) => nav(`/risks/${riskId}/edit`)}
      />
      
      {/* Drawer */}
      <RiskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        riskId={selectedRiskId}
      />
    </div>
  );
}
