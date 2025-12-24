import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Camera, 
  X, 
  Loader2, 
  Bot, 
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisResult {
  detected: boolean;
  hazardType?: string;
  description: string;
  suggestedLikelihood?: number;
  suggestedImpact?: number;
  confidence: number;
  category?: string;
  recommendations?: string[];
}

interface ImageUploadProps {
  onImageUpload?: (imageData: string, analysis?: AIAnalysisResult) => void;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
  className?: string;
}

export function ImageUpload({ onImageUpload, onAnalysisComplete, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות עד 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onImageUpload?.(base64);
      
      // Analyze with AI
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-risk-image', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('שגיאה בניתוח התמונה');
        return;
      }

      setAnalysis(data);
      onAnalysisComplete?.(data);

      if (data.detected) {
        toast.success('זוהה מפגע!', {
          description: data.hazardType || data.description
        });
      } else {
        toast.info('לא זוהה מפגע בתמונה');
      }
    } catch (err) {
      console.error('Failed to analyze image:', err);
      toast.error('שגיאה בניתוח התמונה');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file inputs */}
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
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              גרור תמונה לכאן
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              או בחר אחת מהאפשרויות למטה
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG עד 10MB
            </p>
          </div>

          {/* Action buttons */}
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
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={preview}
              alt="תצוגה מקדימה"
              className="w-full h-64 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 left-2"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* AI Analysis overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                <p className="text-sm font-medium">מנתח את התמונה...</p>
                <p className="text-xs text-muted-foreground">זיהוי מפגעים באמצעות AI</p>
              </div>
            )}
          </div>

          {/* Analysis results */}
          {analysis && (
            <div
              className={cn(
                'rounded-xl border p-4 animate-fade-in',
                analysis.detected
                  ? 'bg-risk-critical-bg border-risk-critical/30'
                  : 'bg-risk-low-bg border-risk-low/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    analysis.detected
                      ? 'bg-risk-critical/10 text-risk-critical'
                      : 'bg-risk-low/10 text-risk-low'
                  )}
                >
                  {analysis.detected ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">ניתוח AI</span>
                    {analysis.confidence > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(analysis.confidence)}% ביטחון)
                      </span>
                    )}
                  </div>
                  
                  {analysis.detected && analysis.hazardType && (
                    <h4 className="font-semibold text-foreground mb-1">
                      {analysis.hazardType}
                    </h4>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {analysis.description}
                  </p>

                  {analysis.detected && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {analysis.suggestedLikelihood && (
                        <div className="bg-background/50 rounded-lg p-2">
                          <span className="text-muted-foreground">סבירות מוצעת: </span>
                          <span className="font-semibold">{analysis.suggestedLikelihood}/4</span>
                        </div>
                      )}
                      {analysis.suggestedImpact && (
                        <div className="bg-background/50 rounded-lg p-2">
                          <span className="text-muted-foreground">השפעה מוצעת: </span>
                          <span className="font-semibold">{analysis.suggestedImpact}/4</span>
                        </div>
                      )}
                      {analysis.category && (
                        <div className="col-span-2 bg-background/50 rounded-lg p-2">
                          <span className="text-muted-foreground">קטגוריה: </span>
                          <span className="font-semibold">{analysis.category}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">המלצות:</p>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-foreground flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              onClick={() => preview && analyzeImage(preview)}
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
