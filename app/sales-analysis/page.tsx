"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/app/lib/api";
import { DynamicDataTable } from "@/components/dynamic-data-table";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [salesAnalysisData, setSalesAnalysisData] = useState<{
    columns: string[];
    rows: any[];
    summary: {
      total_old: number;
      total_new: number;
      delta: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showOnlyUnderperforming, setShowOnlyUnderperforming] = useState(false);

  const fetchSalesAnalysis = async () => {
    try {
      console.log("Fetching sales analysis...");
      setLoading(true);
      setError(null);
      const res = await api.get("/import/sales-outcome");
      
      const rawRows = res.data?.rows || [];
      const rawCols = res.data?.columns || [];

      // Calculate achievement percentage for each row
      const processedRows = rawRows.map((row: any) => {
        const sales = Number(row.month_sales);
        const target = Number(row.monthly_target);
        const achievement =
          !isNaN(sales) && !isNaN(target) && target > 0
            ? (sales / target) * 100
            : null;
        return {
          ...row,
          achievement_pct: achievement,
        };
      });

      const processedCols = rawCols.includes("achievement_pct")
        ? rawCols
        : [...rawCols, "achievement_pct"];

      setSalesAnalysisData({
        ...res.data,
        columns: processedCols,
        rows: processedRows,
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to load calculated sales analysis. Ensure the required data sheets are imported first."
      );
      setSalesAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAnalysis();
  }, []);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await api.get("/import/sales-outcome/download", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sales-outcome.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export calculations. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatNumber = (val: number) => {
    if (!Number.isFinite(val)) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isBelowTarget = (row: any) => {
    const sales = Number(row.month_sales);
    const target = Number(row.monthly_target);
    if (isNaN(sales) || isNaN(target) || target <= 0) return false;
    return sales < 0.95 * target;
  };

  const underperformingCount = useMemo(() => {
    if (!salesAnalysisData) return 0;
    return salesAnalysisData.rows.filter(isBelowTarget).length;
  }, [salesAnalysisData]);

  const displayRows = useMemo(() => {
    if (!salesAnalysisData) return [];
    if (showOnlyUnderperforming) {
      return salesAnalysisData.rows.filter(isBelowTarget);
    }
    return salesAnalysisData.rows;
  }, [salesAnalysisData, showOnlyUnderperforming]);

  const getRowClassName = (row: any) => {
    if (isBelowTarget(row)) {
      return "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-950 dark:text-red-100 border-l-4 border-l-red-500 font-medium";
    }
    return "";
  };

  const renderCell = (col: string, val: any, row: any) => {
    if (col === "achievement_pct") {
      if (val === null || val === undefined || isNaN(val)) {
        return <span className="text-muted-foreground">-</span>;
      }
      const isUnder = val < 95;
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors",
            isUnder
              ? "bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-300 border border-red-200 dark:border-red-800"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          )}
        >
          {isUnder ? (
            <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          {val.toFixed(1)}%
        </span>
      );
    }

    if (col === "month_sales" || col === "monthly_target" || col === "quarter_target") {
      if (val === null || val === undefined) return "-";
      const numVal = Number(val);
      if (isNaN(numVal)) return String(val);
      return (
        <span
          className={cn(
            "font-semibold",
            col === "month_sales" && isBelowTarget(row)
              ? "text-red-700 dark:text-red-300"
              : "text-foreground"
          )}
        >
          {formatNumber(numVal)}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-[1680px] space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sales Analysis Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review sales outcome calculations, target achievements, and underperforming records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border bg-card"
              onClick={fetchSalesAnalysis}
              disabled={loading}
              title="Refresh sales analysis"
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!salesAnalysisData || loading || isDownloading || salesAnalysisData.rows.length === 0}
              className="h-10 gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-md shadow-emerald-500/15 hover:bg-emerald-700"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export Analysis Excel</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/50">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* SUMMARY CARDS */}
        {salesAnalysisData && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card/65 shadow-md backdrop-blur-xl transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Monthly Sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {formatNumber(salesAnalysisData.summary.total_old)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Combined monthly sales volume from imported sales data.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/65 shadow-md backdrop-blur-xl transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Monthly Target
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {formatNumber(salesAnalysisData.summary.total_new)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Combined monthly target volume derived from uploaded targets.
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "border-border bg-card/65 shadow-md backdrop-blur-xl transition-shadow hover:shadow-lg",
                salesAnalysisData.summary.delta >= 0
                  ? "border-l-4 border-l-emerald-500"
                  : "border-l-4 border-l-rose-500"
              )}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Delta Variance (Sales - Target)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "flex items-center gap-2 text-2xl font-bold md:text-3xl",
                    salesAnalysisData.summary.delta >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  <span>{formatNumber(salesAnalysisData.summary.delta)}</span>
                  {salesAnalysisData.summary.delta >= 0 && (
                    <TrendingDown className="h-5 w-5 shrink-0" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {salesAnalysisData.summary.delta >= 0
                    ? "Overall sales are above target for the period"
                    : "Overall sales are below target for the period"}
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "border-border bg-card/65 shadow-md backdrop-blur-xl transition-shadow hover:shadow-lg border-l-4",
                underperformingCount > 0 ? "border-l-red-500 bg-red-50/30 dark:bg-red-950/10" : "border-l-emerald-500"
              )}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Underperforming (&lt;95% Target)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "flex items-center gap-2 text-2xl font-bold md:text-3xl",
                    underperformingCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  <span>{underperformingCount}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    / {salesAnalysisData.rows.length} records
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {underperformingCount > 0
                    ? `${((underperformingCount / salesAnalysisData.rows.length) * 100).toFixed(0)}% of monthly sales fell below 95% target`
                    : "All monthly sales met or exceeded 95% target"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DATA TABLE SECTION */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">Calculating sales analysis...</p>
          </div>
        ) : salesAnalysisData ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* FILTER TOGGLES & LEGEND BAR */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
                  <Filter className="h-3.5 w-3.5" /> Filter Rows:
                </span>
                <Button
                  variant={!showOnlyUnderperforming ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyUnderperforming(false)}
                  className="h-8 rounded-lg text-xs font-semibold"
                >
                  All Records ({salesAnalysisData.rows.length})
                </Button>
                <Button
                  variant={showOnlyUnderperforming ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyUnderperforming(true)}
                  className={cn(
                    "h-8 rounded-lg text-xs font-semibold gap-1.5",
                    !showOnlyUnderperforming &&
                      underperformingCount > 0 &&
                      "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Below 95% Target Only ({underperformingCount})
                </Button>
              </div>

              {/* LEGEND */}
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded bg-red-400/80 border border-red-500" />
                <span>Highlighted Light Red = Monthly Sale &lt; 95% of Target</span>
              </div>
            </div>

            {/* DYNAMIC DATA TABLE */}
            <DynamicDataTable
              columns={salesAnalysisData.columns}
              rows={displayRows}
              getRowClassName={getRowClassName}
              renderCell={renderCell}
            />
          </div>
        ) : (
          !error && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/10 py-20 text-center">
              <BarChart2 className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-lg font-semibold">No sales outcome generated</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Import your spreadsheet data on the home page first to see sales outcome results.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
