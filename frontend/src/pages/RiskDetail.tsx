import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { riskService } from "@/api/services/riskService";
import { DEFAULT_ORG_ID } from "@/api/config";
import type { RiskBoundary } from "@/api/types";

export default function RiskDetail() {
  const { id } = useParams();
  const [risk, setRisk] = useState<RiskBoundary | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await riskService.getById(id);
      setRisk(data);
    })();
  }, [id]);

  // אם risk null -> טעינה/לא נמצא
}
