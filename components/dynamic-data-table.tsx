"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicDataTableProps {
  columns: string[];
  rows: any[];
  getRowClassName?: (row: any) => string | undefined;
  renderCell?: (col: string, val: any, row: any) => React.ReactNode;
}

export function DynamicDataTable({ columns, rows, getRowClassName, renderCell }: DynamicDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Reset pagination and filters when columns/rows change (new table selected)
  useEffect(() => {
    setCurrentPage(1);
    setFilters({});
    setSortConfig({ key: "", direction: null });
    setHiddenColumns([]);
  }, [columns, rows]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Identify which columns have numeric data
  const numericColumns = useMemo(() => {
    const set = new Set<string>();
    columns.forEach((col) => {
      // Check first 30 non-null values
      let isNumeric = true;
      let checkedCount = 0;
      for (let i = 0; i < Math.min(30, rows.length); i++) {
        const val = rows[i][col];
        if (val !== undefined && val !== null && val !== "") {
          checkedCount++;
          if (isNaN(Number(val))) {
            isNumeric = false;
            break;
          }
        }
      }
      if (isNumeric && checkedCount > 0) {
        set.add(col);
      }
    });
    return set;
  }, [columns, rows]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((col) => col !== columnId)
        : [...prev, columnId]
    );
  };

  const matchStringFilter = (val: any, filterStr: string): boolean => {
    if (!filterStr) return true;
    if (val === undefined || val === null) return false;
    return String(val).toLowerCase().includes(filterStr.toLowerCase().trim());
  };

  const matchNumericFilter = (val: any, filterStr: string): boolean => {
    if (!filterStr) return true;
    if (val === undefined || val === null || val === "") return false;
    const numVal = Number(val);

    const conditions = filterStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (conditions.length === 0) return true;

    return conditions.every((cond) => {
      const trimmed = cond;

      if (trimmed.startsWith(">=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : numVal >= num;
      }
      if (trimmed.startsWith("<=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : numVal <= num;
      }
      if (trimmed.startsWith("!=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : numVal !== num;
      }
      if (trimmed.startsWith(">")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : numVal > num;
      }
      if (trimmed.startsWith("<")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : numVal < num;
      }
      if (trimmed.startsWith("=")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : numVal === num;
      }

      // Check range formats like "10..20"
      if (trimmed.includes("..")) {
        const parts = trimmed.split("..");
        if (parts.length === 2) {
          const min = parseFloat(parts[0].trim());
          const max = parseFloat(parts[1].trim());
          const matchMin = isNaN(min) ? true : numVal >= min;
          const matchMax = isNaN(max) ? true : numVal <= max;
          return matchMin && matchMax;
        }
      }

      // Fallback simple search
      const num = parseFloat(trimmed);
      return isNaN(num) ? String(val).includes(trimmed) : numVal === num;
    });
  };

  const filteredRows = useMemo(() => {
    let result = [...rows];

    // 1. Global Search Filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        })
      );
    }

    // 2. Column-Level Filters
    Object.entries(filters).forEach(([colKey, filterVal]) => {
      if (!filterVal) return;

      if (numericColumns.has(colKey)) {
        result = result.filter((row) => matchNumericFilter(row[colKey], filterVal));
      } else {
        result = result.filter((row) => matchStringFilter(row[colKey], filterVal));
      }
    });

    return result;
  }, [rows, debouncedSearch, filters, columns, numericColumns]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredRows;

    const { key, direction } = sortConfig;

    return [...filteredRows].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (numericColumns.has(key)) {
        const aNum = aVal === "" ? -Infinity : Number(aVal);
        const bNum = bVal === "" ? -Infinity : Number(bVal);
        return direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig, numericColumns]);

  const paginatedRows = useMemo(() => {
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return sortedRows.slice(start, start + size);
  }, [sortedRows, currentPage, pageSize]);

  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / Number(pageSize));

  const formatHeaderLabel = (colName: string) => {
    return colName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderSortIcon = (key: string) => {
    const isSorted = sortConfig.key === key;
    if (!isSorted) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
    );
  };

  const renderFilterInput = (key: string) => {
    const isNumeric = numericColumns.has(key);
    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
        <Input
          className="h-7 text-xs pl-6 pr-5 bg-background border border-muted-foreground/20 rounded-lg font-normal w-full shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
          value={filters[key] || ""}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          placeholder={isNumeric ? "e.g. >=10, 10..20" : "Search..."}
        />
        {(filters[key] || "").length > 0 && (
          <button
            onClick={() => handleFilterChange(key, "")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] p-0.5 line-none font-bold"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* GLOBAL SEARCH */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search all columns..."
            className="pl-10 h-10 bg-background shadow-sm rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* COLUMN HIDER DROPDOWN */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl h-10 border-border bg-card hover:bg-muted">
              <span>Columns</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 max-h-[400px] overflow-y-auto bg-card border border-border">
            <DropdownMenuLabel className="text-xs">Toggle Column Visibility</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                className="text-xs"
                checked={!hiddenColumns.includes(col)}
                onCheckedChange={() => toggleColumnVisibility(col)}
                onSelect={(e) => e.preventDefault()}
              >
                {formatHeaderLabel(col)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE BOX */}
      <Card className="shadow-lg border-border overflow-hidden bg-card/60 backdrop-blur-xl">
        <div className="overflow-x-auto relative min-h-[250px]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border">
              <TableRow>
                {columns.map((col) => {
                  if (hiddenColumns.includes(col)) return null;
                  return (
                    <TableHead
                      key={col}
                      className="font-medium text-muted-foreground p-3 min-w-[150px] align-middle"
                    >
                      <div className="flex flex-col gap-2">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors font-semibold"
                          onClick={() => handleSort(col)}
                        >
                          <span className="truncate">{formatHeaderLabel(col)}</span>
                          {renderSortIcon(col)}
                        </div>
                        {renderFilterInput(col)}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => !hiddenColumns.includes(c)).length || 1}
                    className="h-48 text-center text-muted-foreground text-sm font-medium"
                  >
                    No matching records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, idx) => {
                  const customRowClass = getRowClassName ? getRowClassName(row) : "";
                  return (
                    <TableRow
                      key={idx}
                      className={cn(
                        "hover:bg-muted/40 transition-colors h-11 border-b border-border/40",
                        customRowClass
                      )}
                    >
                      {columns.map((col) => {
                        if (hiddenColumns.includes(col)) return null;
                        const val = row[col];

                        if (renderCell) {
                          const customCell = renderCell(col, val, row);
                          if (customCell !== undefined && customCell !== null) {
                            return (
                              <TableCell key={col} className="p-3 text-sm font-medium">
                                {customCell}
                              </TableCell>
                            );
                          }
                        }

                        const displayVal =
                          val === null || val === undefined
                            ? "-"
                            : typeof val === "number"
                            ? Number.isInteger(val)
                              ? val.toString()
                              : val.toFixed(2)
                            : String(val);

                        return (
                          <TableCell key={col} className="p-3 text-sm text-foreground/80 font-medium">
                            {displayVal}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm">
          <div className="text-muted-foreground">
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}
            {" - "}
            {Math.min(currentPage * Number(pageSize), totalItems)} of {totalItems} records
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</span>
              <Select value={pageSize} onValueChange={(val) => { setPageSize(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[85px] h-9 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
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
                {currentPage} / {totalPages || 1}
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
  );
}
