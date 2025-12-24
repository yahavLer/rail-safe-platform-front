import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RiskTable } from '@/components/risks/RiskTable';
import { RiskFilters } from '@/components/risks/RiskFilters';
import { Button } from '@/components/ui/button';
import { mockRisks } from '@/data/mockData';
import { RiskSeverity, RiskStatus } from '@/types/risk';
import { Plus, Download } from 'lucide-react';

export default function RisksList() {
  const [filters, setFilters] = useState<{
    search: string;
    status: RiskStatus | 'ALL';
    severity: RiskSeverity | 'ALL';
    category: string;
  }>({
    search: '',
    status: 'ALL',
    severity: 'ALL',
    category: '',
  });

  const filteredRisks = useMemo(() => {
    return mockRisks.filter((risk) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          risk.title.toLowerCase().includes(searchLower) ||
          risk.description.toLowerCase().includes(searchLower) ||
          risk.siteName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'ALL' && risk.status !== filters.status) {
        return false;
      }

      // Severity filter
      if (filters.severity !== 'ALL' && risk.severity !== filters.severity) {
        return false;
      }

      // Category filter
      if (filters.category && risk.category !== filters.category) {
        return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ניהול סיכונים</h1>
          <p className="mt-1 text-muted-foreground">
            {filteredRisks.length} סיכונים מוצגים
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="ml-2 h-4 w-4" />
            יצוא CSV
          </Button>
          <Button asChild>
            <Link to="/risks/new">
              <Plus className="ml-2 h-4 w-4" />
              סיכון חדש
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <RiskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <RiskTable risks={filteredRisks} />
    </div>
  );
}
