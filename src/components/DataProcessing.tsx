import React, { useState, useMemo } from "react";
import { Sliders, RefreshCw, FileText, Download, Check, AlertTriangle, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dataset } from "../types";
import { cleanDataset, convertToCSV } from "../utils";

interface DataProcessingProps {
  dataset: Dataset;
  onDatasetUpdated: (dataset: Dataset) => void;
}

export default function DataProcessing({ dataset, onDatasetUpdated }: DataProcessingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showLogs, setShowLogs] = useState(false);
  const [columnFilter, setColumnFilter] = useState<string>("all");
  const itemsPerPage = 8;

  const runETL = () => {
    const cleaned = cleanDataset(dataset);
    onDatasetUpdated(cleaned);
    setShowLogs(true);
  };

  const downloadCSV = () => {
    const csvContent = convertToCSV(dataset.rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `datapulse_${dataset.name}_clean.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe checks for empty or missing rows
  const safeRows = dataset.rows || [];
  const headers = useMemo(() => {
    if (safeRows.length === 0) return [];
    return Object.keys(safeRows[0]);
  }, [safeRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm) return safeRows;
    const lower = searchTerm.toLowerCase();
    return safeRows.filter(row => {
      return headers.some(header => {
        const val = row[header];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      });
    });
  }, [safeRows, searchTerm, headers]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const isDatasetCleaned = dataset.cleaningStats.missingValuesFilled > 0 || dataset.cleaningStats.formattedDatesCount > 0 || dataset.cleaningStats.detectedAnomaliesCount > 0;

  return (
    <div id="data-processing-section" className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl mb-8">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-sky-500/15 text-sky-400 text-3xs font-semibold px-2 py-0.5 rounded font-mono uppercase">
              ETL Engine
            </span>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              Pembersihan & Transformasi Data
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Koreksi baris tanggal bermasalah, interpolasi baris kosong (missing value), serta normalisasi outlier ekstrim secara instan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="run-etl-btn"
            onClick={runETL}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isDatasetCleaned
                ? "bg-[#18181B] text-slate-400 border border-[#27272A] cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/10 active:scale-95 cursor-pointer"
            }`}
            disabled={isDatasetCleaned}
          >
            <RefreshCw className={`w-4 h-4 ${isDatasetCleaned ? "" : "animate-spin"}`} />
            {isDatasetCleaned ? "Data Berhasil Dibersihkan" : "Jalankan ETL & Pembersihan"}
          </button>

          <button
            id="export-csv-btn"
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-[#18181B] hover:bg-slate-800 text-slate-200 border border-[#27272A] px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Unduh CSV Bersih
          </button>
        </div>
      </div>

      {/* Summary of Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#020617] p-4 rounded-lg border border-[#27272A] flex items-center gap-4">
          <div className={`p-3 rounded-md ${dataset.cleaningStats.missingValuesFilled > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-mono uppercase text-slate-500">Nilai Kosong Diestimasi</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {dataset.cleaningStats.missingValuesFilled} <span className="text-xs text-slate-500 font-sans font-normal">sel</span>
            </div>
          </div>
        </div>

        <div className="bg-[#020617] p-4 rounded-lg border border-[#27272A] flex items-center gap-4">
          <div className={`p-3 rounded-md ${dataset.cleaningStats.formattedDatesCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-mono uppercase text-slate-500">Format Tanggal Diselaraskan</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {dataset.cleaningStats.formattedDatesCount} <span className="text-xs text-slate-500 font-sans font-normal">baris</span>
            </div>
          </div>
        </div>

        <div className="bg-[#020617] p-4 rounded-lg border border-[#27272A] flex items-center gap-4">
          <div className={`p-3 rounded-md ${dataset.cleaningStats.detectedAnomaliesCount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-mono uppercase text-slate-500">Koreksi Outlier & Negatif</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {dataset.cleaningStats.detectedAnomaliesCount} <span className="text-xs text-slate-500 font-sans font-normal">kasus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Terminal Clean Logs */}
      {showLogs && dataset.cleaningStats.cleanLog.length > 0 && (
        <div id="etl-logs-terminal" className="mb-6 bg-[#020617] rounded-lg p-4 border border-[#27272A] font-mono text-2xs leading-relaxed text-slate-300">
          <div className="flex justify-between items-center border-b border-[#27272A] pb-2 mb-2">
            <span className="text-sky-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
              Console Log: ETL Parser Pipeline
            </span>
            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-450 font-sans text-3xs cursor-pointer">
              Sembunyikan
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
            {dataset.cleaningStats.cleanLog.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600 shrink-0">[{i+1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dataset Filter & Explorer Table */}
      <div className="bg-[#020617] rounded-lg border border-[#27272A] overflow-hidden">
        <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#09090B]">
          <div className="text-xs font-semibold text-slate-300">
            Pratinjau Explorer Data <span className="text-2xs font-normal text-slate-500 font-mono">({Math.min(filteredRows.length, safeRows.length)} / {safeRows.length} baris cocok)</span>
          </div>

          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari baris data..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#18181B] text-slate-155 pl-8 pr-3 py-1.5 rounded-lg border border-[#27272A] focus:border-sky-500/60 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse divide-y divide-[#27272A]">
            <thead className="bg-[#18181B] text-slate-400 font-mono uppercase text-3xs tracking-wider">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold border-b border-[#27272A]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-slate-300 bg-[#020617]">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {headers.map((h) => {
                      const isNull = row[h] === null || row[h] === undefined;
                      // Determine if cell is potentially anomalous or cleaned
                      const isHighOutlier = typeof row[h] === "number" && h.toLowerCase().includes("penjualan") && row[h] > 10000000;
                      return (
                        <td key={h} className="px-4 py-2.5 font-sans border-b border-[#27272A]/40">
                          {isNull ? (
                            <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-3xs font-mono font-medium">
                              NULL
                            </span>
                          ) : typeof row[h] === "number" ? (
                            <span className={`font-mono ${isHighOutlier ? "text-rose-400 font-semibold" : "text-slate-100"}`}>
                              {row[h].toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="truncate max-w-[200px] block" title={row[h]}>
                              {String(row[h])}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length || 1} className="py-8 text-center text-slate-500">
                    Tidak ada baris data yang cocok dengan kueri pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredRows.length > itemsPerPage && (
          <div className="p-3 bg-[#09090B] border-t border-[#27272A] flex items-center justify-between text-2xs text-slate-400">
            <div>
              Menampilkan <span className="text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span>-
              <span className="text-slate-200">{Math.min(currentPage * itemsPerPage, filteredRows.length)}</span> dari{" "}
              <span className="font-semibold text-slate-200">{filteredRows.length}</span> baris
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 px-2 rounded bg-[#18181B] border border-[#27272A] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <span className="px-2 font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 px-2 rounded bg-[#18181B] border border-[#27272A] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
