// src/pages/ReportsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { FileText, Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { riskService } from "@/api/services/riskService";
import { DEFAULT_ORG_ID } from "@/api/config";

type RiskBoundary = any;

function toDateInputValue(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function parseDateSafe(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function classificationLabel(c: string) {
  switch (c) {
    case "EXTREME_RED":
      return "קריטי";
    case "HIGH_ORANGE":
      return "גבוה";
    case "MEDIUM_YELLOW":
      return "בינוני";
    case "LOW_GREEN":
      return "נמוך";
    default:
      return c;
  }
}

function statusLabel(s: string) {
  // אם יש לך STATUS_LABELS – אפשר להחליף לזה
  switch (s) {
    case "REQUIRES_TREATMENT":
      return "נדרש טיפול";
    case "IN_TREATMENT":
      return "בטיפול";
    case "MITIGATED":
      return "בוצע";
    default:
      return s;
  }
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] ?? {});

  const escape = (v: any) => {
    const s = String(v ?? "");
    const needsQuotes = /[,"\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const orgId = DEFAULT_ORG_ID || (import.meta as any)?.env?.VITE_ORG_ID;

  const [risks, setRisks] = useState<RiskBoundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // פילטר תאריכים (לקוח)
  const [from, setFrom] = useState(() => toDateInputValue(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));

  useEffect(() => {
    if (!orgId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await riskService.list({ orgId });
        setRisks(data);
      } catch (e: any) {
        console.error(e);
        setError("נכשלה טעינת דוחות. בדקי שהשרת זמין ושיש OrgId תקין.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const filtered = useMemo(() => {
    const dFrom = parseDateSafe(from);
    const dTo = parseDateSafe(to);

    return risks.filter((r) => {
      const created = parseDateSafe(r.createdAt) ?? parseDateSafe(r.updatedAt);
      if (!created) return true;

      if (dFrom && created < new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate())) return false;
      if (dTo) {
        const end = new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate(), 23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [risks, from, to]);

  const byClassification = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      const key = r.classification ?? "UNKNOWN";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [filtered]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      const key = r.status ?? "UNKNOWN";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const total = filtered.length;
    const critical = byClassification["EXTREME_RED"] ?? 0;
    const high = byClassification["HIGH_ORANGE"] ?? 0;
    const medium = byClassification["MEDIUM_YELLOW"] ?? 0;
    const low = byClassification["LOW_GREEN"] ?? 0;
    return { total, critical, high, medium, low };
  }, [filtered.length, byClassification]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const rows = filtered.map((r) => ({
      id: r.id,
      title: r.title,
      classification: r.classification,
      status: r.status,
      riskScore: r.riskScore,
      frequencyLevel: r.frequencyLevel,
      severityLevel: r.severityLevel,
      categoryCode: r.categoryCode,
      location: r.location ?? "",
      createdAt: r.createdAt ?? "",
      updatedAt: r.updatedAt ?? "",
    }));

    downloadCsv(`reports_risks_${format(new Date(), "yyyyMMdd_HHmm")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold">דוחות</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            פילוח מצב הסיכונים (לפי טווח תאריכים)
          </p>
          {loading && <p className="mt-2 text-sm text-muted-foreground">טוען נתונים…</p>}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="ml-2 h-4 w-4" />
            יצוא CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סינון לפי תאריך</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="w-[220px]">
            <label className="text-sm text-muted-foreground">מתאריך</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="w-[220px]">
            <label className="text-sm text-muted-foreground">עד תאריך</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end text-sm text-muted-foreground">
            מוצגים {filtered.length} מתוך {risks.length}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="סה״כ" value={totals.total} icon={FileText} />
        <StatsCard title="קריטיים" value={totals.critical} icon={FileText} variant="critical" />
        <StatsCard title="גבוהים" value={totals.high} icon={FileText} variant="high" />
        <StatsCard title="בינוניים" value={totals.medium} icon={FileText} variant="medium" />
        <StatsCard title="נמוכים" value={totals.low} icon={FileText} variant="low" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פילוח לפי סיווג</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">סיווג</TableHead>
                  <TableHead className="text-right">כמות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byClassification)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => (
                    <TableRow key={key}>
                      <TableCell className="text-right">
                        <Badge variant="outline">{classificationLabel(key)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פילוח לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">כמות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => (
                    <TableRow key={key}>
                      <TableCell className="text-right">
                        <Badge variant="outline">{statusLabel(key)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סיכונים בטווח — תצוגה מהירה</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {filtered.slice(0, 8).map((r: any) => (
            <div key={r.id} className="flex justify-between border-b py-2">
              <span className="font-medium text-foreground">{r.title}</span>
              <span>
                {classificationLabel(r.classification)} • {statusLabel(r.status)} • מדד {r.riskScore}
                {" • "}
                {r.createdAt ? format(new Date(r.createdAt), "d MMM yyyy", { locale: he }) : ""}
              </span>
            </div>
          ))}
          {!filtered.length && <div>אין נתונים לטווח התאריכים שנבחר.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
