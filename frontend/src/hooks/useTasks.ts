import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, type TaskFilters } from '@/api/services/taskService';
import type { CreateTaskBoundary, UpdateTaskBoundary, UpdateTaskStatusBoundary } from '@/api/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: (orgId: string) => [...taskKeys.all, 'stats', orgId] as const,
};

// Fetch tasks list
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskService.list(filters),
    enabled: !!filters.orgId,
  });
}

// Fetch single task
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskService.getById(taskId),
    enabled: !!taskId,
  });
}

// Fetch task stats
export function useTaskStats(orgId: string) {
  return useQuery({
    queryKey: taskKeys.stats(orgId),
    queryFn: () => taskService.countByStatus(orgId),
    enabled: !!orgId,
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskBoundary) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast({
        title: 'המשימה נוצרה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה ביצירת המשימה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskBoundary }) =>
      taskService.update(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast({
        title: 'המשימה עודכנה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון המשימה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update task status mutation
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskStatusBoundary }) =>
      taskService.updateStatus(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast({
        title: 'סטטוס המשימה עודכן',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון הסטטוס',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update assignee mutation
export function useUpdateTaskAssignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeUserId }: { taskId: string; assigneeUserId: string }) =>
      taskService.updateAssignee(taskId, assigneeUserId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast({
        title: 'האחראי עודכן בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון האחראי',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast({
        title: 'המשימה נמחקה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה במחיקת המשימה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
