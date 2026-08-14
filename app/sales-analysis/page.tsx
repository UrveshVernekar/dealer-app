"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/app/lib/api";
import { DynamicDataTable } from "@/components/dynamic-data-table";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  TrendingDown,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
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

  // Date range and duration filters
  const [duration, setDuration] = useState<"all" | "1m" | "3m" | "6m" | "12m" | "custom">("all");
  const [startPeriod, setStartPeriod] = useState<string>("");
  const [endPeriod, setEndPeriod] = useState<string>("");
  const [globalPeriods, setGlobalPeriods] = useState<Array<{ year: number; month: number; label: string; value: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchSalesAnalysis = async () => {
    try {
      console.log("Fetching sales analysis...");
      setLoading(true);
      setError(null);

      const params: any = { duration };
      if (duration === "custom") {
        if (startPeriod) params.start_period = startPeriod;
        if (endPeriod) params.end_period = endPeriod;
      }

      const res = await api.get("/import/sales-outcome", { params });

      const rawRows = res.data?.rows || [];
      const rawCols = res.data?.columns || [];

      setSalesAnalysisData({
        ...res.data,
        columns: rawCols,
        rows: rawRows,
      });

      if (res.data?.available_categories) {
        setAvailableCategories(res.data.available_categories);
      }

      if (res.data?.periods && res.data.periods.length > 0) {
        setGlobalPeriods(res.data.periods);
        // Only set default start/end periods if they aren't set yet
        if (!startPeriod) {
          setStartPeriod(res.data.periods[res.data.periods.length - 1].value);
        }
        if (!endPeriod) {
          setEndPeriod(res.data.periods[0].value);
        }
      }
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
  }, [duration, duration === "custom" ? `${startPeriod}_${endPeriod}` : "default"]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const params: any = { duration };
      if (duration === "custom") {
        if (startPeriod) params.start_period = startPeriod;
        if (endPeriod) params.end_period = endPeriod;
      }
      const res = await api.get("/import/sales-outcome/download", {
        params,
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
    const categories = ["FL", "TL", "Ref", "AC"];
    return categories.some((cat) => {
      const sales = Number(row[`${cat}_month_sales`]);
      const target = Number(row[`${cat}_monthly_target`]);
      if (isNaN(sales) || isNaN(target) || target <= 0) return false;
      return sales < 0.95 * target;
    });
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

  // Custom Double-Header Table states & hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [salesAnalysisData]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: "", direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredRows = useMemo(() => {
    let rows = displayRows;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row: any) =>
        String(row.sold_to_pt).toLowerCase().includes(q) ||
        String(row.sold_party_name).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [displayRows, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredRows;
    const { key, direction } = sortConfig;
    const isAsc = direction === "asc";

    return [...filteredRows].sort((a: any, b: any) => {
      let aVal = a[key];
      let bVal = b[key];

      if (aVal === null || aVal === undefined) aVal = -Infinity;
      if (bVal === null || bVal === undefined) bVal = -Infinity;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return isAsc ? aVal - bVal : bVal - aVal;
      }
      return isAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;

  const renderPivotedCell = (cat: string, field: string, val: any, row: any) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground">-</span>;

    if (field === "achievement_pct") {
      const isUnder = val < 95;
      const target = Number(row[`${cat}_monthly_target`]);
      if (target <= 0) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm",
            isUnder
              ? "bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-300 border border-red-200 dark:border-red-800"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          )}
        >
          {val.toFixed(1)}%
        </span>
      );
    }

    if (field === "scheme_percentage") {
      if (val === 0) return <span className="text-muted-foreground">-</span>;
      return <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val.toFixed(1)}%</span>;
    }

    if (field === "last_year_fraction_of_quarter") {
      return <span className="text-muted-foreground font-medium">{val.toFixed(3)}</span>;
    }

    if (["quarter_target", "monthly_target", "month_sales"].includes(field)) {
      if (val === 0) return <span className="text-muted-foreground">-</span>;
      const numVal = Number(val);
      const target = Number(row[`${cat}_monthly_target`]);
      const isUnder = field === "month_sales" && target > 0 && numVal < 0.95 * target;
      return (
        <span className={cn("font-semibold", isUnder ? "text-red-700 dark:text-red-400" : "text-foreground")}>
          {formatNumber(numVal)}
        </span>
      );
    }

    return String(val);
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

        {/* CONTROLS BAR */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Duration:
                </span>
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap gap-0.5">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "1m", label: "1 Month" },
                    { id: "3m", label: "3 Months" },
                    { id: "6m", label: "6 Months" },
                    { id: "12m", label: "12 Months" },
                    { id: "custom", label: "Custom Range" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDuration(item.id as any)}
                      className={cn(
                        "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                        duration === item.id
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {duration === "custom" && globalPeriods.length > 0 && (
                <div className="flex items-center gap-2 mt-4 sm:mt-6 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">From</span>
                    <select
                      value={startPeriod}
                      onChange={(e) => setStartPeriod(e.target.value)}
                      className="bg-muted/50 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground cursor-pointer"
                    >
                      {[...globalPeriods].reverse().map((p) => (
                        <option key={`from-${p.value}`} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">To</span>
                    <select
                      value={endPeriod}
                      onChange={(e) => setEndPeriod(e.target.value)}
                      className="bg-muted/50 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground cursor-pointer"
                    >
                      {globalPeriods.map((p) => (
                        <option key={`to-${p.value}`} value={p.value} disabled={p.value < startPeriod}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

            {/* SEARCH AND PAGINATION TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  placeholder="Search dealer code or name..."
                  className="pl-10 h-10 bg-background shadow-sm rounded-xl"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* PIVOTED DOUBLE-HEADER TABLE */}
            <Card className="shadow-lg border-border overflow-hidden bg-card/60 backdrop-blur-xl">
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {/* Header Row 1: Mapped Categories */}
                    <tr className="border-b border-border bg-muted/30">
                      <th rowSpan={2} className="p-3 text-xs font-semibold text-muted-foreground align-middle text-left min-w-[120px] border-r border-border/60">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground" onClick={() => handleSort("sold_to_pt")}>
                          <span>Dealer Code</span>
                          {sortConfig.key === "sold_to_pt" && (sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />)}
                        </div>
                      </th>
                      <th rowSpan={2} className="p-3 text-xs font-semibold text-muted-foreground align-middle text-left min-w-[200px] border-r border-border/60">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground" onClick={() => handleSort("sold_party_name")}>
                          <span>Dealer Name</span>
                          {sortConfig.key === "sold_party_name" && (sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />)}
                        </div>
                      </th>

                      {/* Dynamic Category Groups — only render categories with data */}
                      {availableCategories.map((cat, i) => {
                        const isLast = i === availableCategories.length - 1;
                        const catMeta: Record<string, { label: string; color: string; bg: string }> = {
                          FL: { label: "Front Load (FL)", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/40 dark:bg-blue-950/10" },
                          TL: { label: "Top Load (TL)", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/40 dark:bg-indigo-950/10" },
                          Ref: { label: "Refrigerator (Ref)", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/40 dark:bg-violet-950/10" },
                          AC: { label: "Air Conditioner (AC)", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50/40 dark:bg-teal-950/10" },
                        };
                        const meta = catMeta[cat] ?? { label: cat, color: "", bg: "" };
                        const colSpan = cat === "FL" ? 6 : 4;
                        return (
                          <th
                            key={cat}
                            colSpan={colSpan}
                            className={cn(
                              "p-2.5 text-xs font-bold text-center",
                              meta.color, meta.bg,
                              !isLast && "border-r border-border/80"
                            )}
                          >
                            {meta.label}
                          </th>
                        );
                      })}
                    </tr>

                    {/* Header Row 2: Sub-headers */}
                    <tr className="border-b border-border bg-muted/15 text-[11px] text-muted-foreground font-semibold">
                      {availableCategories.map((cat, i) => {
                        const isLast = i === availableCategories.length - 1;
                        const baseFields = ["quarter_target", "monthly_target", "month_sales", "last_year_fraction_of_quarter", "achievement_pct", "scheme_percentage"];
                        const fields = cat === "FL"
                          ? ["quarter_target", "monthly_target", "month_sales", "last_year_fraction_of_quarter", "achievement_pct", "scheme_percentage"]
                          : baseFields;
                        const fieldLabels: Record<string, string> = {
                          quarter_target: "Qtr Target",
                          monthly_target: "Mth Target",
                          month_sales: "Actual Sales",
                          last_year_fraction_of_quarter: "Fraction",
                          achievement_pct: "Achieved %",
                          scheme_percentage: "Scheme %",
                        };
                        return fields.map((field, fi) => {
                          const isLastField = fi === fields.length - 1;
                          return (
                            <th
                              key={`${cat}_${field}`}
                              className={cn(
                                "p-2 text-center cursor-pointer hover:text-foreground",
                                isLastField && !isLast && "border-r border-border/80"
                              )}
                              onClick={() => handleSort(`${cat}_${field}`)}
                            >
                              {fieldLabels[field] ?? field}
                            </th>
                          );
                        });
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={2 + availableCategories.reduce((acc, cat) => acc + (cat === "FL" ? 6 : 4), 0)} className="h-48 text-center text-muted-foreground text-sm font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row: any, idx: number) => {
                        const customRowClass = getRowClassName ? getRowClassName(row) : "";
                        return (
                          <tr
                            key={idx}
                            className={cn(
                              "hover:bg-muted/40 transition-colors border-b border-border/40 text-xs font-medium h-11",
                              customRowClass
                            )}
                          >
                            <td className="p-3 text-foreground/80 font-semibold border-r border-border/60">{row.sold_to_pt}</td>
                            <td className="p-3 text-foreground/80 font-semibold border-r border-border/60">{row.sold_party_name}</td>

                            {availableCategories.map((cat, i) => {
                              const isLast = i === availableCategories.length - 1;
                              const fields = cat === "FL"
                                ? ["quarter_target", "monthly_target", "month_sales", "last_year_fraction_of_quarter", "achievement_pct", "scheme_percentage"]
                                : ["quarter_target", "monthly_target", "month_sales", "last_year_fraction_of_quarter", "achievement_pct", "scheme_percentage"];
                              return fields.map((field, fi) => {
                                const isLastField = fi === fields.length - 1;
                                const key = `${cat}_${field}`;
                                return (
                                  <td
                                    key={key}
                                    className={cn(
                                      "p-2 text-center",
                                      isLastField && !isLast && "border-r border-border/80"
                                    )}
                                  >
                                    {renderPivotedCell(cat, field, row[key], row)}
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="border-t border-border bg-muted/30 px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm">
                <div className="text-muted-foreground font-medium">
                  Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  {" - "}
                  {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Rows per page</span>
                    <select
                      value={String(pageSize)}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-card border border-border px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-border bg-card"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-3 font-semibold min-w-[3.5rem] text-center">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-border bg-card"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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
