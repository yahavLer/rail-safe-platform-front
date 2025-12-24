import { api } from '../config';
import type {
  UserBoundary,
  CreateUserBoundary,
  UpdateUserBoundary,
  UpdateRoleBoundary,
  AssignOrgUnitBoundary,
} from '../types';

const BASE_PATH = '/api/users';

export interface UserFilters {
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
}

function buildQueryString(filters: UserFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

export const userService = {
  // CRUD
  create: (data: CreateUserBoundary) =>
    api.post<UserBoundary>(BASE_PATH, data),

  getById: (id: string) =>
    api.get<UserBoundary>(`${BASE_PATH}/${id}`),

  getByExternalAuthId: (externalAuthId: string) =>
    api.get<UserBoundary>(`${BASE_PATH}/by-external/${externalAuthId}`),

  list: (filters: UserFilters = {}) => {
    const queryString = buildQueryString(filters);
    const endpoint = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;
    return api.get<UserBoundary[]>(endpoint);
  },

  update: (id: string, data: UpdateUserBoundary) =>
    api.patch<UserBoundary>(`${BASE_PATH}/${id}`, data),

  updateRole: (id: string, data: UpdateRoleBoundary) =>
    api.patch<UserBoundary>(`${BASE_PATH}/${id}/role`, data),

  assignOrgUnit: (id: string, data: AssignOrgUnitBoundary) =>
    api.patch<UserBoundary>(`${BASE_PATH}/${id}/org-unit`, data),

  delete: (id: string) =>
    api.delete<void>(`${BASE_PATH}/${id}`),
};
