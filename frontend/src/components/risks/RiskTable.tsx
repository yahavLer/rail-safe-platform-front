import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RiskBoundary, RiskClassification, RiskStatus } from "@/api/types";
import { riskService } from "@/api/services/riskService";

import { cn } from "@/lib/utils";
import {
  Eye,
  Edit,
  MapPin,
  Bot,
  Image as ImageIcon,
  X,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RiskInlineDetails } from "@/components/risks/RiskInlineDetails";

interface RiskTableProps {
  orgId: string;
  risks: RiskBoundary[];
  categoryNameByCode?: Record<string, string>;
  userLabelById?: Record<string, string>;

  expandedRiskId: string | null;
  onToggleExpand: (riskId: string | null) => void;

  onEditRisk?: (riskId: string) => void;

  onRiskUpdated?: (updated: RiskBoundary) => void;
}

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

const statusBadgeStyles: Partial<Record<RiskStatus, string>> = {
  OPEN: "bg-status-new/10 text-status-new border-status-new/20",
  MITIGATION_PLANNED:
    "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  IN_PROGRESS:
    "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
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

function RiskImageThumbnail({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.open(imageUrl, "_blank", "noopener,noreferrer");
      }}
      className="group inline-flex items-center gap-2"
      title="פתחי תמונה"
    >
      <img
        src={imageUrl}
        alt="תמונת סיכון"
        className="h-10 w-14 rounded-md border object-cover transition-opacity group-hover:opacity-90"
      />
      <span className="text-xs text-primary underline">צפייה</span>
    </button>
  );
}

export function RiskTable({
  orgId,
  risks,
  categoryNameByCode,
  userLabelById,
  expandedRiskId,
  onToggleExpand,
  onEditRisk,
  onRiskUpdated,
}: RiskTableProps) {
  const [rows, setRows] = useState<RiskBoundary[]>(risks);

  useEffect(() => {
    setRows(risks);
  }, [risks]);

  const [statusEditRiskId, setStatusEditRiskId] = useState<string | null>(null);

  function applyRiskUpdate(updated: RiskBoundary) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    onRiskUpdated?.(updated);
  }

  async function updateStatusFromTable(riskId: string, nextStatus: RiskStatus) {
    const prev = rows.find((r) => r.id === riskId);
    if (!prev) return;

    setStatusEditRiskId(null);
    applyRiskUpdate({ ...prev, status: nextStatus });

    try {
      const updated = await riskService.updateStatus(riskId, { status: nextStatus });
      applyRiskUpdate(updated);
    } catch (e) {
      console.error("updateStatusFromTable failed", e);
      applyRiskUpdate(prev);
    }
  }

  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-semibold">שם הסיכון</TableHead>
            <TableHead className="text-right font-semibold">קטגוריה</TableHead>
            <TableHead className="text-center font-semibold">ציון</TableHead>
            <TableHead className="text-center font-semibold">חומרה</TableHead>
            <TableHead className="text-center font-semibold">סטטוס</TableHead>
            <TableHead className="text-right font-semibold">מיקום</TableHead>
            <TableHead className="text-right font-semibold">אחראי הסיכון</TableHead>
            <TableHead className="text-center font-semibold">SLA</TableHead>
            <TableHead className="text-center font-semibold">AI</TableHead>
            <TableHead className="text-center font-semibold">תמונה</TableHead>
            <TableHead className="text-center font-semibold">פעולות</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((risk, index) => {
            const sourceImageUrl = (risk as any).sourceImageUrl as string | undefined;
            const hasImage = Boolean(sourceImageUrl);
            const slaStatus = (risk as any)?.slaStatus as
              | "ON_TIME"
              | "AT_RISK"
              | "OVERDUE"
              | undefined;
            const aiProcessedAt = (risk as any)?.aiProcessedAt as string | undefined;
            const categoryName = categoryNameByCode?.[risk.categoryCode];
            const isExpanded = expandedRiskId === risk.id;

            return (
              <Fragment key={risk.id}>
                <TableRow
                  onClick={() => onToggleExpand(isExpanded ? null : risk.id)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                  aria-expanded={isExpanded}
                >
                  <TableCell className="max-w-[250px]">
                    <div className="flex items-center gap-2">
                      {hasImage && (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="line-clamp-1 font-medium">{risk.title}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className="text-sm text-muted-foreground"
                      title={risk.categoryCode}
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
                    {statusEditRiskId === risk.id ? (
                      <div
                        className="mx-auto flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-[180px]">
                          <Select
                            value={risk.status}
                            onValueChange={(v) =>
                              updateStatusFromTable(risk.id, v as RiskStatus)
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">טיוטה</SelectItem>
                              <SelectItem value="OPEN">פתוח</SelectItem>
                              <SelectItem value="MITIGATION_PLANNED">תכנון מיטיגציה</SelectItem>
                              <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                              <SelectItem value="CLOSED">נסגר</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setStatusEditRiskId(null)}
                          aria-label="סגור שינוי סטטוס"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusEditRiskId(risk.id);
                        }}
                        className="focus:outline-none"
                        title="לחצי לשינוי סטטוס"
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer text-xs",
                            statusBadgeStyles[risk.status] ?? "border-muted/40"
                          )}
                        >
                          {STATUS_LABELS_HE[risk.status]}
                        </Badge>
                      </button>
                    )}
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
                    <span className="text-sm">
                      {risk.riskManagerUserId
                        ? userLabelById?.[risk.riskManagerUserId] ??
                          `${risk.riskManagerUserId.slice(0, 8)}…`
                        : "—"}
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
                    {aiProcessedAt || hasImage ? (
                      <div className="flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <RiskImageThumbnail imageUrl={sourceImageUrl} />
                  </TableCell>

                  <TableCell>
                    <div dir="ltr" className="flex items-center justify-start gap-1">
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
                          <Link
                            to={`/risks/${risk.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}

                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/risks/${risk.id}`} onClick={(e) => e.stopPropagation()}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={11} className="p-0">
                      <div className="border-t">
                        <RiskInlineDetails
                          orgId={orgId}
                          riskId={risk.id}
                          categoryName={categoryName}
                          onClose={() => onToggleExpand(null)}
                          onRiskUpdated={applyRiskUpdate}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}