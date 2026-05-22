import React, { useState } from "react";
import { Sparkles, Brain, AlertCircle, TrendingUp, AlertTriangle, ArrowRight, Lightbulb, BarChart3, HelpCircle, CheckCircle } from "lucide-react";
import * as Lucide from "lucide-react";
import { Dataset, AIAnalysisResult, AIMetric, CustomChart } from "../types";

interface AISummaryProps {
  dataset: Dataset;
  onAddAIChart: (chart: CustomChart) => void;
}

// Dynamically render a Lucide icon based on name
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Lucide as any)[name] || Lucide.Activity;
  return <IconComponent className={className} />;
}

// Custom simple parser to render basic markdown elements into clean beautiful JSX
function ElegantMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-slate-300 font-sans leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return <h4 key={idx} className="text-sm font-semibold text-slate-200 mt-4 border-b border-[#27272A] pb-1">{trimmed.substring(3).trim()}</h4>;
        }
        if (trimmed.startsWith("##")) {
          return <h3 key={idx} className="text-base font-bold text-slate-100 mt-5 border-l-2 border-sky-500 pl-2.5">{trimmed.substring(2).trim()}</h3>;
        }
        if (trimmed.startsWith("#")) {
          return <h2 key={idx} className="text-lg font-bold text-slate-50 mt-6 tracking-tight">{trimmed.substring(1).trim()}</h2>;
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <li key={idx} className="list-inside list-disc text-slate-330 ml-2 pl-1 my-1">
              {trimmed.substring(1).trim()}
            </li>
          );
        }
        if (trimmed === "") return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-xs text-slate-300 antialiased">{trimmed}</p>;
      })}
    </div>
  );
}

export default function AISummary({ dataset, onAddAIChart }: AISummaryProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Robust default sample result when API key is missing, to satisfy standard preview demo flow
  const loadDemoSummary = () => {
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      let demoResult: AIAnalysisResult;

      if (dataset.id === "preset_retail") {
        demoResult = {
          summary: "## Analisis Eksekutif Retail Hub Q1 2026\nDalam periode Q1 2026, Penjualan Ritel Hub mencatatkan kinerja total yang solid. Namun, terdapat kesenjangan keuntungan yang signifikan di beberapa lini produk akibat rasio diskon yang terlalu agresif di wilayah tertentu.\n\n### Temuan Utama:\n- **Electronics Mendominasi**: Kategori Electronics menyumbang porsi terbesar omset ritel, dipimpin oleh pesanan laptop dan smartwatch.\n- **Kebocoran Margin**: Adanya beberapa baris transaksi dengan diskon di atas 20% menyebabkan keuntungan anjlok hampir mendekati titik impas untuk produk Furniture.\n- **Deteksi Anomali**: Ditemukan transaksi ekstrim bernilai abnormal pada baris ke-42 yang mendistorsi pembacaan rata-rata kuartal.",
          metrics: [
            { label: "Total Proyeksi Omset", value: "Rp 102.5M", change: "+14.2%", suffix: "Ritel Total", iconName: "BadgeDollarSign" },
            { label: "Rasio Margin Bersih", value: "18.4%", change: "-2.1%", suffix: "Target 20%", iconName: "TrendingUp" },
            { label: "Anomali Transaksi", value: "2 Terdeteksi", change: "Tertangani", suffix: "Data Cleansed", iconName: "AlertTriangle" },
            { label: "Tingkat Kepuasan", value: "91.2%", change: "+0.8%", suffix: "Sangat Puas", iconName: "Users" }
          ],
          findings: [
            { title: "Rekomendasi Kontrol Diskon", description: "Segmentasi diskon pada produk Furniture di atas kriteria 15% harus dibatasi secara ketat karena korelasi margin di wilayah Surabaya anjlok drastis.", badgeSeverity: "warning" },
            { title: "Outlier Distorsi Dibersihkan", description: "Masalah baris outlier diestimasi berasal dari salah entri data kasir, pembersihan dinamis berhasil memulihkan integritas visualisasi tren utama.", badgeSeverity: "success" }
          ],
          recommendedCharts: [
            { type: "line", title: "Tren Penjualan Terhadap Tanggal Transaksi", xAxisColumn: "Tanggal", yAxisColumn: "Penjualan", reason: "Membantu stakeholder memantau sebaran fluktuasi omset harian secara objektif pasca-pembersihan." },
            { type: "bar", title: "Analisis Keuntungan Berdasarkan Kategori", xAxisColumn: "Kategori", yAxisColumn: "Keuntungan", reason: "Sangat efektif melihat perbandingan profit margin murni di seluruh kategori produk." }
          ],
          forecast: "Berdasarkan pemodelan musiman di periode Q1, performa penjualan diproyeksikan tumbuh 4.8% pada Q2 2026 dengan dorongan promosi di pertengahan tahun khususnya untuk kategori Electronics dan Apparel."
        };
      } else if (dataset.id === "preset_health") {
        demoResult = {
          summary: "## Analisis Klinis Metrik Kesehatan Pasien\nLaporan ini mengevaluasi status klinis vitalitas dari 120 pasien terdaftar. Fokus utama ditujukan pada anomali tekanan darah ekstrem serta menguji korelasi indeks masa tubuh (BMI) terhadap risiko kolesterol tinggi.\n\n### Temuan Utama:\n- **Kondisi Hipertensi**: Sejumlah pasien paruh baya menyisakan data Tekanan Sistolik di atas 140 mmHg yang memerlukan evaluasi klinis lanjutan.\n- **Distribusi BMI**: Sebagian besar profil berat badan pasien berkumpul pada klasifikasi 'Kelebihan Berat' (BMI 23-27).\n- **Asosiasi Kolesterol**: Rekaman nilai klinis nol telah dinetralisir untuk menyajikan rata-rata sebaran yang akurat.",
          metrics: [
            { label: "Rata-rata BMI Pasien", value: "24.8", change: "+1.2%", suffix: "Overweight", iconName: "Activity" },
            { label: "Alarm Sistolik Tinggi", value: "15 Pasien", change: "Risiko Tinggi", suffix: "Kritis", iconName: "AlertTriangle" },
            { label: "Kolesterol Rerata", value: "192 mg/dL", change: "-0.5%", suffix: "Normal-Tinggi", iconName: "Heart" },
            { label: "Pemeriksaan Valid", value: "118 Data", change: "100%", suffix: "Sesuai", iconName: "CheckCircle" }
          ],
          findings: [
            { title: "Sistolik Ekstrim", description: "Terdeteksi pasien dengan tekanan darah 240/140 mmHg pada baris 15. Ini merupakan anomali medis kritis yang membutuhkan isolasi tindak darurat penanganan hiperkrisis.", badgeSeverity: "danger" },
            { title: "Korelasi Berat & Klinik", description: "Pasien dengan status obesitas memperlihatkan kolesterol rerata di atas 210 mg/dL, menyarankan pentingnya perbaikan menu katering klinik.", badgeSeverity: "info" }
          ],
          recommendedCharts: [
            { type: "scatter", title: "Korelasi Umur Terhadap Tekanan Sistolik", xAxisColumn: "Umur", yAxisColumn: "Tekanan_Sistolik", reason: "Sangat baik untuk memetakan distribusi pola penuaan terhadap tekanan darah sistolik vital." },
            { type: "bar", title: "Deskripsi BMI Berdasarkan Status Pasien", xAxisColumn: "Status", yAxisColumn: "BMI", reason: "Melihat rata-rata BMI yang terkonsentrasi di setiap klasifikasi status berat badan secara representatif." }
          ],
          forecast: "Prediksi model linear menyiratkan peningkatan rata-rata rujukan pemeriksaan klinik sebesar 8% pada triwulan berikutnya karena tren peningkatan kesadaran skrining preventif pasien."
        };
      } else {
        demoResult = {
          summary: "## Laporan Analisis Telemetri Server & IoT Ops\nHasil pindaian metrik dari server internal mendeteksi reliabilitas kluster yang tinggi dengan rasio packet loss yang relatif minimal pada operasional standar harian. Namun, terdapat anomali lonjakan suhu fatal di beberapa node.\n\n### Detail Temuan:\n- **Node Alpha Stabil**: Server Node-Alpha menunjukkan beban CPU konstan tanpa lonjakan temperatur berlebihan.\n- **Anomali Overheat**: Node-Beta mencatatkan kegagalan sensor suhu di baris ke-11 yang melaporkan suhu abnormal 98.4°C disertai lonjakan latency ekstrim.",
          metrics: [
            { label: "Rata-Rata CPU Load", value: "62.5%", change: "+3.4%", suffix: "Kapasitas Aman", iconName: "Cpu" },
            { label: "Packet Loss Maks", value: "1.5%", change: "Target < 2.0%", suffix: "Bagus", iconName: "Activity" },
            { label: "Temuan Overheat", value: "1 Kasus", change: "Teratasi", suffix: "Hardware Alarm", iconName: "Flame" },
            { label: "Rerata Latency MS", value: "32 ms", change: "-4 ms", suffix: "Responsif", iconName: "Clock" }
          ],
          findings: [
            { title: "Critical Overheat Alarm", description: "Sensor merekam 98.4°C di baris 11. Karakteristik ini menunjukkan indikasi kuat kegagalan kipas pendingin server utama yang memicu throttling kecepatan.", badgeSeverity: "danger" },
            { title: "Lag Latensi IoT Teratasi", description: "Setiap paket sensor mati bernilai 0 ms telah difilter demi ketepatan performa komputasi kluster asinkron.", badgeSeverity: "success" }
          ],
          recommendedCharts: [
            { type: "line", title: "Uji Rentang CPU Terhadap Temperatur C", xAxisColumn: "CPU_Usage_Pct", yAxisColumn: "Temperatur_C", reason: "Cocok untuk membuktikan hipotesis apakah panas server berkorelasi langsung dengan beban kerja CPU." },
            { type: "bar", title: "Perbandingan Latensi Menurut ID Server", xAxisColumn: "Server_ID", yAxisColumn: "Latency_MS", reason: "Grafik representatif membandingkan keandalan latensi antar mesin komputer." }
          ],
          forecast: "Model telemetri memprediksi bahwa kapasitas memori fisik akan mendekati ambang beban 88% di akhir semester jika jumlah agen IoT bertambah dengan laju konstan."
        };
      }

      setAnalysisResult(demoResult);
      setLoading(false);
    }, 1200);
  };

  const executeAIAnalysis = async () => {
    setErrorMsg(null);
    setLoading(true);

    // Limit statistical description size sent to server for speed and token footprint efficiency
    const sampleRows = dataset.rows.slice(0, 10);
    const simplifiedColumns = dataset.columns.map(c => ({ name: c.name, type: c.type }));
    
    // Compute simple overview ranges for each numeric field to help Gemini form accurate calculations
    const statsSummary: Record<string, any> = {};
    dataset.columns.forEach(col => {
      if (col.isNumeric) {
        const values = dataset.rows.map(r => r[col.name]).filter(v => typeof v === "number" && v !== null);
        if (values.length > 0) {
          statsSummary[col.name] = {
            mean: parseFloat((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
          };
        }
      }
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName: dataset.name,
          sampleRows,
          columns: simplifiedColumns,
          rowCount: dataset.rows.length,
          statsSummary,
          customPrompt
        }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        // Handle gracefully if key is missing or invalid/leaked on server
        const errorText = data.error || "";
        if (errorText.includes("GEMINI_API_KEY")) {
          setErrorMsg("Server mendeteksi kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi. Anda harus menambahkannya di Settings > Secrets panel.");
          setLoading(false);
        } else if (
          errorText.includes("leaked") ||
          errorText.includes("bocor") ||
          errorText.includes("tidak valid") ||
          errorText.includes("PERMISSION_DENIED")
        ) {
          setErrorMsg(errorText);
          setLoading(false);
        } else {
          throw new Error(errorText || "Gagal menghubungi mesin kecerdasan buatan DataPulse AI.");
        }
        return;
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Gagal melangsungkan Analisis AI: ${err.message || "Periksa server log."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendedChart = (rec: { type: string; title: string; xAxisColumn: string; yAxisColumn: string }) => {
    const chart: CustomChart = {
      id: `ai_chart_${Date.now()}`,
      type: rec.type as any,
      title: rec.title,
      xAxisColumn: rec.xAxisColumn,
      yAxisColumn: rec.yAxisColumn,
      colorScheme: rec.type === "line" ? "indigo" : rec.type === "bar" ? "emerald" : rec.type === "pie" ? "violet" : "rose"
    };
    onAddAIChart(chart);
  };  return (
    <div id="ai-summary-section" className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl relative overflow-hidden mb-8">
      {/* Visual glowing border */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500" />
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Brain className="w-5 h-5 text-sky-450 animate-pulse" />
          DataPulse AI Copilot & Executive Assistant
        </h3>
        <span className="flex items-center gap-1.5 text-3xs font-mono text-sky-400 font-semibold uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
          <Sparkles className="w-3 h-3 text-sky-300" />
          Powered by Gemini
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-5 leading-normal">
        Synthesize insights automatically. System will trigger advanced LLM parameters to clean data patterns and formulate business strategies in rich Indonesian text format.
      </p>

      {/* Target prompt focus input */}
      <div className="bg-[#020617] p-4 rounded-xl border border-[#27272A] mb-6 space-y-3">
        <div>
          <label className="block text-3xs font-mono uppercase text-slate-500 mb-1.5 font-bold">Fokus Analisis Tambahan (Opsional)</label>
          <input
            type="text"
            id="ai-analyst-focus-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Contoh: Fokus rekomendasikan perbaikan margin produk Furniture di Surabaya..."
            className="w-full bg-[#18181B] text-slate-100 border border-[#27272A] rounded-lg px-3 py-2 text-xs focus:border-sky-500/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            id="trigger-ai-btn"
            onClick={executeAIAnalysis}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            {loading ? "Menyusun Analisis..." : "Jalankan Analisis Gemini AI"}
          </button>

          {/* Fallback load demo button if keys are empty or before running */}
          <button
            id="trigger-demo-ai-btn"
            onClick={loadDemoSummary}
            disabled={loading}
            className="bg-[#18181B] hover:bg-slate-800 text-slate-300 py-2 px-3.5 rounded-lg text-xs font-medium transition-all cursor-pointer border border-[#27272A] flex items-center gap-1"
          >
            <Brain className="w-3.5 h-3.5" />
            Load Presets Demo (Offline)
          </button>
        </div>
      </div>

      {/* Error Warnings or missing configs */}
      {errorMsg && (
        <div className="bg-[#020617] rounded-xl p-5 border border-amber-500/25 mb-6 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-200">Kunci API Gemini Belum Terpasang</h4>
              <p className="text-slate-400 text-2xs leading-relaxed">
                Platform membutuhkan variabel lingkungan <code className="bg-slate-900 border border-[#27272A] px-1 py-0.5 rounded text-sky-400 font-mono">GEMINI_API_KEY</code> terpasang di dalam panel rahasia pengembang. Tenang! Anda tetap dapat menguji modul analytics ini dengan me-load contoh rekonstruksi wawasan sukses kami.
              </p>
              <button
                onClick={loadDemoSummary}
                className="bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 font-semibold px-3 py-1.5 rounded transition-all text-2xs cursor-pointer"
              >
                Gunakan Contoh Demo Analisis Sukses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Display Results container */}
      {analysisResult && (
        <div id="ai-results-panel" className="space-y-6 border-t border-[#27272A] pt-6 animate-fade-in">
          {/* Executive KPI Summary Columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analysisResult.metrics.map((metric, i) => (
              <div key={i} className="bg-[#18181B] p-4 rounded-xl border border-[#27272A] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xs text-slate-500 font-mono tracking-wider font-bold">{metric.label.toUpperCase()}</span>
                    <DynamicIcon name={metric.iconName} className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{metric.value}</div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-3xs font-semibold">
                  <span className={metric.change.startsWith("+") ? "text-emerald-400 bg-emerald-500/10 px-1 rounded" : metric.change.includes("Tertangani") || metric.change.includes("100") ? "text-teal-400 bg-teal-400/10 px-1 rounded" : "text-rose-400 bg-rose-500/10 px-1 rounded"}>
                    {metric.change}
                  </span>
                  <span className="text-slate-500 truncate" title={metric.suffix}>{metric.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary and Forecast Column split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Main executive report summary */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#1E293B]/70 to-[#0F172A]/70 border border-sky-500/20 p-6 rounded-xl font-sans shadow-inner">
              <span className="text-3xs font-mono font-bold text-sky-450 uppercase tracking-widest block mb-1">
                EXECUTIVE BRIEF REPORT
              </span>
              <ElegantMarkdown text={analysisResult.summary} />
            </div>

            {/* Right col: OLS Forecast and strategic pointers */}
            <div className="space-y-4">
              {/* AI Forecast card */}
              <div className="bg-sky-950/20 p-5 rounded-xl border border-sky-950/60 text-xs text-slate-200">
                <span className="text-3xs font-mono font-bold text-sky-400 uppercase block mb-1">
                  AI OUTLOOK & FORECAST
                </span>
                <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Proyeksi Kinerja Kedepan
                </h4>
                <p className="text-slate-300 leading-relaxed font-sans text-2xs">
                  {analysisResult.forecast}
                </p>
              </div>

              {/* Recommended Visualization automated buttons */}
              <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] space-y-3">
                <span className="text-3xs font-mono font-bold text-slate-500 uppercase block">
                  SUGGESTED VISUAL DECK
                </span>
                <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Rekomendasi Plot Grafik AI
                </h4>

                <div className="space-y-2.5 pt-1">
                  {analysisResult.recommendedCharts.map((rec, idx) => (
                    <div key={idx} className="bg-[#020617] border border-[#27272A] rounded-lg p-2.5 text-3xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 uppercase font-mono bg-slate-950 px-1.5 py-0.5 rounded text-4xs">
                          {rec.type} : {rec.yAxisColumn}
                        </span>
                        <button
                          onClick={() => handleApplyRecommendedChart(rec)}
                          className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          Terapkan <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-slate-400 font-sans leading-normal">
                        <strong>{rec.title}</strong>: {rec.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Severity Badge Bulletins / Bullet critical findings */}
          <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A]">
            <span className="text-3xs font-mono font-bold text-slate-500 uppercase block mb-3.5">
              CRITICAL BULLETINS & ANOMALIES
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.findings.map((fin, idx) => {
                const isDanger = fin.badgeSeverity === "danger";
                const isWarning = fin.badgeSeverity === "warning";
                const isSuccess = fin.badgeSeverity === "success";

                const bgClass = isDanger ? "bg-rose-500/10 border-rose-500/25" : isWarning ? "bg-amber-500/10 border-amber-500/25" : isSuccess ? "bg-emerald-500/10 border-emerald-500/25" : "bg-[#09090B] border-[#27272A]";
                const titleClass = isDanger ? "text-rose-400" : isWarning ? "text-amber-400" : isSuccess ? "text-emerald-400" : "text-sky-450";

                return (
                  <div key={idx} className={`p-4 rounded-lg border ${bgClass} text-xs leading-relaxed`}>
                     <div className="flex items-center gap-2 mb-1.5">
                      {isDanger ? <AlertCircle className="w-4 h-4 text-rose-400" /> : isWarning ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Lightbulb className="w-4 h-4 text-emerald-400" />}
                      <h4 className={`font-semibold ${titleClass}`}>{fin.title}</h4>
                    </div>
                    <p className="text-slate-400 font-sans text-2xs leading-normal">
                      {fin.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
