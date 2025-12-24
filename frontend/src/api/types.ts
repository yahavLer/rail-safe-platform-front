// Types matching your Spring Boot backend boundaries

// ============ Enums ============
export type RiskStatus = 'NEW' | 'IN_TREATMENT' | 'MITIGATED' | 'CLOSED' | 'ACCEPTED';
export type RiskClassification = 'EXTREME_RED' | 'HIGH_ORANGE' | 'MEDIUM_YELLOW' | 'LOW_GREEN';
export type TaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'RISK_MANAGER';

// ============ Organization Boundaries ============
export interface CreateOrganizationBoundary {
  name: string;
  description?: string;
}

export interface OrganizationBoundary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LevelDefinitionBoundary {
  level: number;
  name: string;
  description: string;
}

export interface RiskMatrixBoundary {
  orgId: string;
  frequencyLevels: LevelDefinitionBoundary[];
  severityLevels: LevelDefinitionBoundary[];
}

export interface UpdateDescriptionBoundary {
  description: string;
}

export interface CategoryBoundary {
  id: string;
  orgId: string;
  code: string;
  name: string;
  description?: string;
}

export interface CreateCategoryBoundary {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryBoundary {
  name?: string;
  description?: string;
}

// ============ Risk Boundaries ============
export interface CreateRiskBoundary {
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  categoryCode?: string;
  title: string;
  description?: string;
  frequency: number; // 1-4
  severity: number;  // 1-4
  riskManagerUserId?: string;
  locationLat?: number;
  locationLng?: number;
  siteName?: string;
  imageUrl?: string;
}

export interface RiskBoundary {
  id: string;
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  categoryCode?: string;
  title: string;
  description?: string;
  frequency: number;
  severity: number;
  score: number; // frequency * severity
  classification: RiskClassification;
  status: RiskStatus;
  riskManagerUserId?: string;
  locationLat?: number;
  locationLng?: number;
  siteName?: string;
  imageUrl?: string;
  aiLikelihood?: number;
  aiDescription?: string;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRiskBoundary {
  title?: string;
  description?: string;
  frequency?: number;
  severity?: number;
  categoryCode?: string;
  riskManagerUserId?: string;
  locationLat?: number;
  locationLng?: number;
  siteName?: string;
  imageUrl?: string;
}

export interface UpdateRiskStatusBoundary {
  status: RiskStatus;
}

// ============ Task Boundaries ============
export interface CreateTaskBoundary {
  orgId: string;
  riskId: string;
  title: string;
  description?: string;
  assigneeUserId?: string;
  dueDate?: string;
}

export interface TaskBoundary {
  id: string;
  orgId: string;
  riskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeUserId?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskBoundary {
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTaskStatusBoundary {
  status: TaskStatus;
}

// ============ User Boundaries ============
export interface CreateUserBoundary {
  externalAuthId: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
}

export interface UserBoundary {
  id: string;
  externalAuthId: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserBoundary {
  email?: string;
  fullName?: string;
}

export interface UpdateRoleBoundary {
  role: UserRole;
}

export interface AssignOrgUnitBoundary {
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
}

// ============ Stats ============
export interface RiskStats {
  byStatus: Record<RiskStatus, number>;
  byClassification: Record<RiskClassification, number>;
}

export interface TaskStats {
  byStatus: Record<TaskStatus, number>;
}
