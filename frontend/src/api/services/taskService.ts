// src/api/services/taskService.ts
import { taskHttp } from "../http";
import type {
  TaskBoundary,
  CreateTaskBoundary,
  UpdateTaskBoundary,
  UpdateTaskStatusBoundary,
  TaskStatus,
} from "../types";

const BASE_PATH = "/api/tasks";

export interface TaskFilters {
  orgId: string; // ✅ היה orgId
  riskId?: string;
  assigneeUserId?: string;
  status?: TaskStatus;
}

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

export const taskService = {
  create: async (data: CreateTaskBoundary) =>
    (await taskHttp.post<TaskBoundary>(BASE_PATH, data)).data,

  getById: async (taskId: string) =>
    (await taskHttp.get<TaskBoundary>(`${BASE_PATH}/${taskId}`)).data,

  list: async (filters: TaskFilters) =>
    (await taskHttp.get<TaskBoundary[]>(`${BASE_PATH}?${buildQueryString(filters)}`)).data,

  update: async (taskId: string, data: UpdateTaskBoundary) =>
    (await taskHttp.patch<TaskBoundary>(`${BASE_PATH}/${taskId}`, data)).data,

  updateStatus: async (taskId: string, data: UpdateTaskStatusBoundary) =>
    (await taskHttp.patch<TaskBoundary>(`${BASE_PATH}/${taskId}/status`, data)).data,

  updateAssignee: async (taskId: string, assigneeUserId: string) =>
    (await taskHttp.patch<TaskBoundary>(`${BASE_PATH}/${taskId}/assignee/${assigneeUserId}`, {})).data,

  delete: async (taskId: string) =>
    (await taskHttp.delete<void>(`${BASE_PATH}/${taskId}`)).data,

  countByStatus: async (orgId: string) =>
    (await taskHttp.get<Record<TaskStatus, number>>(
      `${BASE_PATH}/stats/by-status?orgId=${orgId}`
    )).data,
};
