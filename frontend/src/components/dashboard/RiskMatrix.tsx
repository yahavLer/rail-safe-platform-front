import { cn } from '@/lib/utils';
import { Risk, LIKELIHOOD_LABELS, IMPACT_LABELS } from '@/types/risk';

interface RiskMatrixProps {
  risks: Risk[];
  onCellClick?: (likelihood: number, impact: number) => void;
}

const getCellColor = (likelihood: number, impact: number): string => {
  const score = likelihood * impact;
  if (score >= 12) return 'bg-risk-critical hover:bg-risk-critical/90';
  if (score >= 8) return 'bg-risk-high hover:bg-risk-high/90';
  if (score >= 4) return 'bg-risk-medium hover:bg-risk-medium/90';
  return 'bg-risk-low hover:bg-risk-low/90';
};

export function RiskMatrix({ risks, onCellClick }: RiskMatrixProps) {
  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(
      (r) => r.likelihood === likelihood && r.impact === impact
    );
  };

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-6 text-lg font-semibold">מטריצת סיכונים 4×4</h3>
      
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex w-24 flex-col items-center justify-center">
          <span className="rotate-180 text-sm font-medium text-muted-foreground [writing-mode:vertical-lr]">
            סבירות להתרחשות
          </span>
        </div>

        <div className="flex-1">
          {/* Matrix */}
          <div className="grid grid-cols-5 gap-1">
            {/* Header row */}
            <div /> {/* Empty corner cell */}
            {[1, 2, 3, 4].map((impact) => (
              <div
                key={`header-${impact}`}
                className="flex h-12 items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {IMPACT_LABELS[impact as keyof typeof IMPACT_LABELS]}
              </div>
            ))}

            {/* Matrix rows - from top (4) to bottom (1) */}
            {[4, 3, 2, 1].map((likelihood) => (
              <>
                {/* Row label */}
                <div
                  key={`label-${likelihood}`}
                  className="flex h-20 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {LIKELIHOOD_LABELS[likelihood as keyof typeof LIKELIHOOD_LABELS]}
                </div>

                {/* Cells */}
                {[1, 2, 3, 4].map((impact) => {
                  const cellRisks = getRisksInCell(likelihood, impact);
                  const score = likelihood * impact;

                  return (
                    <button
                      key={`${likelihood}-${impact}`}
                      onClick={() => onCellClick?.(likelihood, impact)}
                      className={cn(
                        'relative flex h-20 items-center justify-center rounded-lg transition-all duration-200',
                        getCellColor(likelihood, impact),
                        'cursor-pointer'
                      )}
                    >
                      <div className="text-center">
                        <span className="text-lg font-bold text-white">{score}</span>
                        {cellRisks.length > 0 && (
                          <div className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md">
                            {cellRisks.length}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            ))}
          </div>

          {/* X-axis label */}
          <div className="mt-4 text-center text-sm font-medium text-muted-foreground">
            השפעה / חומרה
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-risk-critical" />
          <span className="text-xs text-muted-foreground">קריטי (12-16)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-risk-high" />
          <span className="text-xs text-muted-foreground">גבוה (8-11)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-risk-medium" />
          <span className="text-xs text-muted-foreground">בינוני (4-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-risk-low" />
          <span className="text-xs text-muted-foreground">נמוך (1-3)</span>
        </div>
      </div>
    </div>
  );
}
