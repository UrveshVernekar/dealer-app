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
    setUploadStatus("idle");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", previousYear.toString());
    formData.append("quarter", quarter);

    try {
      // Axios automatically sets multipart/form-data WITH the correct boundary string
      const res = await api.post(`/import/upload`, formData);

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
    }
  };

  const handleUploadMonthly = async () => {
    if (!monthlyFile) return;

    setIsUploadingMonthly(true);
    setUploadStatusMonthly("idle");
    setUploadResultMonthly(null);

    const formData = new FormData();
    formData.append("file", monthlyFile);
    formData.append("year", year.toString());
    formData.append("month", month);

    try {
      const res = await api.post(`/import/upload`, formData);

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
    }
  };

  const onDropTarget = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTargetFile(acceptedFiles[0]);
      setUploadStatusTarget("idle");
      setUploadResultTarget(null);
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
    setUploadStatusTarget("idle");
    setUploadResultTarget(null);

    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const res = await api.post(`/import/upload`, formData);

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
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Actual Sale Data Import Previous Year (Quarterly)
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload dealer data spreadsheets (e.g. testData.xlsx) to populate
              tables in PostgreSQL.
            </p>
          </div>
        </div>

        {/* DATA IMPORT CARD */}
        <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Import excel file</CardTitle>
            <CardDescription className="text-sm mt-1">
              Select the context details (Year & Quarter) below. They will be
              appended automatically to the parsed `sale-report` data rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* YEAR & QUARTER SELECTORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sales Report Year
                </label>
                <Select
                  value={previousYear.toString()}
                  onValueChange={(val) => setPreviousYear(parseInt(val))}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 h-12 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sales Report Quarter
                </label>
                <Select
                  value={quarter}
                  onValueChange={(val) => setQuarter(val)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 h-12 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left">
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
                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                    Click or drag to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm mt-0.5">
                      Excel file (.xlsx, .xls, .xlsb) with sheet structures
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setUploadStatus("idle");
                  setUploadResult(null);
                }}
                disabled={!file || isUploading}
                className="py-5 px-6 rounded-xl font-medium"
              >
                Clear
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="py-5 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/15"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading & Parsing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <UploadCloud className="w-5 h-5" />
                    <span>Upload & Store Data</span>
                  </div>
                )}
              </Button>
            </div>

            {/* STATUS MESSAGES */}
            {uploadStatus === "success" && uploadResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                    Import Successful
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80">
                    {uploadResult.message} Detailed tables processed:
                  </p>
                  <ul className="text-xs space-y-1.5 text-emerald-800/90 dark:text-emerald-400/70 list-disc list-inside">
                    {Object.entries(uploadResult.details || {}).map(
                      ([sheet, details]: [string, any]) => (
                        <li key={sheet}>
                          <span className="font-semibold">{sheet}</span> &rarr;
                          Table{" "}
                          <code className="bg-emerald-100/50 dark:bg-emerald-900/35 px-1.5 py-0.5 rounded">
                            {details.table_name}
                          </code>{" "}
                          ({details.rows_inserted} rows,{" "}
                          {details.columns.length} columns)
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}

            {uploadStatus === "error" && uploadResult && (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-base">
                    Import Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {uploadResult.message ||
                      "File upload failed. Ensure the server is running."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Actual Sales Data Import (Monthly)
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload dealer data spreadsheets (e.g. testData.xlsx) to populate
              tables in PostgreSQL.
            </p>
          </div>
        </div>

        {/* DATA IMPORT CARD */}
        <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Import excel file</CardTitle>
            <CardDescription className="text-sm mt-1">
              Select the context details (Year & Quarter) below. They will be
              appended automatically to the parsed `sale-report` data rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* YEAR & QUARTER SELECTORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sales Report Year
                </label>
                <Select
                  value={year.toString()}
                  onValueChange={(val) => setYear(parseInt(val))}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 h-12 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sales Report Month
                </label>
                <Select
                  value={month}
                  onValueChange={(val) => setMonth(val)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 h-12 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left">
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
                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {monthlyFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(monthlyFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                    Click or drag to change monthlyFile
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm mt-0.5">
                      Excel monthlyFile (.xlsx, .xls, .xlsb) with sheet structures
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMonthlyFile(null);
                  setUploadStatusMonthly("idle");
                  setUploadResultMonthly(null);
                }}
                disabled={!monthlyFile || isUploadingMonthly}
                className="py-5 px-6 rounded-xl font-medium"
              >
                Clear
              </Button>
              <Button
                onClick={handleUploadMonthly}
                disabled={!monthlyFile || isUploadingMonthly}
                className="py-5 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/15"
              >
                {isUploadingMonthly ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading & Parsing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <UploadCloud className="w-5 h-5" />
                    <span>Upload & Store Data</span>
                  </div>
                )}
              </Button>
            </div>

            {/* STATUS MESSAGES */}
            {uploadStatusMonthly === "success" && uploadResultMonthly && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                    Import Successful
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80">
                    {uploadResultMonthly.message} Detailed tables processed:
                  </p>
                  <ul className="text-xs space-y-1.5 text-emerald-800/90 dark:text-emerald-400/70 list-disc list-inside">
                    {Object.entries(uploadResultMonthly.details || {}).map(
                      ([sheet, details]: [string, any]) => (
                        <li key={sheet}>
                          <span className="font-semibold">{sheet}</span> &rarr;
                          Table{" "}
                          <code className="bg-emerald-100/50 dark:bg-emerald-900/35 px-1.5 py-0.5 rounded">
                            {details.table_name}
                          </code>{" "}
                          ({details.rows_inserted} rows,{" "}
                          {details.columns.length} columns)
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}

            {uploadStatusMonthly === "error" && uploadResultMonthly && (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-base">
                    Import Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {uploadResultMonthly.message ||
                      "File upload failed. Ensure the server is running."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Sales Target Data Import
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload target data spreadsheets (e.g. target_data.xlsx) to populate
              tables in PostgreSQL.
            </p>
          </div>
        </div>

        {/* DATA IMPORT CARD */}
        <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Import excel file</CardTitle>
            <CardDescription className="text-sm mt-1">
              Upload your Target Data spreadsheet sheet to ingest target metrics directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DROPZONE */}
            <div
              {...getRootPropsTarget()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {targetFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(targetFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                    Click or drag to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm mt-0.5">
                      Excel targetFile (.xlsx, .xls, .xlsb) with sheet structures
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTargetFile(null);
                  setUploadStatusTarget("idle");
                  setUploadResultTarget(null);
                }}
                disabled={!targetFile || isUploadingTarget}
                className="py-5 px-6 rounded-xl font-medium"
              >
                Clear
              </Button>
              <Button
                onClick={handleUploadTarget}
                disabled={!targetFile || isUploadingTarget}
                className="py-5 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/15"
              >
                {isUploadingTarget ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading & Parsing...
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <UploadCloud className="w-5 h-5" />
                    <span>Upload & Store Data</span>
                  </div>
                )}
              </Button>
            </div>

            {/* STATUS MESSAGES */}
            {uploadStatusTarget === "success" && uploadResultTarget && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex gap-3 items-start shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                    Import Successful
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80">
                    {uploadResultTarget.message} Detailed tables processed:
                  </p>
                  <ul className="text-xs space-y-1.5 text-emerald-800/90 dark:text-emerald-400/70 list-disc list-inside">
                    {Object.entries(uploadResultTarget.details || {}).map(
                      ([sheet, details]: [string, any]) => (
                        <li key={sheet}>
                          <span className="font-semibold">{sheet}</span> &rarr;
                          Table{" "}
                          <code className="bg-emerald-100/50 dark:bg-emerald-900/35 px-1.5 py-0.5 rounded">
                            {details.table_name}
                          </code>{" "}
                          ({details.rows_inserted} rows,{" "}
                          {details.columns.length} columns)
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}

            {uploadStatusTarget === "error" && uploadResultTarget && (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-base">
                    Import Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {uploadResultTarget.message ||
                      "File upload failed. Ensure the server is running."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
