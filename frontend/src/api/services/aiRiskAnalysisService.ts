import { imageHttp } from "../http";
export type AnalysisStatus =
  | "DRAFT_READY"
  | "NO_HAZARD_DETECTED"
  | "FINALIZED"
  | "FAILED";

export interface DraftRiskProposalBoundary {
  title: string | null;
  description: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  severityLevel: number | null;
  frequencyLevel: number | null;
  score: number | null;
  classification: string | null;
  location: string | null;
  suggestedMitigations: string[];
}

export interface AiRiskAnalysisBoundary {
  id: string;
  orgId: string;
  status: AnalysisStatus;
  hazardDetected: boolean;
  confidence: number;
  aiProvider: string;
  finalizedRiskId: string | null;
  draft: DraftRiskProposalBoundary;
  sourceImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeDraftInput {
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;
  location?: string;
  image: File;
}

export interface UpdateAnalyzedRiskDraftBoundary {
  title?: string;
  description?: string;
  categoryCode?: string;
  severityLevel?: number;
  frequencyLevel?: number;
  location?: string;
  suggestedMitigations?: string[];
}

export interface FinalizeAnalyzedRiskBoundary {
  title: string;
  description: string;
  categoryCode: string;
  severityLevel: number;
  frequencyLevel: number;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;
  location?: string;
  suggestedMitigations: string[];
}

export const aiRiskAnalysisService = {
  async analyzeDraft(input: AnalyzeDraftInput): Promise<AiRiskAnalysisBoundary> {
    const formData = new FormData();
    formData.append("image", input.image);

    const { data } = await imageHttp.post<AiRiskAnalysisBoundary>(
      "/api/ai-risk-analyses/analyze-draft",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          orgId: input.orgId,
          divisionId: input.divisionId,
          departmentId: input.departmentId,
          riskManagerUserId: input.riskManagerUserId,
          location: input.location,
        },
      }
    );

    return data;
  },

  async getById(analysisId: string): Promise<AiRiskAnalysisBoundary> {
    const { data } = await imageHttp.get<AiRiskAnalysisBoundary>(
      `/api/ai-risk-analyses/${analysisId}`
    );
    return data;
  },

  async updateDraft(
    analysisId: string,
    body: UpdateAnalyzedRiskDraftBoundary
  ): Promise<AiRiskAnalysisBoundary> {
    const { data } = await imageHttp.patch<AiRiskAnalysisBoundary>(
      `/api/ai-risk-analyses/${analysisId}/draft`,
      body
    );
    return data;
  },

  async finalizeDraft(
    analysisId: string,
    body: FinalizeAnalyzedRiskBoundary
  ): Promise<AiRiskAnalysisBoundary> {
    const { data } = await imageHttp.post<AiRiskAnalysisBoundary>(
      `/api/ai-risk-analyses/${analysisId}/finalize`,
      body
    );
    return data;
  },
};