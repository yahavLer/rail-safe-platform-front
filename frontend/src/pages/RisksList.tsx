import { useEffect, useMemo, useState } from "react";
import { riskService } from "@/api/services/riskService";
import { DEFAULT_ORG_ID } from "@/api/config";
import type { RiskBoundary } from "@/api/types";

export default function RisksList() {
  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [loading, setLoading] = useState(false);

  // filters שלך נשארים כמו שהם

  useEffect(() => {
    if (!DEFAULT_ORG_ID) return;

    (async () => {
      setLoading(true);
      try {
        const data = await riskService.list({ orgId: DEFAULT_ORG_ID });
        setRisks(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRisks = useMemo(() => {
    // אם את רוצה להתחיל פשוט:
    // תעשי פילטרים על risks במקום mockRisks
    return risks.filter((r) => {
      // התאימי לפי הפילטרים שלך
      return true;
    });
  }, [risks /* +filters */]);

  // RiskTable כרגע כנראה מצפה לשדות של mock (likelihood/impact וכו’)
  // אז או שמעדכנים את RiskTable לקבל RiskBoundary, או עושים mapping (מוסבר בסעיף 5)
}
