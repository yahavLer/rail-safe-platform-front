import { riskHttp } from "../http"; 
import type {
  RiskBoundary,
  CreateRiskBoundary,
  UpdateRiskBoundary,
  UpdateRiskStatusBoundary,
  RiskStatus,
  RiskClassification,
} from "../types";

const BASE_PATH = "/api/risks";

export interface RiskFilters {
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;
  categoryCode?: string;
  status?: RiskStatus;
  classification?: RiskClassification;
  minScore?: number;
  maxScore?: number;
}

function buildQueryString(filters: RiskFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

export const riskService = {
  // CRUD
  create: async (data: CreateRiskBoundary) =>
    (await riskHttp.post<RiskBoundary>(BASE_PATH, data)).data,

  getById: async (riskId: string) =>
    (await riskHttp.get<RiskBoundary>(`${BASE_PATH}/${riskId}`)).data,

  list: async (filters: RiskFilters) =>
    (await riskHttp.get<RiskBoundary[]>(`${BASE_PATH}?${buildQueryString(filters)}`)).data,

  update: async (riskId: string, data: UpdateRiskBoundary) =>
    (await riskHttp.patch<RiskBoundary>(`${BASE_PATH}/${riskId}`, data)).data,

  updateStatus: async (riskId: string, data: UpdateRiskStatusBoundary) =>
    (await riskHttp.patch<RiskBoundary>(`${BASE_PATH}/${riskId}/status`, data)).data,

  delete: async (riskId: string) =>
    (await riskHttp.delete<void>(`${BASE_PATH}/${riskId}`)).data,

  // Stats
  countByStatus: async (orgId: string) =>
    (await riskHttp.get<Record<RiskStatus, number>>(`${BASE_PATH}/stats/by-status?orgId=${orgId}`)).data,

  countByClassification: async (orgId: string) =>
    (await riskHttp.get<Record<RiskClassification, number>>(`${BASE_PATH}/stats/by-classification?orgId=${orgId}`)).data,
};
