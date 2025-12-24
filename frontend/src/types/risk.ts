export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskStatus = 'NEW' | 'IN_PROGRESS' | 'MITIGATED' | 'CLOSED';
export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number; // 1-4
  impact: number; // 1-4
  score: number; // likelihood * impact
  severity: RiskSeverity;
  status: RiskStatus;
  locationLat?: number;
  locationLng?: number;
  siteName?: string;
  imageUrl?: string;
  aiLikelihood?: number;
  aiDescription?: string;
  aiConfidence?: number;
  aiProcessedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  slaStatus?: 'ON_TIME' | 'AT_RISK' | 'OVERDUE';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatrixSettings {
  id: string;
  minScore: number;
  maxScore: number;
  severityLevel: RiskSeverity;
  colorCode: string;
  description: string;
}

export interface Control {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface DashboardStats {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  inProgressRisks: number;
  overdueRisks: number;
  mitigatedThisMonth: number;
}

export const CATEGORIES = [
  'תשתיות/מסילה',
  'תשתיות/חשמל',
  'תשתיות/איתות',
  'רכבים/קרונות',
  'רכבים/קטרים',
  'תפעול/נהלים',
  'תפעול/הדרכה',
  'סביבה/מזג אוויר',
  'סביבה/צמחייה',
  'אבטחה/פריצה',
] as const;

export const LIKELIHOOD_LABELS = {
  1: 'נדיר',
  2: 'אפשרי',
  3: 'סביר',
  4: 'כמעט ודאי',
} as const;

export const IMPACT_LABELS = {
  1: 'זניח',
  2: 'קל',
  3: 'משמעותי',
  4: 'קטסטרופלי',
} as const;

export const STATUS_LABELS: Record<RiskStatus, string> = {
  NEW: 'חדש',
  IN_PROGRESS: 'בטיפול',
  MITIGATED: 'הופחת',
  CLOSED: 'נסגר',
};

export const SEVERITY_LABELS: Record<RiskSeverity, string> = {
  CRITICAL: 'קריטי',
  HIGH: 'גבוה',
  MEDIUM: 'בינוני',
  LOW: 'נמוך',
};

export function calculateSeverity(score: number): RiskSeverity {
  if (score >= 12) return 'CRITICAL';
  if (score >= 8) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

export function calculateScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}
