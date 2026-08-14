"use client";

import { useState, useCallback } from "react";
import api from "@/app/lib/api";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [monthlyFile, setMonthlyFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [previousYear, setPreviousYear] = useState<number>(new Date().getFullYear() - 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<string>("Q1");
  const [month, setMonth] = useState<string>("April");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMonthly, setIsUploadingMonthly] = useState(false);
  const [isUploadingTarget, setIsUploadingTarget] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [uploadProgressMonthly, setUploadProgressMonthly] = useState<number>(0);
  const [isProcessingMonthly, setIsProcessingMonthly] = useState<boolean>(false);

  const [uploadProgressTarget, setUploadProgressTarget] = useState<number>(0);
  const [isProcessingTarget, setIsProcessingTarget] = useState<boolean>(false);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadStatusMonthly, setUploadStatusMonthly] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadStatusTarget, setUploadStatusTarget] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadResultMonthly, setUploadResultMonthly] = useState<any>(null);
  const [uploadResultTarget, setUploadResultTarget] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadStatus("idle");
      setUploadResult(null);
      setUploadProgress(0);
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
      "application/octet-stream": [".xlsb"],
    },
    maxFiles: 1,
  });

  const onDropMonthly = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setMonthlyFile(acceptedFiles[0]);
      setUploadStatusMonthly("idle");
      setUploadResultMonthly(null);
      setUploadProgressMonthly(0);
      setIsProcessingMonthly(false);
    }
  }, []);

  const {
    getRootProps: getRootPropsMonthly,
    getInputProps: getInputPropsMonthly,
    isDragActive: isDragActiveMonthly,
  } = useDropzone({
    onDrop: onDropMonthly,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
      "application/octet-stream": [".xlsb"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsProcessing(false);
    setUploadStatus("idle");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", previousYear.toString());
    formData.append("quarter", quarter);

    try {
      const res = await api.post(`/import/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent >= 100) {
              setIsProcessing(true);
            }
          }
        },
      });

      setUploadResult(res.data);
      setUploadStatus("success");
    } catch (err: any) {
      console.error(err);
      setUploadResult({
        message:
          err.response?.data?.detail ||
          "An unexpected error occurred during import.",
      });
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleUploadMonthly = async () => {
    if (!monthlyFile) return;

    setIsUploadingMonthly(true);
    setUploadProgressMonthly(0);
    setIsProcessingMonthly(false);
    setUploadStatusMonthly("idle");
    setUploadResultMonthly(null);

    const formData = new FormData();
    formData.append("file", monthlyFile);
    formData.append("year", year.toString());
    formData.append("month", month);

    try {
      const res = await api.post(`/import/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgressMonthly(percent);
            if (percent >= 100) {
              setIsProcessingMonthly(true);
            }
          }
        },
      });

      setUploadResultMonthly(res.data);
      setUploadStatusMonthly("success");
    } catch (err: any) {
      console.error(err);
      setUploadResultMonthly({
        message:
          err.response?.data?.detail ||
          "An unexpected error occurred during import.",
      });
      setUploadStatusMonthly("error");
    } finally {
      setIsUploadingMonthly(false);
      setIsProcessingMonthly(false);
    }
  };

  const onDropTarget = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTargetFile(acceptedFiles[0]);
      setUploadStatusTarget("idle");
      setUploadResultTarget(null);
      setUploadProgressTarget(0);
      setIsProcessingTarget(false);
    }
  }, []);

  const {
    getRootProps: getRootPropsTarget,
    getInputProps: getInputPropsTarget,
    isDragActive: isDragActiveTarget,
  } = useDropzone({
    onDrop: onDropTarget,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
      "application/octet-stream": [".xlsb"],
    },
    maxFiles: 1,
  });

  const handleUploadTarget = async () => {
    if (!targetFile) return;

    setIsUploadingTarget(true);
    setUploadProgressTarget(0);
    setIsProcessingTarget(false);
    setUploadStatusTarget("idle");
    setUploadResultTarget(null);

    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const res = await api.post(`/import/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgressTarget(percent);
            if (percent >= 100) {
              setIsProcessingTarget(true);
            }
          }
        },
      });

      setUploadResultTarget(res.data);
      setUploadStatusTarget("success");
    } catch (err: any) {
      console.error(err);
      setUploadResultTarget({
        message:
          err.response?.data?.detail ||
          "An unexpected error occurred during import.",
      });
      setUploadStatusTarget("error");
    } finally {
      setIsUploadingTarget(false);
      setIsProcessingTarget(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Main Dashboard Header */}
        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-750 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UploadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
              Data Ingestion Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload spreadsheets to populate dealer sales report, monthly sales data, and sales targets in PostgreSQL.
            </p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* SECTION 1: QUARTERLY DATA IMPORT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Actual Sale Data Import (Quarterly)
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Populate historical quarterly sales records.
                </p>
              </div>
            </div>

            <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Import excel file</CardTitle>
                <CardDescription className="text-xs">
                  Select Context Details (Year & Quarter) to be appended to parsed sale-report rows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* YEAR & QUARTER SELECTORS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                      Sales Report Year
                    </label>
                    <Select
                      value={previousYear.toString()}
                      onValueChange={(val) => setPreviousYear(parseInt(val))}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 h-10 text-xs font-semibold outline-none text-left">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                        <SelectItem value="2028">2028</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                      Sales Report Quarter
                    </label>
                    <Select
                      value={quarter}
                      onValueChange={(val) => setQuarter(val)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 h-10 text-xs font-semibold outline-none text-left">
                        <SelectValue placeholder="Select Quarter" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="Q1">Q1 (April - June)</SelectItem>
                        <SelectItem value="Q2">Q2 (July - September)</SelectItem>
                        <SelectItem value="Q3">Q3 (October - December)</SelectItem>
                        <SelectItem value="Q4">Q4 (January - March)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DROPZONE */}
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                    isDragActive
                      ? "border-blue-500 bg-blue-50/55 dark:bg-blue-900/20"
                      : "border-zinc-200 hover:border-blue-400 hover:bg-muted/50 dark:border-zinc-800",
                    file && "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10",
                  )}
                >
                  <input
                    {...getInputProps({
                      accept: ".xlsx, .xls, .xlsb",
                    })}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground max-w-[240px] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        Change file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[11px] mt-0.5">
                          Excel file (.xlsx, .xls, .xlsb)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* UPLOAD PROGRESS BAR */}
                {isUploading && (
                  <div className="space-y-2 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/50">
                    <div className="flex justify-between items-center text-xs font-semibold text-blue-950 dark:text-blue-200">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        {isProcessing
                          ? "Processing & Streaming Records into Database..."
                          : "Uploading File to Server..."}
                      </span>
                      <span className="font-mono">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {isProcessing
                          ? "Executing high-speed PostgreSQL bulk COPY insert..."
                          : file
                          ? `${((file.size * (uploadProgress / 100)) / 1024 / 1024).toFixed(1)} MB / ${(file.size / 1024 / 1024).toFixed(1)} MB`
                          : ""}
                      </span>
                      {uploadProgress < 100 && (
                        <span>{uploadProgress}% transferred</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setUploadStatus("idle");
                      setUploadResult(null);
                      setUploadProgress(0);
                      setIsProcessing(false);
                    }}
                    disabled={!file || isUploading}
                    className="py-3 px-4 rounded-lg text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="py-3 px-4 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        {isProcessing ? "Inserting..." : "Uploading..."}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 font-semibold">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Store</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* STATUS MESSAGES */}
                {uploadStatus === "success" && uploadResult && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900 flex gap-2 items-start text-xs shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-805 dark:text-emerald-300">
                        Import Successful
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                        {uploadResult.message}
                      </p>
                      <ul className="text-[10px] space-y-1 text-emerald-800 dark:text-emerald-400/70 list-disc list-inside">
                        {Object.entries(uploadResult.details || {}).map(
                          ([sheet, details]: [string, any]) => (
                            <li key={sheet}>
                              <span className="font-semibold">{sheet}</span> &rarr;{" "}
                              <code>{details.table_name}</code> ({details.rows_inserted} rows)
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {uploadStatus === "error" && uploadResult && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-250 dark:border-red-900 flex gap-2 items-start text-xs shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-300">
                        Import Failed
                      </h4>
                      <p className="text-[11px] text-red-700 dark:text-red-400/80 mt-0.5">
                        {uploadResult.message || "File upload failed. Ensure server is active."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION 2: MONTHLY SALES DATA IMPORT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Actual Sales Data Import (Monthly)
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Populate date-based monthly sales records.
                </p>
              </div>
            </div>

            <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Import excel file</CardTitle>
                <CardDescription className="text-xs">
                  Select Context Details (Year & Month) to be appended to parsed sale-report rows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* YEAR & MONTH SELECTORS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                      Sales Report Year
                    </label>
                    <Select
                      value={year.toString()}
                      onValueChange={(val) => setYear(parseInt(val))}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 h-10 text-xs font-semibold outline-none text-left">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                        <SelectItem value="2028">2028</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                      Sales Report Month
                    </label>
                    <Select
                      value={month}
                      onValueChange={(val) => setMonth(val)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 h-10 text-xs font-semibold outline-none text-left">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="January">January</SelectItem>
                        <SelectItem value="February">February</SelectItem>
                        <SelectItem value="March">March</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="May">May</SelectItem>
                        <SelectItem value="June">June</SelectItem>
                        <SelectItem value="July">July</SelectItem>
                        <SelectItem value="August">August</SelectItem>
                        <SelectItem value="September">September</SelectItem>
                        <SelectItem value="October">October</SelectItem>
                        <SelectItem value="November">November</SelectItem>
                        <SelectItem value="December">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DROPZONE */}
                <div
                  {...getRootPropsMonthly()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                    isDragActiveMonthly
                      ? "border-blue-500 bg-blue-50/55 dark:bg-blue-900/20"
                      : "border-zinc-200 hover:border-blue-400 hover:bg-muted/50 dark:border-zinc-800",
                    monthlyFile && "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10",
                  )}
                >
                  <input
                    {...getInputPropsMonthly({
                      accept: ".xlsx, .xls, .xlsb",
                    })}
                  />
                  {monthlyFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground max-w-[240px] truncate">
                          {monthlyFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(monthlyFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        Change file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[11px] mt-0.5">
                          Excel file (.xlsx, .xls, .xlsb)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* UPLOAD PROGRESS BAR */}
                {isUploadingMonthly && (
                  <div className="space-y-2 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/50">
                    <div className="flex justify-between items-center text-xs font-semibold text-blue-950 dark:text-blue-200">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        {isProcessingMonthly
                          ? "Processing & Streaming Records into Database..."
                          : "Uploading File to Server..."}
                      </span>
                      <span className="font-mono">{uploadProgressMonthly}%</span>
                    </div>
                    <Progress value={uploadProgressMonthly} className="h-2.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {isProcessingMonthly
                          ? "Executing high-speed PostgreSQL bulk COPY insert..."
                          : monthlyFile
                          ? `${((monthlyFile.size * (uploadProgressMonthly / 100)) / 1024 / 1024).toFixed(1)} MB / ${(monthlyFile.size / 1024 / 1024).toFixed(1)} MB`
                          : ""}
                      </span>
                      {uploadProgressMonthly < 100 && (
                        <span>{uploadProgressMonthly}% transferred</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMonthlyFile(null);
                      setUploadStatusMonthly("idle");
                      setUploadResultMonthly(null);
                      setUploadProgressMonthly(0);
                      setIsProcessingMonthly(false);
                    }}
                    disabled={!monthlyFile || isUploadingMonthly}
                    className="py-3 px-4 rounded-lg text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleUploadMonthly}
                    disabled={!monthlyFile || isUploadingMonthly}
                    className="py-3 px-4 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isUploadingMonthly ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        {isProcessingMonthly ? "Inserting..." : "Uploading..."}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 font-semibold">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Store</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* STATUS MESSAGES */}
                {uploadStatusMonthly === "success" && uploadResultMonthly && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900 flex gap-2 items-start text-xs shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-805 dark:text-emerald-300">
                        Import Successful
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                        {uploadResultMonthly.message}
                      </p>
                      <ul className="text-[10px] space-y-1 text-emerald-800 dark:text-emerald-400/70 list-disc list-inside">
                        {Object.entries(uploadResultMonthly.details || {}).map(
                          ([sheet, details]: [string, any]) => (
                            <li key={sheet}>
                              <span className="font-semibold">{sheet}</span> &rarr;{" "}
                              <code>{details.table_name}</code> ({details.rows_inserted} rows)
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {uploadStatusMonthly === "error" && uploadResultMonthly && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-250 dark:border-red-900 flex gap-2 items-start text-xs shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-805 dark:text-red-300">
                        Import Failed
                      </h4>
                      <p className="text-[11px] text-red-700 dark:text-red-400/80 mt-0.5">
                        {uploadResultMonthly.message || "File upload failed. Ensure server is active."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION 3: SALES TARGET DATA IMPORT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-650 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Sales Target Data Import
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Populate target metrics tables.
                </p>
              </div>
            </div>

            <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Import excel file</CardTitle>
                <CardDescription className="text-xs">
                  Upload target metrics spreadsheet to populate target tables directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* DROPZONE */}
                <div
                  {...getRootPropsTarget()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                    isDragActiveTarget
                      ? "border-blue-500 bg-blue-50/55 dark:bg-blue-900/20"
                      : "border-zinc-200 hover:border-blue-400 hover:bg-muted/50 dark:border-zinc-800",
                    targetFile && "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10",
                  )}
                >
                  <input
                    {...getInputPropsTarget({
                      accept: ".xlsx, .xls, .xlsb",
                    })}
                  />
                  {targetFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground max-w-[240px] truncate">
                          {targetFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(targetFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline">
                        Change file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[11px] mt-0.5">
                          Excel file (.xlsx, .xls, .xlsb)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* UPLOAD PROGRESS BAR */}
                {isUploadingTarget && (
                  <div className="space-y-2 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/50">
                    <div className="flex justify-between items-center text-xs font-semibold text-blue-950 dark:text-blue-200">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        {isProcessingTarget
                          ? "Processing & Streaming Records into Database..."
                          : "Uploading File to Server..."}
                      </span>
                      <span className="font-mono">{uploadProgressTarget}%</span>
                    </div>
                    <Progress value={uploadProgressTarget} className="h-2.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {isProcessingTarget
                          ? "Executing high-speed PostgreSQL bulk COPY insert..."
                          : targetFile
                          ? `${((targetFile.size * (uploadProgressTarget / 100)) / 1024 / 1024).toFixed(1)} MB / ${(targetFile.size / 1024 / 1024).toFixed(1)} MB`
                          : ""}
                      </span>
                      {uploadProgressTarget < 100 && (
                        <span>{uploadProgressTarget}% transferred</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTargetFile(null);
                      setUploadStatusTarget("idle");
                      setUploadResultTarget(null);
                      setUploadProgressTarget(0);
                      setIsProcessingTarget(false);
                    }}
                    disabled={!targetFile || isUploadingTarget}
                    className="py-3 px-4 rounded-lg text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleUploadTarget}
                    disabled={!targetFile || isUploadingTarget}
                    className="py-3 px-4 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isUploadingTarget ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        {isProcessingTarget ? "Inserting..." : "Uploading..."}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 font-semibold">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Store</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* STATUS MESSAGES */}
                {uploadStatusTarget === "success" && uploadResultTarget && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900 flex gap-2 items-start text-xs shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-805 dark:text-emerald-300">
                        Import Successful
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                        {uploadResultTarget.message}
                      </p>
                      <ul className="text-[10px] space-y-1 text-emerald-800 dark:text-emerald-400/70 list-disc list-inside">
                        {Object.entries(uploadResultTarget.details || {}).map(
                          ([sheet, details]: [string, any]) => (
                            <li key={sheet}>
                              <span className="font-semibold">{sheet}</span> &rarr;{" "}
                              <code>{details.table_name}</code> ({details.rows_inserted} rows)
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {uploadStatusTarget === "error" && uploadResultTarget && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-250 dark:border-red-900 flex gap-2 items-start text-xs shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-805 dark:text-red-300">
                        Import Failed
                      </h4>
                      <p className="text-[11px] text-red-700 dark:text-red-400/80 mt-0.5">
                        {uploadResultTarget.message || "File upload failed. Ensure server is active."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
