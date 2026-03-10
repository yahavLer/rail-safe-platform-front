import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { getCurrentOrgId } from "@/api/config";
import {
  aiRiskAnalysisService,
  type AiRiskAnalysisBoundary,
} from "@/api/services/aiRiskAnalysisService";
import { AiRiskImageUpload } from "@/components/risks/AiRiskImageUpload";

export default function CreateRiskFromImagePage() {
  const nav = useNavigate();

  const orgId = getCurrentOrgId();

  const [analysis, setAnalysis] = useState<AiRiskAnalysisBoundary | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [severityLevel, setSeverityLevel] = useState("1");
  const [frequencyLevel, setFrequencyLevel] = useState("1");
  const [location, setLocation] = useState("");
  const [mitigationsText, setMitigationsText] = useState("");

  useEffect(() => {
    if (!analysis) return;

    setTitle(analysis.draft.title ?? "");
    setDescription(analysis.draft.description ?? "");
    setCategoryCode(analysis.draft.categoryCode ?? "");
    setSeverityLevel(String(analysis.draft.severityLevel ?? 1));
    setFrequencyLevel(String(analysis.draft.frequencyLevel ?? 1));
    setLocation(analysis.draft.location ?? "");
    setMitigationsText((analysis.draft.suggestedMitigations ?? []).join("\n"));
  }, [analysis]);

  const mitigations = useMemo(
    () =>
      mitigationsText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    [mitigationsText]
  );

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

      await aiRiskAnalysisService.updateDraft(analysis.id, {
        title,
        description,
        categoryCode,
        severityLevel: Number(severityLevel),
        frequencyLevel: Number(frequencyLevel),
        location,
        suggestedMitigations: mitigations,
      });

      const finalized = await aiRiskAnalysisService.finalizeDraft(analysis.id, {
        title,
        description,
        categoryCode,
        severityLevel: Number(severityLevel),
        frequencyLevel: Number(frequencyLevel),
        location,
        suggestedMitigations: mitigations,
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Camera className="h-8 w-8 text-primary" />
            יצירת סיכון מתמונה
          </h1>
          <p className="mt-1 text-muted-foreground">
            העלאת תמונה, ניתוח AI, עריכת טיוטה ושמירה כסיכון חדש
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>עריכת טיוטת הסיכון</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!analysis ? (
                <p className="text-sm text-muted-foreground">
                  יש להעלות תמונה כדי לקבל טיוטת סיכון.
                </p>
              ) : (
                <>
                  <div>
                    <Label>כותרת</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div>
                    <Label>תיאור</Label>
                    <Textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>קטגוריה</Label>
                    <Input
                      value={categoryCode}
                      onChange={(e) => setCategoryCode(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>חומרה (1-4)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={severityLevel}
                        onChange={(e) => setSeverityLevel(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>תדירות (1-4)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={frequencyLevel}
                        onChange={(e) => setFrequencyLevel(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>מיקום / אתר</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>

                  <div>
                    <Label>מיטיגציות מוצעות — שורה לכל מיטיגציה</Label>
                    <Textarea
                      rows={6}
                      value={mitigationsText}
                      onChange={(e) => setMitigationsText(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleFinalize} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        שומר סיכון...
                      </>
                    ) : (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        צור סיכון חדש
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}