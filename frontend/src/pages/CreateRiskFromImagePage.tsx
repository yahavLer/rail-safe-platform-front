import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getCurrentOrgId } from "@/api/config";
import {
  aiRiskAnalysisService,
  type AiRiskAnalysisBoundary,
} from "@/api/services/aiRiskAnalysisService";
import { AiRiskImageUpload } from "@/components/risks/AiRiskImageUpload";
import { RiskDraftDetails } from "@/components/risks/RiskDraftDetails";
import { userService } from "@/api/services/userService";
import type { UserBoundary } from "@/api/types";

export default function CreateRiskFromImagePage() {
  const nav = useNavigate();
  const orgId = getCurrentOrgId();

  const [analysis, setAnalysis] = useState<AiRiskAnalysisBoundary | null>(null);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<UserBoundary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [severityLevel, setSeverityLevel] = useState("1");
  const [frequencyLevel, setFrequencyLevel] = useState("1");
  const [location, setlocation] = useState("");
  const [riskManagerUserId, setRiskManagerUserId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [mitigations, setMitigations] = useState<string[]>([""]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setUsersLoading(true);
        const list = await userService.list({ orgId });
        if (!alive) return;
        setUsers(list);
      } catch (e) {
        console.error("load users failed", e);
      } finally {
        if (alive) setUsersLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orgId]);

  useEffect(() => {
    if (!analysis) return;

    setTitle(analysis.draft.title ?? "");
    setDescription(analysis.draft.description ?? "");
    setCategoryCode(analysis.draft.categoryCode ?? "");
    setCategoryName(analysis.draft.categoryName ?? "");
    setSeverityLevel(String(analysis.draft.severityLevel ?? 1));
    setFrequencyLevel(String(analysis.draft.frequencyLevel ?? 1));
    setlocation(analysis.draft.location ?? "");
    setMitigations(
      analysis.draft.suggestedMitigations?.length
        ? analysis.draft.suggestedMitigations
        : [""]
    );
  }, [analysis]);

  const cleanMitigations = useMemo(
    () => mitigations.map((m) => m.trim()).filter(Boolean),
    [mitigations]
  );

  const updateMitigation = (index: number, value: string) => {
    setMitigations((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addMitigationRow = () => {
    setMitigations((prev) => [...prev, ""]);
  };

  const removeMitigationRow = (index: number) => {
    setMitigations((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
  };

  const handleFinalize = async () => {
    if (!analysis) {
      toast.error("יש לבצע ניתוח תמונה תחילה");
      return;
    }

    if (!title.trim() || !description.trim() || !categoryCode.trim()) {
      toast.error("יש למלא כותרת, תיאור וקטגוריה");
      return;
    }

    try {
      setSaving(true);

      const finalized = await aiRiskAnalysisService.finalizeDraft(analysis.id, {
        title,
        description,
        categoryCode,
        severityLevel: Number(severityLevel),
        frequencyLevel: Number(frequencyLevel),
        location,
        suggestedMitigations: cleanMitigations,
        riskManagerUserId: riskManagerUserId || undefined,
        divisionId: divisionId || undefined,
        departmentId: departmentId || undefined,
      });

      toast.success("הסיכון נוצר בהצלחה");

      if (finalized.finalizedRiskId) {
        nav(`/risks/${finalized.finalizedRiskId}`);
        return;
      }

      nav("/risks");
    } catch (error) {
      console.error("Failed to finalize risk draft:", error);
      toast.error("שגיאה ביצירת הסיכון");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Camera className="h-8 w-8 text-primary" />
            יצירת סיכון מתמונה
          </h1>
          <p className="mt-1 text-muted-foreground">
            העלאת תמונה, ניתוח AI, עריכת טיוטה ושמירה כסיכון חדש
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>העלאת תמונה וניתוח</CardTitle>
          </CardHeader>
          <CardContent>
            <AiRiskImageUpload
              orgId={orgId}
              onAnalysisComplete={(result) => setAnalysis(result)}
            />
          </CardContent>
        </Card>

        {analysis ? (
          <RiskDraftDetails
            analysis={analysis}
            users={users}
            usersLoading={usersLoading}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            categoryCode={categoryCode}
            categoryName={categoryName}
            setCategoryCode={setCategoryCode}
            setCategoryName={setCategoryName}
            severityLevel={severityLevel}
            setSeverityLevel={setSeverityLevel}
            frequencyLevel={frequencyLevel}
            setFrequencyLevel={setFrequencyLevel}
            location={location}
            setlocation={setlocation}
            riskManagerUserId={riskManagerUserId}
            setRiskManagerUserId={setRiskManagerUserId}
            divisionId={divisionId}
            setDivisionId={setDivisionId}
            departmentId={departmentId}
            setDepartmentId={setDepartmentId}
            mitigations={mitigations}
            updateMitigation={updateMitigation}
            addMitigationRow={addMitigationRow}
            removeMitigationRow={removeMitigationRow}
            onFinalize={handleFinalize}
            saving={saving}
          />
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              יש להעלות תמונה כדי לקבל טיוטת סיכון לעריכה.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}