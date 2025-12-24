import { api } from '../config';
import type {
  RiskBoundary,
  CreateRiskBoundary,
  UpdateRiskBoundary,
  UpdateRiskStatusBoundary,
  RiskStatus,
  RiskClassification,
} from '../types';

const BASE_PATH = '/api/risks';

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
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

export const riskService = {
  // CRUD
  create: (data: CreateRiskBoundary) =>
    api.post<RiskBoundary>(BASE_PATH, data),

  getById: (riskId: string) =>
    api.get<RiskBoundary>(`${BASE_PATH}/${riskId}`),

  list: (filters: RiskFilters) =>
    api.get<RiskBoundary[]>(`${BASE_PATH}?${buildQueryString(filters)}`),

  update: (riskId: string, data: UpdateRiskBoundary) =>
    api.patch<RiskBoundary>(`${BASE_PATH}/${riskId}`, data),

  updateStatus: (riskId: string, data: UpdateRiskStatusBoundary) =>
    api.patch<RiskBoundary>(`${BASE_PATH}/${riskId}/status`, data),

  delete: (riskId: string) =>
    api.delete<void>(`${BASE_PATH}/${riskId}`),

  // Stats
  countByStatus: (orgId: string) =>
    api.get<Record<RiskStatus, number>>(`${BASE_PATH}/stats/by-status?orgId=${orgId}`),

  countByClassification: (orgId: string) =>
    api.get<Record<RiskClassification, number>>(`${BASE_PATH}/stats/by-classification?orgId=${orgId}`),
};
