import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { organizationService } from "@/api/services/organizationService";
import type { LevelDefinitionBoundary } from "@/api/types";

interface Props {
  orgId: string;
}

const FREQUENCY_DETAILS: Record<number, { label: string; formula: string; description: string }> = {
  4: { label: "מדי פעם", formula: "X > 10^-3", description: "בערך אחת לחודש או יותר." },
  3: { label: "נמוכה", formula: "10^-4 < X <= 10^-3", description: "בין אחת לחודש לאחת לשנה." },
  2: { label: "לא סביר", formula: "10^-5 < X <= 10^-4", description: "בין אחת לשנה לאחת ל-10 שנים." },
  1: { label: "נדיר", formula: "X <= 10^-5", description: "מעל 10 שנים." },
};

function displayDescription(levelDef: LevelDefinitionBoundary) {
  return levelDef.description?.trim() || FREQUENCY_DETAILS[levelDef.level]?.description || "";
}

export default function FrequencyLevelsTab({ orgId }: Props) {
  const [levels, setLevels] = useState<LevelDefinitionBoundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    loadLevels();
  }, [orgId]);

  const loadLevels = async () => {
    try {
      setLoading(true);
      const matrix = await organizationService.getRiskMatrix(orgId);
      setLevels((matrix.frequencyLevels || []).map((level) => ({ ...level, description: displayDescription(level) })));
    } catch (e: any) {
      toast.error("שגיאה בטעינת רמות תדירות", {
        description: e?.response?.data?.message || e?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDescription = async (level: number, description: string) => {
    try {
      setSaving(level);
      await organizationService.updateFrequencyDescription(orgId, level, { description });
      
      // Update local state
      setLevels((prev) =>
        prev.map((l) => (l.level === level ? { ...l, description } : l))
      );
      
      toast.success("התיאור עודכן בהצלחה", {
        description: `רמת תדירות ${level} - ${levels.find(l => l.level === level)?.label}`,
      });
    } catch (e: any) {
      toast.error("שגיאה בעדכון התיאור", {
        description: e?.response?.data?.message || e?.message,
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          רמות התדירות מוגדרות מראש (1-4). ניתן להתאים את התיאור של כל רמה לפי הצרכים הספציפיים של הארגון.
          הגדרות אלו ישמשו לסיווג תדירות התרחשות סיכונים במערכת.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {levels.sort((a, b) => a.level - b.level).map((levelDef) => (
          <LevelCard
            key={levelDef.level}
            levelDef={levelDef}
            onSave={handleUpdateDescription}
            isSaving={saving === levelDef.level}
          />
        ))}
      </div>
    </div>
  );
}

interface LevelCardProps {
  levelDef: LevelDefinitionBoundary;
  onSave: (level: number, description: string) => Promise<void>;
  isSaving: boolean;
}

function LevelCard({ levelDef, onSave, isSaving }: LevelCardProps) {
  const [description, setDescription] = useState(displayDescription(levelDef));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setDescription(displayDescription(levelDef));
    setHasChanges(false);
  }, [levelDef.description]);

  const handleChange = (value: string) => {
    setDescription(value);
    setHasChanges(value !== displayDescription(levelDef));
  };

  const handleSave = async () => {
    await onSave(levelDef.level, description);
    setHasChanges(false);
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-50 border-green-200";
      case 2: return " bg-yellow-50 border-yellow-200";
      case 3: return "bg-orange-50 border-orange-200";
      case 4: return "bg-red-50 border-red-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-orange-500";
      case 4: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className={`${getLevelColor(levelDef.level)} transition-all`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${getLevelBadgeColor(levelDef.level)} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold`}>
              {levelDef.level}
            </div>
            <div>
              <CardTitle>{FREQUENCY_DETAILS[levelDef.level]?.label ?? levelDef.label}</CardTitle>
              <CardDescription>דירוג {levelDef.level}</CardDescription>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>מעדכן...</>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 rounded-md border bg-white/70 p-3 text-sm md:grid-cols-[120px_1fr]">
          <div className="text-muted-foreground">טווח</div>
          <div dir="ltr" className="text-left font-mono md:text-right">{FREQUENCY_DETAILS[levelDef.level]?.formula}</div>
          <div className="text-muted-foreground">דוגמה</div>
          <div>{FREQUENCY_DETAILS[levelDef.level]?.description}</div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`freq-desc-${levelDef.level}`}>תיאור מפורט</Label>
          <Textarea
            id={`freq-desc-${levelDef.level}`}
            value={description}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={FREQUENCY_DETAILS[levelDef.level]?.description ?? `הגדר את התיאור עבור רמת תדירות ${levelDef.level}`}
            rows={4}
            className="resize-none bg-white"
          />
          <p className="text-xs text-muted-foreground">
            תיאור זה יוצג למשתמשים בעת סיווג סיכונים במערכת
          </p>
        </div>
      </CardContent>
    </Card>
  );
}