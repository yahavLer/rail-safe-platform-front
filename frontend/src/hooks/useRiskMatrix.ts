import { useEffect, useMemo, useState } from "react";
import { organizationService } from "@/api/services/organizationService";
import type { RiskMatrixBoundary, LevelDefinitionBoundary } from "@/api/types";

type LevelMap = Record<number, LevelDefinitionBoundary>;

function toMap(levels: LevelDefinitionBoundary[]): LevelMap {
  const map: LevelMap = {};
  for (const l of levels) {
    map[l.level] = l;
  }
  return map;
}

export function useRiskMatrix(orgId?: string) {
  const [matrix, setMatrix] = useState<RiskMatrixBoundary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    organizationService
      .getRiskMatrix(orgId)
      .then(setMatrix)
      .catch((e) =>
        setError(e?.response?.data?.message || e?.message || "Failed to load risk matrix")
      )
      .finally(() => setLoading(false));
  }, [orgId]);

  const frequencyMap = useMemo<LevelMap>(
    () => (matrix ? toMap(matrix.frequencyLevels) : ({} as LevelMap)),
    [matrix]
  );

  const severityMap = useMemo<LevelMap>(
    () => (matrix ? toMap(matrix.severityLevels) : ({} as LevelMap)),
    [matrix]
  );

  return { matrix, frequencyMap, severityMap, loading, error };
}
