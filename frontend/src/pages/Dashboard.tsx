import { StatsCard } from '@/components/dashboard/StatsCard';
import { RiskMatrix } from '@/components/dashboard/RiskMatrix';
import { RecentRisks } from '@/components/dashboard/RecentRisks';
import { mockRisks, mockDashboardStats } from '@/data/mockData';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingDown,
  Shield,
} from 'lucide-react';

export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
        <p className="mt-1 text-muted-foreground">
          סקירה כללית של מצב הסיכונים במערכת
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="סה״כ סיכונים"
          value={stats.totalRisks}
          icon={Shield}
          variant="default"
        />
        <StatsCard
          title="קריטיים"
          value={stats.criticalRisks}
          icon={AlertCircle}
          variant="critical"
        />
        <StatsCard
          title="גבוהים"
          value={stats.highRisks}
          icon={AlertTriangle}
          variant="high"
        />
        <StatsCard
          title="בטיפול"
          value={stats.inProgressRisks}
          icon={Clock}
          variant="medium"
        />
        <StatsCard
          title="חריגי SLA"
          value={stats.overdueRisks}
          icon={TrendingDown}
          variant={stats.overdueRisks > 0 ? 'critical' : 'low'}
        />
        <StatsCard
          title="הופחתו החודש"
          value={stats.mitigatedThisMonth}
          icon={CheckCircle}
          variant="low"
        />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Matrix */}
        <RiskMatrix risks={mockRisks} />

        {/* Recent Risks */}
        <RecentRisks risks={mockRisks} />
      </div>
    </div>
  );
}
