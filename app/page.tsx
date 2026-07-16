"use client";

import { useState, useCallback } from "react";
import api from "@/app/lib/api";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<string>("Q1");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<any>(null);

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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
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
    formData.append("year", year.toString());
    formData.append("quarter", quarter);

    try {
      const res = await api.post(`/import/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setUploadResult(res.data);
      setUploadStatus("success");
    } catch (err: any) {
      console.error(err);
      setUploadResult({ message: err.response?.data?.detail || "An unexpected error occurred during import." });
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
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
              Dealer Schemes Data Import
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload dealer data spreadsheets (e.g. testData.xlsx) to populate tables in PostgreSQL.
            </p>
          </div>
        </div>

        {/* DATA IMPORT CARD */}
        <Card className="shadow-xl border border-white/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Import excel file</CardTitle>
            <CardDescription className="text-sm mt-1">
              Select the context details (Year & Quarter) below. They will be appended automatically to the parsed `sale-report` data rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* YEAR & QUARTER SELECTORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sales Report Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sales Report Quarter</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="Q1">Q1 (April - June)</option>
                  <option value="Q2">Q2 (July - September)</option>
                  <option value="Q3">Q3 (October - December)</option>
                  <option value="Q4">Q4 (January - March)</option>
                </select>
              </div>
            </div>

            {/* DROPZONE */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                isDragActive ? "border-blue-500 bg-blue-50/55 dark:bg-blue-900/20" : "border-zinc-200 hover:border-blue-400 hover:bg-muted/50 dark:border-zinc-800",
                file && "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10"
              )}
            >
              <input {...getInputProps()} />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                    <p className="font-semibold text-base text-foreground">Click to upload or drag and drop</p>
                    <p className="text-sm mt-0.5">Excel file with sheet structures</p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => { setFile(null); setUploadStatus("idle"); setUploadResult(null); }}
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
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">Import Successful</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80">
                    {uploadResult.message} Detailed tables processed:
                  </p>
                  <ul className="text-xs space-y-1.5 text-emerald-800/90 dark:text-emerald-400/70 list-disc list-inside">
                    {Object.entries(uploadResult.details || {}).map(([sheet, details]: [string, any]) => (
                      <li key={sheet}>
                        <span className="font-semibold">{sheet}</span> &rarr; Table <code className="bg-emerald-100/50 dark:bg-emerald-900/35 px-1.5 py-0.5 rounded">{details.table_name}</code> ({details.rows_inserted} rows, {details.columns.length} columns)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {uploadStatus === "error" && uploadResult && (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-base">Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                    {uploadResult.message || "File upload failed. Ensure the server is running."}
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
