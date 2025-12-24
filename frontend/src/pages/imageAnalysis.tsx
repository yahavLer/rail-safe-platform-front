import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ImageAnalysis() {
  const [selectedRiskId, setSelectedRiskId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date', 100),
  });

  const openRisks = risks.filter(r => r.status === 'חדש' || r.status === 'בטיפול');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile || !selectedRiskId) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 1. העלאת התמונה
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // 2. שליחה ל-AI לניתוח
      const aiPrompt = `
אתה מומחה בטיחות רכבות. נתח את התמונה הבאה וזהה מפגעי בטיחות אפשריים.

חפש מפגעים כמו:
- ענפים או עצים על/בסמוך למסילה
- אבנים או פסולת על הפסים
- נזקים למסילה (סדקים, עיוותים)
- מים או הצפות
- מכשולים אחרים

בצע את הניתוח והחזר JSON עם המבנה הבא:
{
  "hazards_detected": ["רשימת מפגעים שזוהו"],
  "severity_description": "תיאור חומרת המצב",
  "recommended_likelihood": number (1-4),
  "recommended_action": "המלצה לפעולה",
  "confidence": number (0-100),
  "details": "תיאור מפורט"
}
      `;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            hazards_detected: { type: "array", items: { type: "string" } },
            severity_description: { type: "string" },
            recommended_likelihood: { type: "integer" },
            recommended_action: { type: "string" },
            confidence: { type: "number" },
            details: { type: "string" }
          }
        }
      });

      // 3. עדכון הסיכון עם תוצאות ה-AI
      const risk = risks.find(r => r.id === selectedRiskId);
      await base44.entities.Risk.update(selectedRiskId, {
        ...risk,
        image_url: file_url,
        ai_likelihood: aiResult.recommended_likelihood,
        ai_description: aiResult.details,
        ai_confidence: aiResult.confidence,
        ai_processed_at: new Date().toISOString(),
      });

      setAnalysisResult({
        ...aiResult,
        image_url: file_url,
      });

      queryClient.invalidateQueries({ queryKey: ['risks'] });

    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResult({
        error: true,
        message: 'שגיאה בניתוח התמונה. אנא נסה שוב.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedRisk = risks.find(r => r.id === selectedRiskId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Camera className="h-8 w-8 text-purple-600" />
            ניתוח תמונות AI
          </h1>
          <p className="text-slate-600 mt-1">זיהוי מפגעי בטיחות באמצעות בינה מלאכותית</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>העלאת תמונה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="risk">בחר סיכון קיים *</Label>
                <Select value={selectedRiskId} onValueChange={setSelectedRiskId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סיכון..." />
                  </SelectTrigger>
                  <SelectContent>
                    {openRisks.map(risk => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.title} - {risk.site_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRisk && (
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-slate-900 mb-1">פרטי הסיכון:</div>
                  <div className="space-y-1 text-slate-600">
                    <div>קטגוריה: {selectedRisk.category}</div>
                    <div>ציון נוכחי: {selectedRisk.score}</div>
                    <div>סטטוס: {selectedRisk.status}</div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="image">בחר תמונה *</Label>
                <div className="mt-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {preview && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="תצוגה מקדימה"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <Button
                onClick={analyzeImage}
                disabled={!selectedFile || !selectedRiskId || analyzing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מנתח תמונה...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 ml-2" />
                    נתח תמונה
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>תוצאות ניתוח</CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResult && !analyzing && (
                <div className="text-center py-12 text-slate-500">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>העלה תמונה כדי לקבל ניתוח AI</p>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-purple-600 animate-spin" />
                  <p className="text-slate-600">מנתח את התמונה...</p>
                  <p className="text-sm text-slate-500 mt-2">זה עשוי לקחת כמה שניות</p>
                </div>
              )}

              {analysisResult && !analysisResult.error && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">ניתוח הושלם בהצלחה</span>
                    </div>
                    <div className="text-sm text-green-700">
                      רמת ביטחון: {analysisResult.confidence}%
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">מפגעים שזוהו:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysisResult.hazards_detected?.map((hazard, idx) => (
                        <Badge key={idx} variant="destructive">
                          {hazard}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">חומרת המצב:</Label>
                    <p className="text-sm text-slate-700 mt-1">
                      {analysisResult.severity_description}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">סבירות מומלצת (AI):</Label>
                    <div className="mt-1">
                      <Badge className="text-lg">{analysisResult.recommended_likelihood}/4</Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">המלצה לפעולה:</Label>
                    <p className="text-sm text-slate-700 mt-1">
                      {analysisResult.recommended_action}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">פרטים מלאים:</Label>
                    <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded">
                      {analysisResult.details}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    ℹ️ הסיכון עודכן אוטומטית עם תוצאות הניתוח
                  </div>
                </div>
              )}

              {analysisResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
                  <p className="text-red-800 font-semibold">{analysisResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">🤖 איך זה עובד?</h3>
            <ol className="space-y-2 text-sm text-slate-700">
              <li>1️⃣ בחר סיכון קיים מהרשימה</li>
              <li>2️⃣ העלה תמונה של המפגע</li>
              <li>3️⃣ המערכת משתמשת ב-AI כדי לזהות מפגעי בטיחות</li>
              <li>4️⃣ קבל המלצה אוטומטית לרמת הסיכון</li>
              <li>5️⃣ הסיכון מתעדכן אוטומטית במערכת</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}