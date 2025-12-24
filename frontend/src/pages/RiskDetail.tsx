import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockRisks } from '@/data/mockData';
import { ImageUpload } from '@/components/risks/ImageUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  STATUS_LABELS,
  SEVERITY_LABELS,
  LIKELIHOOD_LABELS,
  IMPACT_LABELS,
} from '@/types/risk';
import {
  ArrowRight,
  MapPin,
  Calendar,
  User,
  Clock,
  Bot,
  Camera,
  FileText,
  Shield,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const severityStyles = {
  CRITICAL: 'bg-risk-critical-bg text-risk-critical border-risk-critical/20',
  HIGH: 'bg-risk-high-bg text-risk-high border-risk-high/20',
  MEDIUM: 'bg-risk-medium-bg text-risk-medium border-risk-medium/20',
  LOW: 'bg-risk-low-bg text-risk-low border-risk-low/20',
};

const statusStyles = {
  NEW: 'bg-status-new/10 text-status-new border-status-new/20',
  IN_PROGRESS: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
  MITIGATED: 'bg-status-mitigated/10 text-status-mitigated border-status-mitigated/20',
  CLOSED: 'bg-status-closed/10 text-status-closed border-status-closed/20',
};

export default function RiskDetail() {
  const { id } = useParams();
  const risk = mockRisks.find((r) => r.id === id);
  const [activeTab, setActiveTab] = useState('details');

  if (!risk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-2">סיכון לא נמצא</h2>
        <p className="text-muted-foreground mb-4">הסיכון המבוקש אינו קיים במערכת</p>
        <Button asChild>
          <Link to="/risks">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימה
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/risks">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{risk.title}</h1>
            <p className="text-muted-foreground mt-1">
              נוצר ב-{format(new Date(risk.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn('text-sm', severityStyles[risk.severity])}>
            {SEVERITY_LABELS[risk.severity]}
          </Badge>
          <Badge variant="outline" className={cn('text-sm', statusStyles[risk.status])}>
            {STATUS_LABELS[risk.status]}
          </Badge>
          <Button variant="outline" asChild>
            <Link to={`/risks/${risk.id}/edit`}>
              <Edit className="ml-2 h-4 w-4" />
              עריכה
            </Link>
          </Button>
        </div>
      </div>

      {/* Score display */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center">
          <p className="text-sm text-muted-foreground">ציון סיכון</p>
          <p className="text-4xl font-bold text-primary mt-1">{risk.score}</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-sm text-muted-foreground">סבירות</p>
          <p className="text-2xl font-bold mt-1">{risk.likelihood}</p>
          <p className="text-xs text-muted-foreground">
            {LIKELIHOOD_LABELS[risk.likelihood as keyof typeof LIKELIHOOD_LABELS]}
          </p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-sm text-muted-foreground">השפעה</p>
          <p className="text-2xl font-bold mt-1">{risk.impact}</p>
          <p className="text-xs text-muted-foreground">
            {IMPACT_LABELS[risk.impact as keyof typeof IMPACT_LABELS]}
          </p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-sm text-muted-foreground">קטגוריה</p>
          <p className="text-lg font-semibold mt-1">{risk.category}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            פרטים
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            תמונות ו-AI
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            בקרות
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            היסטוריה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Description */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold mb-4">תיאור הסיכון</h3>
              <p className="text-muted-foreground leading-relaxed">
                {risk.description}
              </p>
            </div>

            {/* Metadata */}
            <div className="card-elevated p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">פרטים נוספים</h3>
              
              {risk.siteName && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">מיקום</p>
                    <p className="font-medium">{risk.siteName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">נוצר על ידי</p>
                  <p className="font-medium">{risk.createdByName}</p>
                </div>
              </div>

              {risk.assignedToName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">אחראי</p>
                    <p className="font-medium">{risk.assignedToName}</p>
                  </div>
                </div>
              )}

              {risk.dueDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">תאריך יעד</p>
                    <p className="font-medium">
                      {format(new Date(risk.dueDate), 'dd/MM/yyyy', { locale: he })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current image */}
            {risk.imageUrl && (
              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold mb-4">תמונה קיימת</h3>
                <img
                  src={risk.imageUrl}
                  alt={risk.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                {/* AI Analysis from existing data */}
                {risk.aiDescription && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">ניתוח AI</span>
                      {risk.aiConfidence && (
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(risk.aiConfidence)}% ביטחון)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.aiDescription}</p>
                    {risk.aiLikelihood && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">סבירות מוצעת: </span>
                        <span className="font-semibold">{risk.aiLikelihood}/4</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload new image */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold mb-4">העלאת תמונה חדשה</h3>
              <p className="text-sm text-muted-foreground mb-4">
                צלם או העלה תמונה של המפגע. המערכת תנתח אותה אוטומטית ותזהה סיכונים אפשריים.
              </p>
              <ImageUpload
                onAnalysisComplete={(analysis) => {
                  console.log('Analysis completed:', analysis);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="mt-6">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-4">בקרות מוצעות</h3>
            <p className="text-muted-foreground">
              טרם הוגדרו בקרות לסיכון זה. לחץ כאן להוספת בקרות מספריית הבקרות.
            </p>
            <Button className="mt-4">
              <Shield className="ml-2 h-4 w-4" />
              הוסף בקרות
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-4">היסטוריית שינויים</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-border">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm font-medium">סיכון נוצר</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(risk.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })} • {risk.createdByName}
                  </p>
                </div>
              </div>
              {risk.aiProcessedAt && (
                <div className="flex items-start gap-3 pb-4 border-b border-border">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="text-sm font-medium">ניתוח AI הושלם</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(risk.aiProcessedAt), 'dd/MM/yyyy HH:mm', { locale: he })} • מערכת
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
                <div>
                  <p className="text-sm font-medium">עדכון אחרון</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(risk.updatedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
