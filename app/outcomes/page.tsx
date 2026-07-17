"use client";

import React, { useState, useEffect } from "react";
import api from "@/app/lib/api";
import { DynamicDataTable } from "@/components/dynamic-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Download, Loader2, AlertCircle, RefreshCw, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SchemeOutcomesPage() {
  const [loading, setLoading] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{
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

  const fetchOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/import/outcome");
      setOutcomeData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Failed to load calculated outcomes. Ensure both 'dealer_sku' and 'new_scheme' data sheets are imported."
      );
      setOutcomeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, []);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await api.get("/import/outcome/download", {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "outcome.xlsx");
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1680px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Scheme Outcomes Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Analyze and export simulated dealer scheme discount deltas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border bg-card"
              onClick={fetchOutcomes}
              disabled={loading}
              title="Recalculate outcomes"
            >
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!outcomeData || loading || isDownloading || outcomeData.rows.length === 0}
              className="h-10 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/15 gap-2 text-white"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export Outcome Excel</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex gap-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-700 dark:text-red-450 font-medium">{error}</p>
          </div>
        )}

        {/* METRICS SUMMARY BLOCK */}
        {outcomeData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* OLD DISCOUNT CARD */}
            <Card className="shadow-md border-border bg-card/65 backdrop-blur-xl hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Old Discount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatCurrency(outcomeData.summary.total_old)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Accumulated discount under original baseline structures
                </p>
              </CardContent>
            </Card>

            {/* NEW DISCOUNT CARD */}
            <Card className="shadow-md border-border bg-card/65 backdrop-blur-xl hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total New Discount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatCurrency(outcomeData.summary.total_new)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Accumulated discount under simulated revised schemes
                </p>
              </CardContent>
            </Card>

            {/* DELTA SAVINGS CARD */}
            <Card className={cn(
              "shadow-md border-border bg-card/65 backdrop-blur-xl hover:shadow-lg transition-shadow",
              outcomeData.summary.delta >= 0 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-rose-500"
            )}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Delta Savings (Old - New)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl md:text-3xl font-bold flex items-center gap-2",
                  outcomeData.summary.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  <span>{formatCurrency(outcomeData.summary.delta)}</span>
                  {outcomeData.summary.delta >= 0 && (
                    <TrendingDown className="w-5 h-5 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {outcomeData.summary.delta >= 0 
                    ? "Reduction in discount payout (positive financial return)"
                    : "Increase in discount payout (negative financial return)"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* OUTCOME DATA GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">Calculating scheme outcomes...</p>
          </div>
        ) : outcomeData ? (
          <div className="animate-in fade-in duration-300">
            <DynamicDataTable columns={outcomeData.columns} rows={outcomeData.rows} />
          </div>
        ) : (
          !error && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center bg-card/10">
              <BarChart2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-lg font-semibold">No outcomes generated</h3>
              <p className="text-muted-foreground text-sm max-w-xs mt-1">
                Import your spreadsheet data on the home page first to see calculation outcomes.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}
