import { api } from '../config';
import type {
  TaskBoundary,
  CreateTaskBoundary,
  UpdateTaskBoundary,
  UpdateTaskStatusBoundary,
  TaskStatus,
} from '../types';

const BASE_PATH = '/api/tasks';

export interface TaskFilters {
  orgId: string;
  riskId?: string;
  assigneeUserId?: string;
  status?: TaskStatus;
}

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

export const taskService = {
  // CRUD
  create: (data: CreateTaskBoundary) =>
    api.post<TaskBoundary>(BASE_PATH, data),

  getById: (taskId: string) =>
    api.get<TaskBoundary>(`${BASE_PATH}/${taskId}`),

  list: (filters: TaskFilters) =>
    api.get<TaskBoundary[]>(`${BASE_PATH}?${buildQueryString(filters)}`),

  update: (taskId: string, data: UpdateTaskBoundary) =>
    api.patch<TaskBoundary>(`${BASE_PATH}/${taskId}`, data),

  updateStatus: (taskId: string, data: UpdateTaskStatusBoundary) =>
    api.patch<TaskBoundary>(`${BASE_PATH}/${taskId}/status`, data),

  updateAssignee: (taskId: string, assigneeUserId: string) =>
    api.patch<TaskBoundary>(`${BASE_PATH}/${taskId}/assignee/${assigneeUserId}`, {}),

  delete: (taskId: string) =>
    api.delete<void>(`${BASE_PATH}/${taskId}`),

  // Stats
  countByStatus: (orgId: string) =>
    api.get<Record<TaskStatus, number>>(`${BASE_PATH}/stats/by-status?orgId=${orgId}`),
};
