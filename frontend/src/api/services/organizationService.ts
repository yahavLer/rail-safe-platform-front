import { api } from '../config';
import type {
  OrganizationBoundary,
  CreateOrganizationBoundary,
  RiskMatrixBoundary,
  LevelDefinitionBoundary,
  UpdateDescriptionBoundary,
  CategoryBoundary,
  CreateCategoryBoundary,
  UpdateCategoryBoundary,
} from '../types';

const BASE_PATH = '/api/organizations';

export const organizationService = {
  // Organization CRUD
  create: (data: CreateOrganizationBoundary) =>
    api.post<OrganizationBoundary>(`${BASE_PATH}/create`, data),

  getById: (orgId: string) =>
    api.get<OrganizationBoundary>(`${BASE_PATH}/${orgId}`),

  // Risk Matrix
  getRiskMatrix: (orgId: string) =>
    api.get<RiskMatrixBoundary>(`${BASE_PATH}/${orgId}/risk-matrix`),

  updateFrequencyDescription: (orgId: string, level: number, data: UpdateDescriptionBoundary) =>
    api.patch<LevelDefinitionBoundary>(
      `${BASE_PATH}/${orgId}/risk-matrix/frequency/${level}`,
      data
    ),

  updateSeverityDescription: (orgId: string, level: number, data: UpdateDescriptionBoundary) =>
    api.patch<LevelDefinitionBoundary>(
      `${BASE_PATH}/${orgId}/risk-matrix/severity/${level}`,
      data
    ),

  // Categories
  createCategory: (orgId: string, data: CreateCategoryBoundary) =>
    api.post<CategoryBoundary>(`${BASE_PATH}/${orgId}/categories`, data),

  listCategories: (orgId: string) =>
    api.get<CategoryBoundary[]>(`${BASE_PATH}/${orgId}/categories`),

  updateCategory: (orgId: string, categoryId: string, data: UpdateCategoryBoundary) =>
    api.patch<CategoryBoundary>(`${BASE_PATH}/${orgId}/categories/${categoryId}`, data),

  deleteCategory: (orgId: string, categoryId: string) =>
    api.delete<void>(`${BASE_PATH}/${orgId}/categories/${categoryId}`),
};
