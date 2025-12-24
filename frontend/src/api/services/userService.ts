import { userHttp } from "../http"; // תתאימי נתיב לפי המיקום האמיתי של http.ts
import type {
  UserBoundary,
  CreateUserBoundary,
  UpdateUserBoundary,
  UpdateRoleBoundary,
  AssignOrgUnitBoundary,
} from "../types";

const BASE_PATH = "/api/users";

export interface UserFilters {
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
}

function buildQueryString(filters: UserFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

export const userService = {
  // CRUD
  create: async (data: CreateUserBoundary) =>
    (await userHttp.post<UserBoundary>(BASE_PATH, data)).data,

  getById: async (id: string) =>
    (await userHttp.get<UserBoundary>(`${BASE_PATH}/${id}`)).data,

  getByExternalAuthId: async (externalAuthId: string) =>
    (await userHttp.get<UserBoundary>(`${BASE_PATH}/by-external/${externalAuthId}`)).data,

  list: async (filters: UserFilters = {}) => {
    const queryString = buildQueryString(filters);
    const endpoint = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;
    return (await userHttp.get<UserBoundary[]>(endpoint)).data;
  },

  update: async (id: string, data: UpdateUserBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}`, data)).data,

  updateRole: async (id: string, data: UpdateRoleBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}/role`, data)).data,

  assignOrgUnit: async (id: string, data: AssignOrgUnitBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}/org-unit`, data)).data,

  delete: async (id: string) =>
    (await userHttp.delete<void>(`${BASE_PATH}/${id}`)).data,
};
