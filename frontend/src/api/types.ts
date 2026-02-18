// Types matching your Spring Boot backend boundaries

// ============ Enums ============
export type RiskStatus =
  | "OPEN"
  | "MITIGATION_PLANNED"
  | "IN_PROGRESS"
  | "CLOSED"
  | "DRAFT";

export type RiskClassification =
  | "EXTREME_RED"
  | "HIGH_ACTION_ORANGE"
  | "TOLERABLE_YELLOW"
  | "NEGLIGIBLE_GREEN";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELED";

export type UserRole =
  | "CHIEF_RISK_MANAGER"
  | "DIVISION_RISK_MANAGER"
  | "DEPARTMENT_RISK_MANAGER"
  | "EMPLOYEE";

// ============ Organization Boundaries ============
export interface CreateOrganizationBoundary {
  name: string;
 // description?: string;
  password: string;
}

export interface OrganizationBoundary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LevelDefinitionBoundary {
  level: number; // 1-4
  label: string; // e.g., "נדיר", "מזערי"
  description: string;
}

export interface RiskMatrixBoundary {
 // orgId: string;
  frequencyLevels: LevelDefinitionBoundary[];
  severityLevels: LevelDefinitionBoundary[];
}

export interface UpdateDescriptionBoundary {
  description: string;
}

export interface CategoryBoundary {
  id: string;
  code: string; // e.g., "GH1"
  name: string; // e.g., "חשמל"
  displayOrder: number;
  active: boolean;
}

export interface CreateCategoryBoundary {
  code: string;
  name: string;
//  description?: string;
  //displayOrder: number;
}

export interface UpdateCategoryBoundary {
  name?: string;
  displayOrder?: number;
  active?: boolean;
}

// ============ Risk Boundaries ============
export interface CreateRiskBoundary {
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;

  title: string;
  categoryCode: string;
  description?: string;

  severityLevel: number;   // 1-4
  frequencyLevel: number;  // 1-4

  location?: string;
  notes?: string;
}

export interface RiskBoundary {
  id: string;
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;

  title: string;
  categoryCode: string;
  description?: string;

  severityLevel: number;
  frequencyLevel: number;

  riskScore: number;
  classification: RiskClassification;
  status: RiskStatus;

  location?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;

  severityAfter?: number;
  frequencyAfter?: number;
  scoreAfter?: number;
  classificationAfter?: RiskClassification;
}


export interface UpdateRiskBoundary {
  title?: string;
  description?: string;
  frequencyLevel?: number;
  severityLevel?: number;
  categoryCode?: string;
  riskManagerUserId?: string;
  location?: string;
  notes?: string;
}

export interface UpdateRiskStatusBoundary {
  status: RiskStatus;
}

// ============ Task Boundaries ============
export interface CreateTaskBoundary {
  orgId: string;   
  riskId: string;
  title: string;
  description: string;      
  assigneeUserId?: string;
  dueDate?: string;
}

export interface TaskBoundary {
  id: string;
  orgId: string;   
  riskId: string;
  title: string;
  description: string;      
  status: TaskStatus;
  assigneeUserId?: string;
  dueDate?: string;
  completedAt?: string;     // אם אין בבאק כרגע - אפשר להשאיר, לא שובר
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
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
  password: string;
}

export interface UserBoundary {
  id: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId?: string;
  divisionId?: string;
  departmentId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserBoundary {
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
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
export interface LoginRequest {
  orgId: string;
  email: string;
  password: string;
}
