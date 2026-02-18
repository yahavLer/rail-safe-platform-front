import { Link } from "react-router-dom";
import type { RiskBoundary, RiskClassification, RiskStatus } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, Edit, MapPin, Bot, Image as ImageIcon } from "lucide-react";

interface RiskTableProps {
  risks: RiskBoundary[];
  categoryNameByCode?: Record<string, string>;

  /** Opens drawer (preferred). If not provided, falls back to Link navigation. */
  onViewRisk?: (riskId: string) => void;

  /** Optional: if you want to control edit navigation from parent */
  onEditRisk?: (riskId: string) => void;
}

/** צבעים לפי ה־classification מהשרת */
const classificationBadgeStyles: Record<RiskClassification, string> = {
  EXTREME_RED: "bg-risk-critical-bg text-risk-critical border-risk-critical/20",
  HIGH_ACTION_ORANGE: "bg-risk-high-bg text-risk-high border-risk-high/20",
  TOLERABLE_YELLOW: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  NEGLIGIBLE_GREEN: "bg-risk-low-bg text-risk-low border-risk-low/20",
};

const CLASSIFICATION_LABELS: Record<RiskClassification, string> = {
  EXTREME_RED: "קריטי -קיצוני",
  HIGH_ACTION_ORANGE: "גבוה - נדרש טיפול",
  TOLERABLE_YELLOW: "בינוני - נסבל",
  NEGLIGIBLE_GREEN: "נמוך - זניח",
};

/** סטטוסים לפי RiskStatus מהשרת */
const statusBadgeStyles: Partial<Record<RiskStatus, string>> = {
  OPEN: "bg-status-new/10 text-status-new border-status-new/20",
  MITIGATION_PLANNED: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  IN_PROGRESS: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  CLOSED: "bg-status-closed/10 text-status-closed border-status-closed/20",
  DRAFT: "bg-muted/30 text-muted-foreground border-muted/40",
};
const STATUS_LABELS_HE: Record<RiskStatus, string> = {
  DRAFT: "טיוטה",
  OPEN: "פתוח",
  MITIGATION_PLANNED: "תכנון מיטיגציה",
  IN_PROGRESS: "בטיפול",
  CLOSED: "נסגר",
};

const slaStyles = {
  ON_TIME: "text-risk-low",
  AT_RISK: "text-risk-medium",
  OVERDUE: "text-risk-critical",
} as const;

export function RiskTable({ risks,categoryNameByCode, onViewRisk, onEditRisk }: RiskTableProps) {
  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-semibold">כותרת</TableHead>
            <TableHead className="text-right font-semibold">קטגוריה</TableHead>
            <TableHead className="text-center font-semibold">ציון</TableHead>
            <TableHead className="text-center font-semibold">חומרה</TableHead>
            <TableHead className="text-center font-semibold">סטטוס</TableHead>
            <TableHead className="text-right font-semibold">מיקום</TableHead>
            <TableHead className="text-right font-semibold">אחראי</TableHead>
            <TableHead className="text-center font-semibold">SLA</TableHead>
            <TableHead className="text-center font-semibold">AI</TableHead>
            <TableHead className="text-center font-semibold">פעולות</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {risks.map((risk, index) => {
            // שדות זמניים אם קיימים אצלך במודל עתידי/adapter
            const hasImage = Boolean((risk as any)?.imageUrl);
            const slaStatus = (risk as any)?.slaStatus as "ON_TIME" | "AT_RISK" | "OVERDUE" | undefined;
            const aiProcessedAt = (risk as any)?.aiProcessedAt as string | undefined;
            const categoryName = categoryNameByCode?.[risk.categoryCode];

            return (
              <TableRow
                key={risk.id}
                onClick={() => onViewRisk?.(risk.id)}
                className={cn(
                  "transition-colors hover:bg-muted/50 animate-fade-in",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20",
                  onViewRisk ? "cursor-pointer" : ""
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="max-w-[250px]">
                  <div className="flex items-center gap-2">
                    {hasImage && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium line-clamp-1">{risk.title}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className="text-sm text-muted-foreground"
                    title={risk.categoryCode} // משאיר את הקוד כ-tooltip
                  >
                    {categoryName ?? risk.categoryCode}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="text-lg font-bold">{risk.riskScore}</span>
                </TableCell>

                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", classificationBadgeStyles[risk.classification])}
                  >
                    {CLASSIFICATION_LABELS[risk.classification]}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusBadgeStyles[risk.status] ?? "border-muted/40")}
                  >
                    {STATUS_LABELS_HE[risk.status]}
                  </Badge>
                </TableCell>

                <TableCell>
                  {risk.location ? (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {risk.location}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {/* כרגע אין שם – רק ID (בהמשך נחבר UserService כדי להביא שם) */}
                  <span className="text-sm">
                    {risk.riskManagerUserId ? `${risk.riskManagerUserId.slice(0, 8)}…` : "—"}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  {slaStatus ? (
                    <span className={cn("text-sm font-medium", slaStyles[slaStatus])}>
                      {slaStatus === "ON_TIME" && "בזמן"}
                      {slaStatus === "AT_RISK" && "בסיכון"}
                      {slaStatus === "OVERDUE" && "חריגה"}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  {aiProcessedAt ? (
                    <div className="flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {/* VIEW -> Drawer */}
                    {onViewRisk ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewRisk(risk.id);
                        }}
                        aria-label="צפייה בסיכון"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/risks/${risk.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    {/* EDIT */}
                    {onEditRisk ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRisk(risk.id);
                        }}
                        aria-label="עריכת סיכון"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/risks/${risk.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
