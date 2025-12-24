import { RiskSeverity, RiskStatus, CATEGORIES, STATUS_LABELS, SEVERITY_LABELS } from '@/types/risk';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface RiskFiltersProps {
  filters: {
    search: string;
    status: RiskStatus | 'ALL';
    severity: RiskSeverity | 'ALL';
    category: string;
  };
  onFiltersChange: (filters: RiskFiltersProps['filters']) => void;
}

export function RiskFilters({ filters, onFiltersChange }: RiskFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== 'ALL' ||
    filters.severity !== 'ALL' ||
    filters.category;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'ALL',
      severity: 'ALL',
      category: '',
    });
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש סיכונים..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pr-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as RiskStatus | 'ALL' })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity filter */}
        <Select
          value={filters.severity}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, severity: value as RiskSeverity | 'ALL' })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="חומרה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הרמות</SelectItem>
            {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={filters.category || 'ALL'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, category: value === 'ALL' ? '' : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הקטגוריות</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="ml-1 h-4 w-4" />
            נקה פילטרים
          </Button>
        )}
      </div>
    </div>
  );
}
