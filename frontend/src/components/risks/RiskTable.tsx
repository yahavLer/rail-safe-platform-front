import { Link } from 'react-router-dom';
import { Risk, STATUS_LABELS, SEVERITY_LABELS } from '@/types/risk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Eye, Edit, MapPin, Image, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface RiskTableProps {
  risks: Risk[];
}

const severityBadgeStyles = {
  CRITICAL: 'bg-risk-critical-bg text-risk-critical border-risk-critical/20',
  HIGH: 'bg-risk-high-bg text-risk-high border-risk-high/20',
  MEDIUM: 'bg-risk-medium-bg text-risk-medium border-risk-medium/20',
  LOW: 'bg-risk-low-bg text-risk-low border-risk-low/20',
};

const statusBadgeStyles = {
  NEW: 'bg-status-new/10 text-status-new border-status-new/20',
  IN_PROGRESS: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
  MITIGATED: 'bg-status-mitigated/10 text-status-mitigated border-status-mitigated/20',
  CLOSED: 'bg-status-closed/10 text-status-closed border-status-closed/20',
};

const slaStyles = {
  ON_TIME: 'text-risk-low',
  AT_RISK: 'text-risk-medium',
  OVERDUE: 'text-risk-critical',
};

export function RiskTable({ risks }: RiskTableProps) {
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
          {risks.map((risk, index) => (
            <TableRow
              key={risk.id}
              className={cn(
                'transition-colors hover:bg-muted/50 animate-fade-in',
                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell className="max-w-[250px]">
                <div className="flex items-center gap-2">
                  {risk.imageUrl && (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium line-clamp-1">{risk.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {risk.category}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-lg font-bold">{risk.score}</span>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={cn('text-xs', severityBadgeStyles[risk.severity])}
                >
                  {SEVERITY_LABELS[risk.severity]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={cn('text-xs', statusBadgeStyles[risk.status])}
                >
                  {STATUS_LABELS[risk.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {risk.siteName && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {risk.siteName}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {risk.assignedToName || '—'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {risk.slaStatus && (
                  <span className={cn('text-sm font-medium', slaStyles[risk.slaStatus])}>
                    {risk.slaStatus === 'ON_TIME' && 'בזמן'}
                    {risk.slaStatus === 'AT_RISK' && 'בסיכון'}
                    {risk.slaStatus === 'OVERDUE' && 'חריגה'}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {risk.aiProcessedAt && (
                  <div className="flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link to={`/risks/${risk.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link to={`/risks/${risk.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
