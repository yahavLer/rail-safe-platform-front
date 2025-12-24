import { Link } from 'react-router-dom';
import { Risk, STATUS_LABELS, SEVERITY_LABELS } from '@/types/risk';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface RecentRisksProps {
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

export function RecentRisks({ risks }: RecentRisksProps) {
  const recentRisks = risks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="card-elevated p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">סיכונים אחרונים</h3>
        <Link
          to="/risks"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          הצג הכל
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {recentRisks.map((risk, index) => (
          <Link
            key={risk.id}
            to={`/risks/${risk.id}`}
            className={cn(
              'block rounded-lg border border-border bg-background p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md',
              'animate-slide-up'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground line-clamp-1">
                  {risk.title}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {risk.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {risk.siteName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {risk.siteName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(risk.createdAt), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs', severityBadgeStyles[risk.severity])}
                >
                  {SEVERITY_LABELS[risk.severity]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs', statusBadgeStyles[risk.status])}
                >
                  {STATUS_LABELS[risk.status]}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
