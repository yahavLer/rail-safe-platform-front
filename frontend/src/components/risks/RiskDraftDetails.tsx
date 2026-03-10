import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Bot,
  MapPin,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import type { UserBoundary } from "@/api/types";
import type { AiRiskAnalysisBoundary } from "@/api/services/aiRiskAnalysisService";

const CLASSIFICATION_LABELS: Record<string, string> = {
  EXTREME_RED: "קריטי - קיצוני",
  HIGH_ACTION_ORANGE: "גבוה - נדרש טיפול",
  TOLERABLE_YELLOW: "בינוני - נסבל",
  NEGLIGIBLE_GREEN: "נמוך - זניח",
  MEDIUM_YELLOW: "בינוני - נסבל",
  LOW_GREEN: "נמוך - זניח",
};

const classificationBadgeStyles: Record<string, string> = {
  EXTREME_RED: "bg-risk-critical-bg text-risk-critical border-risk-critical/20",
  HIGH_ACTION_ORANGE: "bg-risk-high-bg text-risk-high border-risk-high/20",
  TOLERABLE_YELLOW: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  MEDIUM_YELLOW: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  NEGLIGIBLE_GREEN: "bg-risk-low-bg text-risk-low border-risk-low/20",
  LOW_GREEN: "bg-risk-low-bg text-risk-low border-risk-low/20",
};

function calcClassification(score: number) {
  if (score >= 12) return "EXTREME_RED";
  if (score >= 8) return "HIGH_ACTION_ORANGE";
  if (score >= 4) return "TOLERABLE_YELLOW";
  return "NEGLIGIBLE_GREEN";
}

type Props = {
  analysis: AiRiskAnalysisBoundary;
  users: UserBoundary[];
  usersLoading: boolean;

  title: string;
  setTitle: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  categoryCode: string;
  setCategoryCode: (v: string) => void;

  categoryName: string;
  setCategoryName: (v: string) => void;

  severityLevel: string;
  setSeverityLevel: (v: string) => void;

  frequencyLevel: string;
  setFrequencyLevel: (v: string) => void;

  location: string;
  setlocation: (v: string) => void;

  riskManagerUserId: string;
  setRiskManagerUserId: (v: string) => void;

  divisionId: string;
  setDivisionId: (v: string) => void;

  departmentId: string;
  setDepartmentId: (v: string) => void;

  mitigations: string[];
  updateMitigation: (index: number, value: string) => void;
  addMitigationRow: () => void;
  removeMitigationRow: (index: number) => void;

  onFinalize: () => void;
  saving: boolean;
};

export function RiskDraftDetails({
  analysis,
  users,
  usersLoading,
  title,
  setTitle,
  description,
  setDescription,
  categoryCode,
  setCategoryCode,
  categoryName,
  setCategoryName,
  severityLevel,
  setSeverityLevel,
  frequencyLevel,
  setFrequencyLevel,
  location,
  setlocation,
  riskManagerUserId,
  setRiskManagerUserId,
  divisionId,
  setDivisionId,
  departmentId,
  setDepartmentId,
  mitigations,
  updateMitigation,
  addMitigationRow,
  removeMitigationRow,
  onFinalize,
  saving,
}: Props) {
  const [riskManagerOpen, setRiskManagerOpen] = useState(false);

  const userLabelById = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      m[u.id] = full || u.email || u.id;
    });
    return m;
  }, [users]);

  const sev = Number(severityLevel || 1);
  const freq = Number(frequencyLevel || 1);
  const score = sev * freq;
  const classification = calcClassification(score);

  return (
    <div dir="rtl" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* שמאל: סיכום AI */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            סיכום AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">רמת ביטחון</div>
            <div className="mt-1 text-2xl font-bold">
              {Math.round((analysis.confidence ?? 0) * (analysis.confidence && analysis.confidence <= 1 ? 100 : 1))}
              %
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">סיווג מחושב</div>
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn("text-xs", classificationBadgeStyles[classification] ?? "")}
              >
                {CLASSIFICATION_LABELS[classification] ?? classification}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">חומרה</div>
              <div className="mt-1 text-xl font-semibold">{sev}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">תדירות</div>
              <div className="mt-1 text-xl font-semibold">{freq}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">ציון</div>
              <div className="mt-1 text-xl font-semibold">{score}</div>
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">תמונה מנותחת</div>
            <div className="mt-2 text-sm">
              {analysis.sourceImageUrl ? (
                <a
                  href={analysis.sourceImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  לצפייה בקובץ המקור
                </a>
              ) : (
                "אין קישור לתמונה"
              )}
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">סטטוס טיוטה</div>
            <div className="mt-1 text-sm font-medium">{analysis.status}</div>
          </div>
        </CardContent>
      </Card>

      {/* אמצע: מיטיגציות */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            מיטיגציות
          </CardTitle>

          <Button type="button" variant="outline" size="sm" onClick={addMitigationRow}>
            <Plus className="ml-2 h-4 w-4" />
            הוסף
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {mitigations.map((item, index) => (
            <div key={index} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">מיטיגציה {index + 1}</div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMitigationRow(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                rows={3}
                value={item}
                onChange={(e) => updateMitigation(index, e.target.value)}
                placeholder="כתבי פעולה מתקנת / מונעת"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ימין: פרטי סיכון */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            פרטי סיכון
          </CardTitle>

          <Button onClick={onFinalize} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                צור סיכון
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>כותרת</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>תיאור</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>קטגוריה</Label>
            <Input value={categoryName || categoryCode} readOnly />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>חומרה</Label>
              <Input
                type="number"
                min={1}
                max={4}
                value={severityLevel}
                onChange={(e) => setSeverityLevel(e.target.value)}
              />
            </div>

            <div>
              <Label>תדירות</Label>
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
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              מיקום / אתר
            </Label>
            <Input value={location} onChange={(e) => setlocation(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>מנהל סיכון</Label>

            <Popover open={riskManagerOpen} onOpenChange={setRiskManagerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={riskManagerOpen}
                  className="w-full justify-between"
                  disabled={usersLoading}
                >
                  {riskManagerUserId
                    ? userLabelById[riskManagerUserId] ?? "בחרי מנהל סיכון"
                    : "לא שויך"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder={usersLoading ? "טוען משתמשים…" : "התחילי להקליד שם…"} />
                  <CommandEmpty>לא נמצא עובד.</CommandEmpty>

                  <CommandGroup>
                    <CommandItem
                      value="לא שויך"
                      onSelect={() => {
                        setRiskManagerUserId("");
                        setRiskManagerOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", !riskManagerUserId ? "opacity-100" : "opacity-0")} />
                      לא שויך
                    </CommandItem>

                    {users.map((u) => {
                      const label = userLabelById[u.id];
                      const selected = riskManagerUserId === u.id;

                      return (
                        <CommandItem
                          key={u.id}
                          value={label}
                          onSelect={() => {
                            setRiskManagerUserId(u.id);
                            setRiskManagerOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>חטיבה</Label>
              <Input
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                placeholder="מזהה חטיבה"
              />
            </div>

            <div>
              <Label>מחלקה</Label>
              <Input
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="מזהה מחלקה"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}