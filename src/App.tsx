import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Database,
  Sliders,
  Activity,
  Award,
  TrendingUp,
  Brain,
  Clock,
  LayoutDashboard,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Dataset, CustomChart } from "./types";
import { PRESET_DATASETS } from "./presets";
import DataIngestion from "./components/DataIngestion";
import DataProcessing from "./components/DataProcessing";
import StatsWorkspace from "./components/StatsWorkspace";
import ChartBuilder from "./components/ChartBuilder";
import AISummary from "./components/AISummary";
import StakeholderDashboard from "./components/StakeholderDashboard";

const INITIAL_CHARTS: CustomChart[] = [
  {
    id: "default_1",
    type: "bar",
    title: "Prospek Penjualan Menurut Kategori Layanan",
    xAxisColumn: "Kategori",
    yAxisColumn: "Penjualan",
    colorScheme: "indigo"
  },
  {
    id: "default_2",
    type: "line",
    title: "Grafik Tren Omset Harian",
    xAxisColumn: "Tanggal",
    yAxisColumn: "Penjualan",
    colorScheme: "emerald"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"analyst" | "stakeholder">("analyst");
  // Load Retail hub Q1 as default dataset for instant preview experience
  const [currentDataset, setCurrentDataset] = useState<Dataset>(() => {
    return PRESET_DATASETS.preset_retail();
  });
  const [customCharts, setCustomCharts] = useState<CustomChart[]>(INITIAL_CHARTS);

  const handleDatasetLoaded = (newDataset: Dataset) => {
    setCurrentDataset(newDataset);
    // Auto populate basic initial chart options target based on new schema
    const numericCols = newDataset.columns.filter(c => c.isNumeric);
    const categoryCols = newDataset.columns.filter(c => !c.isNumeric);
    
    if (numericCols.length > 0 && categoryCols.length > 0) {
      setCustomCharts([
        {
          id: `default_${Date.now()}_1`,
          type: "bar",
          title: `Sebaran ${numericCols[0].name} Berdasarkan ${categoryCols[0].name}`,
          xAxisColumn: categoryCols[0].name,
          yAxisColumn: numericCols[0].name,
          colorScheme: "indigo"
        },
        {
          id: `default_${Date.now()}_2`,
          type: "line",
          title: `Tren Fluktuasi ${numericCols[0].name}`,
          xAxisColumn: "Tanggal" in newDataset.rows[0] ? "Tanggal" : categoryCols[0].name,
          yAxisColumn: numericCols[0].name,
          colorScheme: "emerald"
        }
      ]);
    } else {
      setCustomCharts([]);
    }
  };

  const handleAddChart = (newChart: CustomChart) => {
    setCustomCharts((prev) => [...prev, newChart]);
  };

  const handleRemoveChart = (id: string) => {
    setCustomCharts((prev) => prev.filter(c => c.id !== id));
  };

  const handleUpdateDataset = (updated: Dataset) => {
    setCurrentDataset(updated);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-64 border-r border-[#27272A] bg-[#09090B] flex flex-col shrink-0 hidden md:flex select-none">
        <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">DataPulse</h1>
            <span className="text-[10px] font-semibold text-slate-500 font-mono tracking-wider">ANALYTICS SYSTEM</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10.5px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-2">Main Menu</div>
          
          <button
            onClick={() => setActiveTab("analyst")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              activeTab === "analyst"
                ? "bg-[#18181B] text-white border-[#27272A]"
                : "text-slate-450 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xs">⚙️</span> Ruang Kerja Analyst
          </button>

          <button
            onClick={() => setActiveTab("stakeholder")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              activeTab === "stakeholder"
                ? "bg-[#18181B] text-white border-[#27272A]"
                : "text-slate-450 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xs">📊</span> Dasbor Stakeholder
          </button>

          <div className="pt-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-2">Analyst Modules</div>
          
          <a
            href="#data-ingestion-section"
            onClick={() => setActiveTab("analyst")}
            className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <span className="text-xs">📥</span> Ingest & Presets
          </a>

          <a
            href="#ai-summary-section"
            onClick={() => setActiveTab("analyst")}
            className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <span className="text-xs">🤖</span> AI Insights Copilot
          </a>

          <a
            href="#data-processing-section"
            onClick={() => setActiveTab("analyst")}
            className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <span className="text-xs">🧹</span> ETL Data Processor
          </a>

          <a
            href="#stats-workspace-section"
            onClick={() => setActiveTab("analyst")}
            className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <span className="text-xs">📈</span> ML Parametric Stats
          </a>

          <a
            href="#chart-builder-section"
            onClick={() => setActiveTab("analyst")}
            className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <span className="text-xs">🎨</span> Custom Chart Builder
          </a>
        </nav>

        {/* Alex Rivera profile block */}
        <div className="p-4 border-t border-[#27272A]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#3F3F46] flex items-center justify-center text-xs font-bold text-sky-400">
              AR
            </div>
            <div className="text-2xs">
              <div className="font-semibold text-white">Alex Rivera</div>
              <div className="text-slate-500">Senior Analyst</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-[#020617] h-screen overflow-y-auto">
        
        {/* Top Header navbar */}
        <header className="h-16 border-b border-[#27272A] bg-[#09090B] flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">LIVE</div>
            <h2 className="text-xs font-semibold text-slate-300">
              Sales Performance Analysis & Forecast - <span className="text-white font-bold">{currentDataset.name}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-[#27272A]">
              <button
                onClick={() => setActiveTab("analyst")}
                className={`px-2.5 py-1 rounded text-2xs font-bold ${activeTab === "analyst" ? "bg-[#18181B] text-white border border-[#27272A]" : "text-slate-400"}`}
              >
                Analyst
              </button>
              <button
                onClick={() => setActiveTab("stakeholder")}
                className={`px-2.5 py-1 rounded text-2xs font-bold ${activeTab === "stakeholder" ? "bg-[#18181B] text-white border border-[#27272A]" : "text-slate-400"}`}
              >
                Dashboard
              </button>
            </div>

            <button
              id="export-pdf-action-top"
              onClick={() => {
                const el = document.getElementById("print-pdf-report-btn");
                if (el) {
                  el.click();
                } else {
                  window.print();
                }
              }}
              className="px-4 py-1.5 bg-[#18181B] border border-[#27272A] text-2xs font-medium rounded hover:bg-[#27272A] text-slate-300 transition-colors cursor-pointer"
            >
              Export PDF
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("trigger-ai-btn");
                if (el) el.click();
              }}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-2xs font-medium rounded transition-colors shadow-md shadow-sky-600/10 cursor-pointer"
            >
              Run Model
            </button>
          </div>
        </header>

        {/* Content View Container */}
        <div className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* Quick Context Summary Header */}
          <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#18181B] rounded-lg border border-[#27272A] text-sky-400 flex items-center justify-center">
                <Database className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-3xs text-slate-500 font-mono tracking-wider font-bold uppercase">SET DATA AKTIF</div>
                <h2 className="text-sm font-semibold text-slate-200">{currentDataset.name}</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="bg-[#18181B] p-2 px-3 rounded-lg border border-[#27272A] flex flex-col">
                <span className="text-4xs text-slate-500">FORMAT FILE</span>
                <span className="text-slate-200 font-bold uppercase">CSV Dataset</span>
              </div>
              <div className="bg-[#18181B] p-2 px-3 rounded-lg border border-[#27272A] flex flex-col">
                <span className="text-4xs text-slate-500">JUMLAH BARIS</span>
                <span className="text-sky-400 font-bold">{currentDataset.rowCount} Baris</span>
              </div>
              <div className="bg-[#18181B] p-2 px-3 rounded-lg border border-[#27272A] flex flex-col">
                <span className="text-4xs text-slate-500">ANALYZED BY</span>
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Gemini AI
                </span>
              </div>
            </div>
          </div>

          {activeTab === "analyst" ? (
            /* Ruang Kerja Analyst */
            <div id="analyst-workspace" className="space-y-8 animate-fade-in">
              {/* Step 1: Data Ingestion (CSV upload / Preset choosing) */}
              <DataIngestion
                onDatasetLoaded={handleDatasetLoaded}
                activeDatasetId={currentDataset.id}
              />

              {/* Step 2: AI Copilot Strategic Summary & AI Suggested Infographics */}
              <AISummary
                dataset={currentDataset}
                onAddAIChart={handleAddChart}
              />

              {/* Step 3: ETL & Explorer Table Workspace */}
              <DataProcessing
                dataset={currentDataset}
                onDatasetUpdated={handleUpdateDataset}
              />

              {/* Step 4: Descriptive Statistics & Predictive ML Regression Models */}
              <StatsWorkspace
                dataset={currentDataset}
              />

              {/* Step 5: Dynamic Chart Builder */}
              <ChartBuilder
                dataset={currentDataset}
                customCharts={customCharts}
                onAddChart={handleAddChart}
                onRemoveChart={handleRemoveChart}
              />
            </div>
          ) : (
            /* Ruang Kerja Stakeholder (The simple clean high-impact executive interface) */
            <div id="stakeholder-workspace" className="animate-fade-in">
              <StakeholderDashboard
                dataset={currentDataset}
                customCharts={customCharts}
                onRemoveChart={handleRemoveChart}
              />
            </div>
          )}
        </div>

        {/* Modern Compact Footer */}
        <footer className="border-t border-[#27272A] bg-[#09090B] py-6 px-6 text-center text-3xs text-slate-500 font-mono tracking-wide leading-normal select-none print:hidden">
          <div>
            DATAPULSE INSIGHTS PLATFORM • MVP COGNITIVE SYSTEM
          </div>
          <div className="mt-1 text-slate-600">
            Sophisticated Dark theme pairing with Plus Jakarta Sans & JetBrains Mono typography
          </div>
        </footer>
      </main>
    </div>
  );
}
