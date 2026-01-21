import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import {
  calculateScore,
  calculateSeverity,
  SEVERITY_LABELS,
} from "@/types/risk";


import {
  FileText,
  Tag,
  BarChart3,
  Zap,
  Shield,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { toast } from "sonner";

import { riskService } from "@/api/services/riskService";
import { organizationService } from "@/api/services/organizationService";
import type { CategoryBoundary } from "@/api/types";
import { DEFAULT_ORG_ID } from "@/api/config";
import type { CreateRiskBoundary } from "@/api/types";
import { useRiskMatrix } from "@/hooks/useRiskMatrix";


const STEPS = [
  { id: 1, title: "תיאור הסיכון", icon: FileText },
  { id: 2, title: "קטגוריה ומיקום", icon: Tag },
  { id: 3, title: "סבירות", icon: BarChart3 },
  { id: 4, title: "השפעה", icon: Zap },
  { id: 5, title: "בקרות וסיכום", icon: Shield },
];

export default function NewRisk() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryCode: "",
    siteName: "",
    likelihood: 0,
    impact: 0,
    notes: "",
  });

  const [categories, setCategories] = useState<CategoryBoundary[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const {
    frequencyMap,
    severityMap,
    loading: matrixLoading,
    error: matrixError,
  } = useRiskMatrix(DEFAULT_ORG_ID);

  const score = calculateScore(formData.likelihood, formData.impact);
  const severity =
    formData.likelihood && formData.impact ? calculateSeverity(score) : null;

  // --- Fetch categories from server ---
  const fetchCategories = async () => {
    if (!DEFAULT_ORG_ID) {
      toast.error("חסר ORG_ID", {
        description: "בדקי ש-VITE_ORG_ID מוגדר ל-UUID אמיתי ב-.env",
      });
      return;
    }

    setCategoriesLoading(true);
    try {
      const data = await organizationService.listCategories(DEFAULT_ORG_ID);

      const activeSorted = data
        .filter((c) => c.active)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      setCategories(activeSorted);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "לא ניתן למשוך קטגוריות מהשרת";
      toast.error("שגיאה בטעינת קטגוריות", { description: msg });
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load categories when entering step 2 (once)
  useEffect(() => {
    if (currentStep !== 2) return;
    if (categoriesLoading) return;
    if (categories.length > 0) return;

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.length >= 5 && formData.description.length >= 10;
      case 2:
        return formData.categoryCode !== "";
      case 3:
        return formData.likelihood > 0;
      case 4:
        return formData.impact > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (submitting) return;

    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Step 5: Submit to backend
    try {
      if (!DEFAULT_ORG_ID) {
        throw new Error(
          "חסר VITE_ORG_ID (.env) — חובה organizationId כדי ליצור סיכון"
        );
      }

      setSubmitting(true);

      const payload: CreateRiskBoundary = {
        organizationId: DEFAULT_ORG_ID,

        title: formData.title,
        description: formData.description,
        categoryCode: formData.categoryCode,

        frequencyLevel: formData.likelihood,
        severityLevel: formData.impact,

        location: formData.siteName || undefined,
        notes: formData.notes || undefined,
      };

      await riskService.create(payload);


      toast.success("הסיכון נוצר בהצלחה!", {
        description: `${formData.title} - ציון ${score}`,
      });

      navigate("/risks");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "שגיאה לא ידועה";
      toast.error("יצירת הסיכון נכשלה", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">יצירת סיכון חדש</h1>
        <p className="mt-1 text-muted-foreground">
          מלא את הפרטים הבאים ליצירת סיכון חדש במערכת
        </p>
      </div>
      {matrixError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          לא הצלחתי לטעון מטריצת סיכונים לארגון. ({matrixError})
        </div>
      )}

      {matrixLoading && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          טוען מטריצת סיכונים לארגון...
        </div>
      )}

      {/* Steps indicator */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "border-risk-low bg-risk-low text-white"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "mr-2 hidden text-sm font-medium sm:block",
                  currentStep === step.id
                    ? "text-primary"
                    : currentStep > step.id
                    ? "text-risk-low"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 w-8 rounded transition-colors duration-300",
                    currentStep > step.id ? "bg-risk-low" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="card-elevated p-6 animate-fade-in">
        {/* Step 1: Description */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת הסיכון *</Label>
              <Input
                id="title"
                placeholder="לדוגמה: ענף עץ על המסילה באזור נתניה"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                תאר את הסיכון בקצרה (לפחות 5 תווים)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור מפורט *</Label>
              <Textarea
                id="description"
                placeholder="תאר את הסיכון בפירוט: מה קורה, איפה, מתי זוהה, מה הסכנה הפוטנציאלית..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                ככל שהתיאור מפורט יותר, כך ניתן יהיה לטפל בסיכון בצורה טובה יותר
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Category & Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>קטגוריה *</Label>

              <Select
                value={formData.categoryCode}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryCode: value })
                }
                onOpenChange={(open) => {
                  if (!open) return;

                  // Lazy-load categories when user opens the dropdown
                  if (!categoriesLoading && categories.length === 0) {
                    fetchCategories();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categoriesLoading ? "טוען קטגוריות..." : "בחר קטגוריה"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {categoriesLoading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      טוען...
                    </div>
                  )}

                  {!categoriesLoading && categories.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      אין קטגוריות לארגון הזה
                    </div>
                  )}

                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteName">מיקום / אתר</Label>
              <Input
                id="siteName"
                placeholder="לדוגמה: תחנת באר שבע צפון, ק״מ 47 קו צפון"
                value={formData.siteName}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Step 3: Likelihood */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">סבירות להתרחשות *</Label>
              <p className="text-sm text-muted-foreground">
                מה הסבירות שהסיכון יתממש?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, likelihood: value })}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all duration-200",
                    formData.likelihood === value
                      ? "border-primary bg-primary/5 shadow-glow"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="text-3xl font-bold">{value}</span>

                  <span className="mt-2 text-sm font-medium">
                    {frequencyMap[value]?.label ?? `רמה ${value}`}
                  </span>

                  {frequencyMap[value]?.description && (
                    <span className="mt-1 text-xs text-muted-foreground text-center">
                      {frequencyMap[value]?.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Impact */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">השפעה / חומרה *</Label>
              <p className="text-sm text-muted-foreground">
                מה תהיה ההשפעה אם הסיכון יתממש?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, impact: value })}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all duration-200",
                    formData.impact === value
                      ? "border-primary bg-primary/5 shadow-glow"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="text-3xl font-bold">{value}</span>
                  <span className="mt-2 text-sm font-medium">
                    {severityMap[value]?.label ?? `רמה ${value}`}
                  </span>

                  {severityMap[value]?.description && (
                    <span className="mt-1 text-xs text-muted-foreground text-center">
                      {severityMap[value]?.description}
                    </span>
                  )}

                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">סיכום</Label>
              <p className="text-sm text-muted-foreground">
                בדוק את הפרטים לפני יצירת הסיכון
              </p>
            </div>

            {/* Risk Score Display */}
            {severity && (
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl p-6",
                  severity === "CRITICAL" && "bg-risk-critical-bg",
                  severity === "HIGH" && "bg-risk-high-bg",
                  severity === "MEDIUM" && "bg-risk-medium-bg",
                  severity === "LOW" && "bg-risk-low-bg"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ציון סיכון
                  </p>
                  <p className="text-4xl font-bold">{score}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground">
                    רמת חומרה
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      severity === "CRITICAL" && "text-risk-critical",
                      severity === "HIGH" && "text-risk-high",
                      severity === "MEDIUM" && "text-risk-medium",
                      severity === "LOW" && "text-risk-low"
                    )}
                  >
                    {SEVERITY_LABELS[severity]}
                  </p>
                </div>
              </div>
            )}

            {/* Summary details */}
            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">כותרת:</span>
                <span className="font-medium">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">קטגוריה:</span>
                <span className="font-medium">
                  {categories.find((c) => c.code === formData.categoryCode)
                    ?.name || formData.categoryCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מיקום:</span>
                <span className="font-medium">
                  {formData.siteName || "לא צוין"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">סבירות:</span>
                <span className="font-medium">
                  {(frequencyMap[formData.likelihood]?.label ?? `רמה ${formData.likelihood}`)} ({formData.likelihood})
                </span>

              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">השפעה:</span>
                <span className="font-medium">
                  {(severityMap[formData.impact]?.label ?? `רמה ${formData.impact}`)} ({formData.impact})
                </span>

              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">הערות נוספות</Label>
              <Textarea
                id="notes"
                placeholder="הערות או פרטים נוספים..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || submitting}>
          <ArrowRight className="ml-2 h-4 w-4" />
          הקודם
        </Button>

        <Button onClick={handleNext} disabled={!canProceed() || submitting}>
          {submitting ? "שומר..." : currentStep === 5 ? "צור סיכון" : "הבא"}
          {currentStep < 5 && !submitting && <ArrowLeft className="mr-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
