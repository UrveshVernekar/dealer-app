"use client";

import React, { useState, useEffect } from "react";
import api from "@/app/lib/api";
import { DynamicDataTable } from "@/components/dynamic-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataExplorerPage() {
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch available tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      setError(null);
      const res = await api.get("/import/tables");
      const list = res.data.tables || [];
      setTablesList(list);
      
      // Auto-select first table if any
      if (list.length > 0) {
        setSelectedTable(list[0]);
      } else {
        setTableData(null);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch database tables. Ensure data has been uploaded.");
    } finally {
      setLoadingTables(false);
    }
  };

  // Fetch table data when selectedTable changes
  const fetchTableData = async (tableName: string) => {
    if (!tableName) return;
    try {
      setLoadingData(true);
      setError(null);
      const res = await api.get(`/import/tables/${tableName}`);
      setTableData({
        columns: res.data.columns || [],
        rows: res.data.rows || [],
      });
    } catch (err: any) {
      console.error(err);
      setError(`Failed to load data for table "${tableName}".`);
      setTableData(null);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const handleDownload = async () => {
    if (!selectedTable) return;
    try {
      setIsDownloading(true);
      const res = await api.get(`/import/tables/${selectedTable}/download`, {
        responseType: "blob",
      });
      
      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedTable}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download spreadsheet. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTableHeaderLabel = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1680px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Database Table Explorer
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Browse, search, and export data loaded in PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border bg-card"
              onClick={fetchTables}
              disabled={loadingTables}
              title="Refresh tables list"
            >
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loadingTables && "animate-spin")} />
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!selectedTable || loadingData || isDownloading}
              className="h-10 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/15 gap-2 text-white"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export Excel</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex gap-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-700 dark:text-red-450 font-medium">{error}</p>
          </div>
        )}

        {/* SELECT TABLE CONTROL */}
        <Card className="shadow-md border-border bg-card/65 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Select Active Database Table</CardTitle>
            <CardDescription className="text-xs">
              Choose an imported spreadsheet table. Data rows will be loaded and displayed in the grid below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTables ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">Checking tables...</span>
              </div>
            ) : tablesList.length === 0 ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                No imported tables found. Go to the "Upload Data" page to ingest your spreadsheet.
              </div>
            ) : (
              <div className="w-full max-w-xs">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-sm cursor-pointer"
                >
                  {tablesList.map((t) => (
                    <option key={t} value={t}>
                      {formatTableHeaderLabel(t)} ({t})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TABLE DATA DETAIL */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">Loading table records...</p>
          </div>
        ) : tableData ? (
          <div className="animate-in fade-in duration-300">
            <DynamicDataTable columns={tableData.columns} rows={tableData.rows} />
          </div>
        ) : (
          !error && selectedTable && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center bg-card/10">
              <Database className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-lg font-semibold">No data selected</h3>
              <p className="text-muted-foreground text-sm max-w-xs mt-1">
                Choose a table from the list above to explore rows.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}
