import { orgHttp } from "../http";
import type {
  OrganizationBoundary,
  CreateOrganizationBoundary,
  RiskMatrixBoundary,
  LevelDefinitionBoundary,
  UpdateDescriptionBoundary,
  CategoryBoundary,
  CreateCategoryBoundary,
  UpdateCategoryBoundary,
} from "../types";

const BASE_PATH = "/api/organizations";

export const organizationService = {
  // Organization CRUD
  create: async (data: CreateOrganizationBoundary) =>
    (await orgHttp.post<OrganizationBoundary>(`${BASE_PATH}/create`, data)).data,

  getById: async (orgId: string) =>
    (await orgHttp.get<OrganizationBoundary>(`${BASE_PATH}/${orgId}`)).data,

  // Risk Matrix
  getRiskMatrix: async (orgId: string) =>
    (await orgHttp.get<RiskMatrixBoundary>(`${BASE_PATH}/${orgId}/risk-matrix`)).data,

  updateFrequencyDescription: async (
    orgId: string,
    level: number,
    data: UpdateDescriptionBoundary
  ) =>
    (await orgHttp.patch<LevelDefinitionBoundary>(
      `${BASE_PATH}/${orgId}/risk-matrix/frequency/${level}`,
      data
    )).data,

  updateSeverityDescription: async (
    orgId: string,
    level: number,
    data: UpdateDescriptionBoundary
  ) =>
    (await orgHttp.patch<LevelDefinitionBoundary>(
      `${BASE_PATH}/${orgId}/risk-matrix/severity/${level}`,
      data
    )).data,

  // Categories
  createCategory: async (orgId: string, data: CreateCategoryBoundary) =>
    (await orgHttp.post<CategoryBoundary>(`${BASE_PATH}/${orgId}/categories`, data)).data,

  listCategories: async (orgId: string) =>
    (await orgHttp.get<CategoryBoundary[]>(`${BASE_PATH}/${orgId}/categories`)).data,

  updateCategory: async (orgId: string, categoryId: string, data: UpdateCategoryBoundary) =>
    (await orgHttp.patch<CategoryBoundary>(
      `${BASE_PATH}/${orgId}/categories/${categoryId}`,
      data
    )).data,

  deleteCategory: async (orgId: string, categoryId: string) =>
    (await orgHttp.delete<void>(`${BASE_PATH}/${orgId}/categories/${categoryId}`)).data,

  bootstrapOrg: async (orgId: string) => {
    const [org, matrix, categories] = await Promise.all([
      organizationService.getById(orgId),
      organizationService.getRiskMatrix(orgId),
      organizationService.listCategories(orgId),
    ]);

    return { org, matrix, categories };
  },
  
  listOrganizations: async () =>
  (await orgHttp.get<OrganizationBoundary[]>(`${BASE_PATH}`)).data,
};
