import { userService } from "@/api/services/userService";
import type { UserBoundary } from "@/api/types"; 
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, TrendingDown } from "lucide-react";

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
import { getCurrentOrgId } from "@/api/config";
import type { CreateRiskBoundary } from "@/api/types";
import { useRiskMatrix } from "@/hooks/useRiskMatrix";
import { taskService } from "@/api/services/taskService";
import type { CreateTaskBoundary } from "@/api/types";

const STEPS = [
  { id: 1, title: "תיאור הסיכון", icon: FileText },
  { id: 2, title: "קטגוריה ומיקום", icon: Tag },
  { id: 3, title: "סבירות", icon: BarChart3 },
  { id: 4, title: "השפעה", icon: Zap },
  { id: 5, title: "אחראי וסיכון שיורי", icon: User },  
  { id: 6, title: "בקרות וסיכום", icon: Shield },
];
type Tone = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const toneFromLevel = (level: number): Tone => {
  if (level >= 4) return "CRITICAL";
  if (level === 3) return "HIGH";
  if (level === 2) return "MEDIUM";
  return "LOW";
};

const TONE_STYLES: Record<
  Tone,
  { border: string; softBg: string; solidBg: string; text: string }
> = {
  LOW: {
    border: "border-risk-low",
    softBg: "bg-risk-low-bg",
    solidBg: "bg-risk-low",
    text: "text-risk-low",
  },
  MEDIUM: {
    border: "border-risk-medium",
    softBg: "bg-risk-medium-bg",
    solidBg: "bg-risk-medium",
    text: "text-risk-medium",
  },
  HIGH: {
    border: "border-risk-high",
    softBg: "bg-risk-high-bg",
    solidBg: "bg-risk-high",
    text: "text-risk-high",
  },
  CRITICAL: {
    border: "border-risk-critical",
    softBg: "bg-risk-critical-bg",
    solidBg: "bg-risk-critical",
    text: "text-risk-critical",
  },
};

function LevelCard(props: {
  value: number;
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  const { value, selected, onClick, title, description } = props;
  const tone = toneFromLevel(value);
  const s = TONE_STYLES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 p-6 text-right transition-all duration-200",
        // תמיד “רומז” על צבע לפי רמה, ובבחירה ממלא רקע
        s.border,
        selected ? cn(s.softBg, "shadow-glow") : "bg-background hover:bg-muted/40"
      )}
    >
      {/* פס צבע קטן למעלה כמו אינדיקציה */}
      <div className={cn("absolute inset-x-0 top-0 h-1", s.solidBg)} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={cn("text-sm font-medium", selected ? s.text : "text-foreground")}>
            {title}
          </div>
          {description && (
            <div className="mt-1 text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </div>

        {/* עיגול מספר בצבע הרמה */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold transition",
            s.border,
            selected
              ? cn(s.solidBg, "text-white")
              : cn("bg-background text-foreground group-hover:" + s.solidBg, "group-hover:text-white")
          )}
        >
          {value}
        </div>
      </div>
    </button>
  );
}

export default function NewRisk() {
  const navigate = useNavigate();
  const orgId = getCurrentOrgId();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Users state
  const [users, setUsers] = useState<UserBoundary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // ✅ Fetch users from server (לפי userService שלך)
  const fetchUsers = async () => {
    if (!orgId) return;

    setUsersLoading(true);
    try {
      const data = await userService.list({ orgId });

      const sorted = (data ?? []).sort((a, b) =>
        `${a.firstName ?? ""} ${a.lastName ?? ""}`.localeCompare(
          `${b.firstName ?? ""} ${b.lastName ?? ""}`
        )
      );

      setUsers(sorted);
    } catch (e: any) {
      toast.error("שגיאה בטעינת משתמשים", {
        description:
          e?.response?.data?.message || e?.message || "לא ניתן למשוך משתמשים מהשרת",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // ✅ טעינה אוטומטית כשנכנסים לשלב 5
  useEffect(() => {
    if (currentStep !== 5) return;
    if (usersLoading) return;
    if (users.length > 0) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryCode: "",
    siteName: "",
    likelihood: 0,
    impact: 0,

    // ✅ Owner
    riskManagerUserId: "",

    // ✅ Residual ("אחרי")
    frequencyAfter: 0,
    severityAfter: 0,

    notes: "",
  });

  const [draftTasks, setDraftTasks] = useState<
  Array<Omit<CreateTaskBoundary, "orgId" | "riskId">>>([]);

  const [draftTaskForm, setDraftTaskForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    dueDate: "", // date
  });

  function addDraftTask() {
    if (!draftTaskForm.title.trim() || !draftTaskForm.description.trim()) return;

    setDraftTasks(prev => [
      ...prev,
      {
        title: draftTaskForm.title.trim(),
        description: draftTaskForm.description.trim(),
        assigneeUserId: draftTaskForm.assigneeUserId.trim() || undefined,
        dueDate: draftTaskForm.dueDate ? new Date(`${draftTaskForm.dueDate}T00:00:00`).toISOString() : undefined,
      }
    ]);

    setDraftTaskForm({ title: "", description: "", assigneeUserId: "", dueDate: "" });
  }

  function removeDraftTask(idx: number) {
    setDraftTasks(prev => prev.filter((_, i) => i !== idx));
  }

  const [categories, setCategories] = useState<CategoryBoundary[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const {
    frequencyMap,
    severityMap,
    loading: matrixLoading,
    error: matrixError,
  } = useRiskMatrix(orgId);

  const score = calculateScore(formData.likelihood, formData.impact);
  const severity =
    formData.likelihood && formData.impact ? calculateSeverity(score) : null;
  const residualScore = calculateScore(formData.frequencyAfter, formData.severityAfter);
  const residualSeverity =
    formData.frequencyAfter && formData.severityAfter 
    ? calculateSeverity(residualScore)
    : null;
  // --- Fetch categories from server ---
  const fetchCategories = async () => {
    if (!orgId) {
      toast.error("אין ארגון מחובר", {
        description: "התחברי מחדש כדי ליצור סיכון.",
      });
      navigate("/login");
      return;
    }

    setCategoriesLoading(true);
    try {
      const data = await organizationService.listCategories(orgId);

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
  useEffect(() => {
    setCategories([]);
    setFormData((p) => ({ ...p, categoryCode: "" })); // מומלץ כדי לא להשאיר קטגוריה מארגון אחר
  }, [orgId]);

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
      return (
        formData.riskManagerUserId !== "" &&
        formData.frequencyAfter > 0 &&
        formData.severityAfter > 0
      );
    case 6:
      return true;
    default:
      return false;
  }
};


  const handleNext = async () => {
    if (submitting) return;

    const LAST_STEP = STEPS.length;

    if (currentStep < LAST_STEP) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Step 6: Submit to backend
    try {
      if (!orgId) {
        toast.error("אין ארגון מחובר", { description: "התחברי מחדש כדי ליצור סיכון." });
        navigate("/login");
        return;
      }

      setSubmitting(true);

      const payload: CreateRiskBoundary = {
        orgId: orgId,

        title: formData.title,
        description: formData.description,
        categoryCode: formData.categoryCode,

        frequencyLevel: formData.likelihood,
        severityLevel: formData.impact,

        riskManagerUserId: formData.riskManagerUserId || undefined,
        frequencyAfter: formData.frequencyAfter,
        severityAfter: formData.severityAfter,

        location: formData.siteName || undefined,
        notes: formData.notes || undefined,
      };

      //await riskService.create(payload);
      const createdRisk = await riskService.create(payload);

      if (draftTasks.length > 0) {
        try {
          await Promise.all(
            draftTasks.map((t) =>
              taskService.create({
                orgId: orgId,
                riskId: createdRisk.id,
                title: t.title,
                description: t.description,
                assigneeUserId: t.assigneeUserId,
                dueDate: t.dueDate,
              })
            )
          );
        } catch (e) {
          // לא מפילים את כל יצירת הסיכון על משימות – רק מודיעים
          toast.error("הסיכון נוצר, אבל חלק מהמשימות לא נשמרו", {
            description: "נסי להוסיף את המיטיגציות מתוך פירוט הסיכון.",
          });
        }
      }



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
                <LevelCard
                  key={value}
                  value={value}
                  selected={formData.likelihood === value}
                  onClick={() => setFormData({ ...formData, likelihood: value })}
                  title={frequencyMap[value]?.label ?? `רמה ${value}`}
                  description={frequencyMap[value]?.description}
                />
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
                <LevelCard
                  key={value}
                  value={value}
                  selected={formData.impact === value}
                  onClick={() => setFormData({ ...formData, impact: value })}
                  title={severityMap[value]?.label ?? `רמה ${value}`}
                  description={severityMap[value]?.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Owner + Residual */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">אחראי/ת על הסיכון *</Label>
              <p className="text-sm text-muted-foreground">
                בחרי מי הבעלים של הסיכון בארגון
              </p>
            </div>

            {/* ✅ כאן ה-Select */}
            <Select
              value={formData.riskManagerUserId}
              onValueChange={(value) =>
                setFormData({ ...formData, riskManagerUserId: value })
              }
              onOpenChange={(open) => {
                if (!open) return;
                if (!usersLoading && users.length === 0) fetchUsers(); // Lazy-load
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "טוען משתמשים..." : "בחר משתמש"} />
              </SelectTrigger>

              <SelectContent>
                {usersLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">טוען...</div>
                )}

                {!usersLoading && users.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    אין משתמשים לארגון הזה
                  </div>
                )}

                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="pt-2">
              <Label className="text-lg font-semibold">רמת סיכון אחרי מיטיגציות *</Label>
              <p className="text-sm text-muted-foreground">
                לאן את/ה מצפה שהסיכון “ירד” אחרי ביצוע המשימות?
              </p>
            </div>

            <div>
              <Label className="font-medium">סבירות אחרי *</Label>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((value) => (
                  <LevelCard
                    key={value}
                    value={value}
                    selected={formData.frequencyAfter === value}
                    onClick={() => setFormData({ ...formData, frequencyAfter: value })}
                    title={frequencyMap[value]?.label ?? `רמה ${value}`}
                    description={frequencyMap[value]?.description}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="font-medium">השפעה אחרי *</Label>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((value) => (
                  <LevelCard
                    key={value}
                    value={value}
                    selected={formData.severityAfter === value}
                    onClick={() => setFormData({ ...formData, severityAfter: value })}
                    title={severityMap[value]?.label ?? `רמה ${value}`}
                    description={severityMap[value]?.description}
                  />
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Step 6: Summary */}
        {currentStep === 6 && (
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">אחראי:</span>
                <span className="font-medium">
                  {users.find(u => u.id === formData.riskManagerUserId)
                    ? `${users.find(u => u.id === formData.riskManagerUserId)!.firstName} ${users.find(u => u.id === formData.riskManagerUserId)!.lastName}`
                    : "לא נבחר"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">סבירות אחרי:</span>
                <span className="font-medium">
                  {(frequencyMap[formData.frequencyAfter]?.label ?? `רמה ${formData.frequencyAfter}`)} ({formData.frequencyAfter})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">השפעה אחרי:</span>
                <span className="font-medium">
                  {(severityMap[formData.severityAfter]?.label ?? `רמה ${formData.severityAfter}`)} ({formData.severityAfter})
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
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">מיטיגציות (משימות)</div>
                  <div className="text-sm text-muted-foreground">לא חובה — אפשר גם אחרי יצירת הסיכון</div>
                </div>
                <div className="text-sm text-muted-foreground">סה״כ: {draftTasks.length}</div>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label>כותרת</Label>
                  <Input
                    value={draftTaskForm.title}
                    onChange={(e) => setDraftTaskForm(s => ({ ...s, title: e.target.value }))}
                    placeholder="לדוגמה: הצבת גידור זמני"
                  />
                </div>

                <div className="space-y-1">
                  <Label>תיאור</Label>
                  <Textarea
                    value={draftTaskForm.description}
                    onChange={(e) => setDraftTaskForm(s => ({ ...s, description: e.target.value }))}
                    rows={3}
                    placeholder="מה בדיוק עושים?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>אחראי (UserId)</Label>
                    <Input
                      value={draftTaskForm.assigneeUserId}
                      onChange={(e) => setDraftTaskForm(s => ({ ...s, assigneeUserId: e.target.value }))}
                      placeholder="אופציונלי"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>תאריך יעד</Label>
                    <Input
                      type="date"
                      value={draftTaskForm.dueDate}
                      onChange={(e) => setDraftTaskForm(s => ({ ...s, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addDraftTask}
                  disabled={!draftTaskForm.title.trim() || !draftTaskForm.description.trim()}
                >
                  הוסף משימה לרשימה
                </Button>
              </div>

              <div className="rounded-lg border divide-y">
                {draftTasks.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">אין משימות שהוגדרו עדיין.</div>
                ) : (
                  draftTasks.map((t, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => removeDraftTask(idx)}>
                        הסר
                      </Button>
                    </div>
                  ))
                )}
              </div>
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
          {submitting ? "שומר..." : currentStep === STEPS.length ? "צור סיכון" : "הבא"}
          {currentStep < STEPS.length && !submitting && <ArrowLeft className="mr-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
