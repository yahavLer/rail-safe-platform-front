import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Camera,
  X,
  Loader2,
  Bot,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  aiRiskAnalysisService,
  type AiRiskAnalysisBoundary,
} from "@/api/services/aiRiskAnalysisService";

interface AiRiskImageUploadProps {
  orgId: string;
  divisionId?: string;
  departmentId?: string;
  riskManagerUserId?: string;
  location?: string;
  onAnalysisComplete?: (
    analysis: AiRiskAnalysisBoundary,
    file: File
  ) => void;
  className?: string;
}

export function AiRiskImageUpload({
  orgId,
  divisionId,
  departmentId,
  riskManagerUserId,
  location,
  onAnalysisComplete,
  className,
}: AiRiskImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiRiskAnalysisBoundary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("יש להעלות קובץ תמונה בלבד");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("גודל הקובץ חייב להיות עד 10MB");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = async () => {
        setPreview(reader.result as string);

        try {
          setIsAnalyzing(true);
          setAnalysis(null);

          const result = await aiRiskAnalysisService.analyzeDraft({
            orgId,
            divisionId,
            departmentId,
            riskManagerUserId,
            location,
            image: file,
          });

          setAnalysis(result);
          onAnalysisComplete?.(result, file);

          if (result.hazardDetected) {
            toast.success("זוהה סיכון בתמונה", {
              description: result.draft.title ?? result.draft.description ?? "",
            });
          } else {
            toast.info("לא זוהה מפגע מובהק בתמונה");
          }
        } catch (error) {
          console.error("Failed to analyze image:", error);
          toast.error("שגיאה בניתוח התמונה");
        } finally {
          setIsAnalyzing(false);
        }
      };

      reader.readAsDataURL(file);
    },
    [orgId, divisionId, departmentId, riskManagerUserId, location, onAnalysisComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setAnalysis(null);
    setSelectedFile(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const reAnalyze = async () => {
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>

            <p className="mb-1 text-lg font-medium text-foreground">
              גרור תמונה לכאן
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              או בחר אחת מהאפשרויות למטה
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG עד 10MB
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="ml-2 h-4 w-4" />
              העלאת תמונה
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="ml-2 h-4 w-4" />
              צלם תמונה
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img
              src={preview}
              alt="תצוגה מקדימה"
              className="h-64 w-full object-cover"
            />

            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute left-2 top-2"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>

            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium">מנתח את התמונה...</p>
                <p className="text-xs text-muted-foreground">
                  בניית טיוטת סיכון באמצעות AI
                </p>
              </div>
            )}
          </div>

          {analysis && (
            <div
              className={cn(
                "animate-fade-in rounded-xl border p-4",
                analysis.hazardDetected
                  ? "border-risk-critical/30 bg-risk-critical-bg"
                  : "border-risk-low/30 bg-risk-low-bg"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    analysis.hazardDetected
                      ? "bg-risk-critical/10 text-risk-critical"
                      : "bg-risk-low/10 text-risk-low"
                  )}
                >
                  {analysis.hazardDetected ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      טיוטת AI
                    </span>
                    {analysis.confidence > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(analysis.confidence)}% ביטחון)
                      </span>
                    )}
                  </div>

                  <h4 className="mb-1 font-semibold text-foreground">
                    {analysis.draft.title}
                  </h4>

                  <p className="mb-3 text-sm text-muted-foreground">
                    {analysis.draft.description}
                  </p>

                  {analysis.hazardDetected && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {analysis.draft.frequencyLevel && (
                        <div className="rounded-lg bg-background/50 p-2">
                          <span className="text-muted-foreground">תדירות: </span>
                          <span className="font-semibold">
                            {analysis.draft.frequencyLevel}/4
                          </span>
                        </div>
                      )}

                      {analysis.draft.severityLevel && (
                        <div className="rounded-lg bg-background/50 p-2">
                          <span className="text-muted-foreground">חומרה: </span>
                          <span className="font-semibold">
                            {analysis.draft.severityLevel}/4
                          </span>
                        </div>
                      )}

                      {analysis.draft.categoryCode && (
                        <div className="col-span-2 rounded-lg bg-background/50 p-2">
                          <span className="text-muted-foreground">קטגוריה: </span>
                          <span className="font-semibold">
                            {analysis.draft.categoryCode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {analysis.draft.suggestedMitigations.length > 0 && (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        מיטיגציות מוצעות:
                      </p>
                      <ul className="space-y-1">
                        {analysis.draft.suggestedMitigations.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1 text-xs text-foreground"
                          >
                            <span className="text-primary">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearImage();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="ml-2 h-4 w-4" />
              החלף תמונה
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={reAnalyze}
              disabled={isAnalyzing}
            >
              <Bot className="ml-2 h-4 w-4" />
              נתח שוב
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}