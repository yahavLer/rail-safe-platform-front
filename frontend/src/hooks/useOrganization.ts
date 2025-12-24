import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/api/services/organizationService';
import type { CreateCategoryBoundary, UpdateCategoryBoundary, UpdateDescriptionBoundary } from '@/api/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const orgKeys = {
  all: ['organizations'] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  detail: (id: string) => [...orgKeys.details(), id] as const,
  matrix: (id: string) => [...orgKeys.all, 'matrix', id] as const,
  categories: (id: string) => [...orgKeys.all, 'categories', id] as const,
};

// Fetch organization
export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: orgKeys.detail(orgId),
    queryFn: () => organizationService.getById(orgId),
    enabled: !!orgId,
  });
}

// Fetch risk matrix
export function useRiskMatrix(orgId: string) {
  return useQuery({
    queryKey: orgKeys.matrix(orgId),
    queryFn: () => organizationService.getRiskMatrix(orgId),
    enabled: !!orgId,
  });
}

// Fetch categories
export function useCategories(orgId: string) {
  return useQuery({
    queryKey: orgKeys.categories(orgId),
    queryFn: () => organizationService.listCategories(orgId),
    enabled: !!orgId,
  });
}

// Update frequency description
export function useUpdateFrequencyDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, level, data }: { orgId: string; level: number; data: UpdateDescriptionBoundary }) =>
      organizationService.updateFrequencyDescription(orgId, level, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.matrix(orgId) });
      toast({
        title: 'התדירות עודכנה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון התדירות',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update severity description
export function useUpdateSeverityDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, level, data }: { orgId: string; level: number; data: UpdateDescriptionBoundary }) =>
      organizationService.updateSeverityDescription(orgId, level, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.matrix(orgId) });
      toast({
        title: 'החומרה עודכנה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון החומרה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: CreateCategoryBoundary }) =>
      organizationService.createCategory(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.categories(orgId) });
      toast({
        title: 'הקטגוריה נוצרה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה ביצירת הקטגוריה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, categoryId, data }: { orgId: string; categoryId: string; data: UpdateCategoryBoundary }) =>
      organizationService.updateCategory(orgId, categoryId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.categories(orgId) });
      toast({
        title: 'הקטגוריה עודכנה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון הקטגוריה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, categoryId }: { orgId: string; categoryId: string }) =>
      organizationService.deleteCategory(orgId, categoryId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.categories(orgId) });
      toast({
        title: 'הקטגוריה נמחקה בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה במחיקת הקטגוריה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
