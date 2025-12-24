import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low';
}

const variantStyles = {
  default: 'bg-card border-border',
  critical: 'bg-risk-critical-bg border-risk-critical/30',
  high: 'bg-risk-high-bg border-risk-high/30',
  medium: 'bg-risk-medium-bg border-risk-medium/30',
  low: 'bg-risk-low-bg border-risk-low/30',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  critical: 'bg-risk-critical/10 text-risk-critical',
  high: 'bg-risk-high/10 text-risk-high',
  medium: 'bg-risk-medium/10 text-risk-medium',
  low: 'bg-risk-low/10 text-risk-low',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.isPositive ? 'text-risk-low' : 'text-risk-critical'
              )}
            >
              {trend.isPositive ? '↓' : '↑'} {Math.abs(trend.value)}% מהחודש שעבר
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
