import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskService, type RiskFilters } from '@/api/services/riskService';
import type { CreateRiskBoundary, UpdateRiskBoundary, UpdateRiskStatusBoundary } from '@/api/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const riskKeys = {
  all: ['risks'] as const,
  lists: () => [...riskKeys.all, 'list'] as const,
  list: (filters: RiskFilters) => [...riskKeys.lists(), filters] as const,
  details: () => [...riskKeys.all, 'detail'] as const,
  detail: (id: string) => [...riskKeys.details(), id] as const,
  stats: (orgId: string) => [...riskKeys.all, 'stats', orgId] as const,
};

// Fetch risks list
export function useRisks(filters: RiskFilters) {
  return useQuery({
    queryKey: riskKeys.list(filters),
    queryFn: () => riskService.list(filters),
    enabled: !!filters.orgId,
  });
}

// Fetch single risk
export function useRisk(riskId: string) {
  return useQuery({
    queryKey: riskKeys.detail(riskId),
    queryFn: () => riskService.getById(riskId),
    enabled: !!riskId,
  });
}

// Fetch risk stats
export function useRiskStats(orgId: string) {
  const statusQuery = useQuery({
    queryKey: [...riskKeys.stats(orgId), 'status'],
    queryFn: () => riskService.countByStatus(orgId),
    enabled: !!orgId,
  });

  const classificationQuery = useQuery({
    queryKey: [...riskKeys.stats(orgId), 'classification'],
    queryFn: () => riskService.countByClassification(orgId),
    enabled: !!orgId,
  });

  return {
    byStatus: statusQuery.data,
    byClassification: classificationQuery.data,
    isLoading: statusQuery.isLoading || classificationQuery.isLoading,
    error: statusQuery.error || classificationQuery.error,
  };
}

// Create risk mutation
export function useCreateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRiskBoundary) => riskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all });
      toast({
        title: 'הסיכון נוצר בהצלחה',
        description: 'הסיכון החדש נוסף למערכת',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה ביצירת הסיכון',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update risk mutation
export function useUpdateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: UpdateRiskBoundary }) =>
      riskService.update(riskId, data),
    onSuccess: (_, { riskId }) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(riskId) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      toast({
        title: 'הסיכון עודכן בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון הסיכון',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update risk status mutation
export function useUpdateRiskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: UpdateRiskStatusBoundary }) =>
      riskService.updateStatus(riskId, data),
    onSuccess: (_, { riskId }) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(riskId) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      toast({
        title: 'סטטוס הסיכון עודכן',
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

// Delete risk mutation
export function useDeleteRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (riskId: string) => riskService.delete(riskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all });
      toast({
        title: 'הסיכון נמחק בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה במחיקת הסיכון',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
