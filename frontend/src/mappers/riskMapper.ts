// src/api/mappers/riskMapper.ts
import type { RiskBoundary, RiskClassification, RiskStatus } from "@/api/types";

export type UiRiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type UiRiskStatus = "NEW" | "IN_PROGRESS" | "MITIGATED" | "CLOSED";

export type UiRisk = {
  id: string;
  title: string;
  description?: string;

  categoryCode?: string;
  category?: string;

  likelihood: number;
  impact: number;
  score: number;

  severity: UiRiskSeverity;
  status: UiRiskStatus;

  siteName?: string;
  createdAt: string;
  updatedAt: string;
};

function mapClassificationToSeverity(classification: RiskClassification | undefined): UiRiskSeverity {
  switch (classification) {
    case "EXTREME_RED": return "CRITICAL";
    case "HIGH_ORANGE": return "HIGH";
    case "MEDIUM_YELLOW": return "MEDIUM";
    case "LOW_GREEN":
    default: return "LOW";
  }
}

function mapStatusToUi(status: RiskStatus | undefined): UiRiskStatus {
  switch (status) {
    case "IN_TREATMENT": return "IN_PROGRESS";
    case "MITIGATED": return "MITIGATED";
    case "CLOSED": return "CLOSED";
    case "ACCEPTED": return "CLOSED"; // 👈 כדי לא לשבור UI
    case "NEW":
    default: return "NEW";
  }
}

export function mapRiskBoundaryToUi(
  r: RiskBoundary,
  categoryNameByCode?: Record<string, string>
): UiRisk {
  const code = r.categoryCode || undefined;

  return {
    id: String(r.id),
    title: r.title,
    description: r.description || undefined,

    categoryCode: code,
    category: code ? (categoryNameByCode?.[code] ?? code) : undefined,

    likelihood: r.frequencyLevel,
    impact: r.severityLevel,
    score: r.riskScore,

    severity: mapClassificationToSeverity(r.classification),
    status: mapStatusToUi(r.status),

    siteName: r.location || undefined,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}
