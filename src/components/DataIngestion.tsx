import React, { useRef, useState } from "react";
import { UploadCloud, FileText, Database, AlertCircle, Sparkles, Check } from "lucide-react";
import { Dataset } from "../types";
import { parseCSV } from "../utils";
import { PRESET_DATASETS } from "../presets";

interface DataIngestionProps {
  onDatasetLoaded: (dataset: Dataset) => void;
  activeDatasetId: string | null;
}

export default function DataIngestion({ onDatasetLoaded, activeDatasetId }: DataIngestionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = [".csv", "text/csv", "application/vnd.ms-excel"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (fileExtension !== ".csv") {
      setErrorMsg("Format berkas tidak didukung. Unggah berkas berformat .csv saja.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, file.name);
        onDatasetLoaded(parsed);
      } catch (err: any) {
        setErrorMsg(`Gagal memparsing CSV: ${err.message || "Pastikan format delimiter dan kolom sesuai."}`);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Gagal membaca berkas.");
    };
    reader.readAsText(file);
  };

  const loadPreset = (key: string) => {
    setErrorMsg(null);
    try {
      const dataset = PRESET_DATASETS[key]();
      onDatasetLoaded(dataset);
    } catch (err: any) {
      setErrorMsg(`Gagal memuat preset: ${err.message}`);
    }
  };

  return (
    <div id="data-ingestion-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Upload Box */}
      <div className="lg:col-span-2 bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 bg-sky-500/10 rounded-bl-xl text-sky-450 font-mono text-2xs uppercase tracking-wider">
          Ingest Module
        </div>
        
        <h3 className="text-lg font-semibold text-slate-150 flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
          File Upload Wizard (Format CSV)
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          Unggah dataset mentah organisasi Anda dalam format baris CSV. Sistem akan membaca, mendeteksi tipe data, dan mempersiapkannya untuk dianalisis oleh AI.
        </p>

        <div
          id="drop-zone-wizard"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-sky-400 bg-sky-500/10 scale-[0.99]"
              : "border-[#27272A] hover:border-slate-700 bg-[#020617] hover:bg-slate-950"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <UploadCloud className={`w-12 h-12 mb-3 transition-colors ${dragActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-450"}`} />
          <p className="text-sm font-medium text-slate-300">
            Tarik & Lepas berkas Anda di sini, atau <span className="text-sky-400 hover:text-sky-300 underline underline-offset-2">pilih file</span>
          </p>
          <p className="text-2xs text-slate-500 mt-2 font-mono">
            Mendukung .CSV (Pemisah koma atau titik koma)
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Preset Dataset Library */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
            <Database className="w-4.5 h-4.5 text-emerald-400" />
            Preset Dataset Pilihan
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
            Tidak membawa file sendiri? Pilih dari perpustakaan data simulasi realistik kami untuk langsung menguji fungsionalitas visualisasi & ringkasan AI.
          </p>

          <div className="space-y-3">
            {/* Retail Preset */}
            <button
              id="preset-retail-btn"
              onClick={() => loadPreset("preset_retail")}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeDatasetId === "preset_retail"
                  ? "bg-sky-600/20 border-sky-500/40 text-sky-200"
                  : "bg-[#18181B] border-[#27272A] hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${activeDatasetId === "preset_retail" ? "bg-sky-500/30 text-sky-300" : "bg-[#09090B] text-slate-400"}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Penjualan Ritel Hub Q1</h4>
                  <p className="text-3xs text-slate-500 font-mono">180 Baris • E-Commerce & Profit</p>
                </div>
              </div>
              {activeDatasetId === "preset_retail" && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
            </button>

            {/* Clinical Health Preset */}
            <button
              id="preset-health-btn"
              onClick={() => loadPreset("preset_health")}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeDatasetId === "preset_health"
                  ? "bg-sky-600/20 border-sky-500/40 text-sky-200"
                  : "bg-[#18181B] border-[#27272A] hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${activeDatasetId === "preset_health" ? "bg-sky-500/30 text-sky-300" : "bg-[#09090B] text-slate-400"}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Metrik Kesehatan Klinik</h4>
                  <p className="text-3xs text-slate-500 font-mono">120 Baris • Tekanan Darah & BMI</p>
                </div>
              </div>
              {activeDatasetId === "preset_health" && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
            </button>

            {/* IoT server Telemetry Preset */}
            <button
              id="preset-iot-btn"
              onClick={() => loadPreset("preset_iot")}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeDatasetId === "preset_iot"
                  ? "bg-sky-600/20 border-sky-500/40 text-sky-200"
                  : "bg-[#18181B] border-[#27272A] hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${activeDatasetId === "preset_iot" ? "bg-sky-500/30 text-sky-300" : "bg-[#09090B] text-slate-400"}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">IoT Telemetri Server Ops</h4>
                  <p className="text-3xs text-slate-500 font-mono">150 Baris • CPU, Latency & Loss</p>
                </div>
              </div>
              {activeDatasetId === "preset_iot" && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#27272A] text-3xs text-slate-500 leading-normal font-sans">
          🔥 Anda dapat mengunduh berkas mana pun kembali setelah menganalisisnya. Data parsing berjalan secara aman di sisi klien.
        </div>
      </div>
    </div>
  );
}
