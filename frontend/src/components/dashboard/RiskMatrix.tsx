import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RiskBoundary, RiskMatrixBoundary, LevelDefinitionBoundary } from "@/api/types";

interface RiskMatrixProps {
  risks: RiskBoundary[];
  matrix?: RiskMatrixBoundary | null;
  onCellClick?: (likelihood: number, impact: number) => void;
}

const getCellColor = (likelihood: number, impact: number): string => {
  const score = likelihood * impact;
  if (score >= 12) return "bg-risk-critical hover:bg-risk-critical/90";
  if (score >= 8) return "bg-risk-high hover:bg-risk-high/90";
  if (score >= 4) return "bg-risk-medium hover:bg-risk-medium/90";
  return "bg-risk-low hover:bg-risk-low/90";
};

function sortAsc(levels: LevelDefinitionBoundary[]) {
  return [...levels].sort((a, b) => a.level - b.level);
}

function fallbackLevels(prefix: string): LevelDefinitionBoundary[] {
  return [1, 2, 3, 4].map((n) => ({
    level: n,
    label: `${prefix} ${n}`,
    description: "",
  }));
}

export function RiskMatrix({ risks, matrix, onCellClick }: RiskMatrixProps) {
  const severityLevels = useMemo(() => {
    const src = matrix?.severityLevels?.length ? matrix.severityLevels : fallbackLevels("חומרה");
    return sortAsc(src); // 1..4 משמאל לימין
  }, [matrix]);

  const frequencyLevelsAsc = useMemo(() => {
    const src = matrix?.frequencyLevels?.length ? matrix.frequencyLevels : fallbackLevels("סבירות");
    return sortAsc(src); // 1..4
  }, [matrix]);

  const frequencyLevelsDesc = useMemo(() => {
    return [...frequencyLevelsAsc].sort((a, b) => b.level - a.level); // 4..1 מלמעלה למטה
  }, [frequencyLevelsAsc]);

  const getRisksInCell = (likelihood: number, impact: number) =>
    risks.filter((r) => r.frequencyLevel === likelihood && r.severityLevel === impact);

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
          <div className="grid grid-cols-5 gap-1">
            {/* Header row */}
            <div />
            {severityLevels.map((sev) => (
              <div
                key={`header-${sev.level}`}
                className="flex h-12 items-center justify-center text-xs font-medium text-muted-foreground"
                title={sev.description || undefined}
              >
                {sev.label}
              </div>
            ))}

            {/* Rows */}
            {frequencyLevelsDesc.map((freq) => (
              <Fragment key={`row-${freq.level}`}>
                {/* Row label */}
                <div
                  className="flex h-20 items-center justify-center text-xs font-medium text-muted-foreground"
                  title={freq.description || undefined}
                >
                  {freq.label}
                </div>

                {/* Cells */}
                {severityLevels.map((sev) => {
                  const likelihood = freq.level;
                  const impact = sev.level;

                  const cellRisks = getRisksInCell(likelihood, impact);
                  const score = likelihood * impact;

                  return (
                    <button
                      key={`${likelihood}-${impact}`}
                      onClick={() => onCellClick?.(likelihood, impact)}
                      className={cn(
                        "relative flex h-20 items-center justify-center rounded-lg transition-all duration-200",
                        getCellColor(likelihood, impact),
                        "cursor-pointer"
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
              </Fragment>
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
