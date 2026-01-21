// src/api/services/userService.ts
import { userHttp } from "../http";
import type {
  UserBoundary,
  CreateUserBoundary,
  UpdateUserBoundary,
  UpdateRoleBoundary,
  AssignOrgUnitBoundary,
} from "../types";

const BASE_PATH = "/api/users";

export const userService = {
  create: async (data: CreateUserBoundary) =>
    (await userHttp.post<UserBoundary>(BASE_PATH, data)).data,

  getById: async (id: string) =>
    (await userHttp.get<UserBoundary>(`${BASE_PATH}/${id}`)).data,

  getByExternalAuthId: async (externalAuthId: string) =>
    (await userHttp.get<UserBoundary>(`${BASE_PATH}/by-external/${externalAuthId}`)).data,

  list: async (params?: { orgId?: string; divisionId?: string; departmentId?: string }) =>
    (await userHttp.get<UserBoundary[]>(BASE_PATH, { params })).data,

  update: async (id: string, data: UpdateUserBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}`, data)).data,

  updateRole: async (id: string, data: UpdateRoleBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}/role`, data)).data,

  assignOrgUnit: async (id: string, data: AssignOrgUnitBoundary) =>
    (await userHttp.patch<UserBoundary>(`${BASE_PATH}/${id}/org-unit`, data)).data,

  delete: async (id: string) =>
    (await userHttp.delete<void>(`${BASE_PATH}/${id}`)).data,
};
