import React, { useMemo } from "react";
import { Download, Printer, BarChart3, TrendingUp, Grid, ShieldAlert, Sparkles, HelpCircle, FileSpreadsheet, Layers } from "lucide-react";
import { Dataset, CustomChart } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface StakeholderDashboardProps {
  dataset: Dataset;
  customCharts: CustomChart[];
  onRemoveChart: (id: string) => void;
}

const PALETTE: Record<string, string[]> = {
  indigo: ["#6366f1", "#818cf8", "#c7d2fe", "#4f46e5", "#3730a3"],
  emerald: ["#10b981", "#34d399", "#a7f3d0", "#059669", "#064e3b"],
  rose: ["#f43f5e", "#fb7185", "#fecdd3", "#e11d48", "#881337"],
  amber: ["#f59e0b", "#fbbf24", "#fef3c7", "#d97706", "#78350f"],
  violet: ["#8b5cf6", "#a78bfa", "#ddd6fe", "#7c3aed", "#4c1d95"]
};

export default function StakeholderDashboard({ dataset, customCharts, onRemoveChart }: StakeholderDashboardProps) {
  
  const handlePrint = () => {
    window.print();
  };

  // Compute overall KPI metrics for general dashboard hero top-bar
  const summaryKPIs = useMemo(() => {
    const kpis = [];
    
    // Check if we can find relevant columns
    const recordCount = dataset.rows.length;
    kpis.push({
      label: "TOTAL ENTRI TERCATAT",
      value: `${recordCount.toLocaleString("id-ID")} Baris`,
      desc: "Dimensi observasi dalam berkas"
    });

    // Try finding numerical columns like Penjualan, Keuntungan, atau CPU
    const numericCols = dataset.columns.filter(c => c.isNumeric);
    
    // Total sum/avg of first numeric column
    if (numericCols.length > 0) {
      const colName = numericCols[0].name;
      const values = dataset.rows.map(r => r[colName]).filter(v => typeof v === "number" && v !== null);
      if (values.length > 0) {
        const sumVal = values.reduce((sum, v) => sum + v, 0);
        const nameUpper = colName.toUpperCase();
        
        let formattedVal = sumVal > 1000000 
          ? `Rp ${(sumVal / 1000000).toFixed(1)}M` 
          : sumVal.toLocaleString("id-ID");
          
        if (colName.toLowerCase().includes("pct") || colName.toLowerCase().includes("loss")) {
          const avgVal = sumVal / values.length;
          formattedVal = `${avgVal.toFixed(1)}%`;
        }

        kpis.push({
          label: `SUM/AVG [${nameUpper}]`,
          value: formattedVal,
          desc: `Akumulasi total nilai sebaran ${colName}`
        });
      }
    }

    // Try finding another numerical column for second key KPI
    if (numericCols.length > 1) {
      const colName = numericCols[1].name;
      const values = dataset.rows.map(r => r[colName]).filter(v => typeof v === "number" && v !== null);
      if (values.length > 0) {
        const sumVal = values.reduce((sum, v) => sum + v, 0);
        const nameUpper = colName.toUpperCase();
        
        let formattedVal = sumVal > 1000000 
          ? `Rp ${(sumVal / 1000000).toFixed(1)}M` 
          : sumVal.toLocaleString("id-ID");
          
        if (colName.toLowerCase().includes("pct") || colName.toLowerCase().includes("loss")) {
          const avgVal = sumVal / values.length;
          formattedVal = `${avgVal.toFixed(1)}%`;
        }

        kpis.push({
          label: `SUM/AVG [${nameUpper}]`,
          value: formattedVal,
          desc: `Akumulasi total nilai sebaran ${colName}`
        });
      }
    }

    // Target clean standard ratio percentage
    const filledCount = dataset.cleaningStats.missingValuesFilled;
    const cleanRatio = recordCount > 0 ? parseFloat((((recordCount - filledCount) / recordCount) * 100).toFixed(1)) : 100;
    
    kpis.push({
      label: "RASIO INTEGRITAS DATA",
      value: `${cleanRatio}%`,
      desc: "Tingkat kerapihan format set data"
    });

    return kpis;
  }, [dataset]);

  // Transform raw row data into appropriate format for individual custom charts
  const getRenderData = (chart: CustomChart) => {
    const rawData = dataset.rows || [];
    const displayLimit = chart.type === "pie" ? 6 : 24;

    if (chart.type === "pie") {
      const groups: Record<string, number> = {};
      rawData.forEach(row => {
        const xVal = String(row[chart.xAxisColumn] || "Lain-Lain");
        const yVal = parseFloat(String(row[chart.yAxisColumn])) || 0;
        groups[xVal] = (groups[xVal] || 0) + yVal;
      });

      const sortedData = Object.entries(groups)
        .map(([key, val]) => ({ name: key, value: parseFloat(val.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);

      if (sortedData.length > displayLimit) {
        const topElements = sortedData.slice(0, displayLimit - 1);
        const othersSum = sortedData.slice(displayLimit - 1).reduce((sum, item) => sum + item.value, 0);
        topElements.push({ name: "Kategori Lain", value: parseFloat(othersSum.toFixed(2)) });
        return topElements;
      }
      return sortedData;
    }

    return rawData.slice(0, displayLimit).map((row, idx) => ({
      name: String(row[chart.xAxisColumn] || idx + 1),
      value: typeof row[chart.yAxisColumn] === "number" ? row[chart.yAxisColumn] : null
    }));
  };

  return (
    <div id="stakeholder-dashboard-section" className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl mb-8">
      {/* Top action header purely business layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-5 mb-6">
        <div>
          <span className="bg-emerald-500/15 text-emerald-400 text-3xs font-semibold px-2 py-0.5 rounded font-mono uppercase">
            Stakeholder Mode
          </span>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Layers className="w-5 h-5 text-emerald-400" />
            Dasbor Eksklusif Eksekutif - DataPulse
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Halaman bersih khusus Direksi & Mitra Kerja. Ringkasan performa bisnis otomatis dengan infografis interaktif, siap ekspor berkas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="print-pdf-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-slate-800 text-slate-300 border border-[#27272A] px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Cetak Laporan Dasbor (PDF)
          </button>
        </div>
      </div>

      {/* Hero business indicator KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryKPIs.map((kpi, idx) => (
          <div key={idx} className="bg-[#020617] p-4 rounded-xl border border-[#27272A] shadow-md">
            <span className="text-3xs text-slate-500 font-mono tracking-wider block font-bold mb-1">
              {kpi.label}
            </span>
            <div className="text-xl font-bold text-slate-100 font-mono">
              {kpi.value}
            </div>
            <p className="text-3xs text-slate-500 leading-normal font-sans mt-1">
              {kpi.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bento Grid layout of custom pinned dashboards */}
      {customCharts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-deck-bento">
          {customCharts.map(ch => {
            const chartData = getRenderData(ch);
            const colors = PALETTE[ch.colorScheme] || PALETTE.indigo;

            return (
              <div key={ch.id} className="bg-[#020617] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between shadow-xl min-h-[340px] relative group overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#27272A]/40 pb-2 mb-3">
                  <span className="text-slate-300 font-bold text-xs truncate max-w-[80%] font-sans">
                    {ch.title}
                  </span>
                  <span className="text-4xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active Chart
                  </span>
                </div>

                <div className="h-60 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {ch.type === "pie" ? (
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                          itemStyle={{ fontSize: "11px", color: "#e2e8f0" }}
                        />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                      </PieChart>
                    ) : (
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={8.5} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8.5} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                          labelStyle={{ color: "#94a3b8", fontSize: "10px", fontFamily: "monospace" }}
                          itemStyle={{ fontSize: "11px", color: colors[0] }}
                        />
                        <Legend height={20} iconSize={8} wrapperStyle={{ fontSize: "9px" }} />

                        {ch.type === "line" && (
                          <Line
                            type="monotone"
                            name={ch.yAxisColumn}
                            dataKey="value"
                            stroke={colors[0]}
                            strokeWidth={2}
                            dot={{ r: 2.5, strokeWidth: 1, fill: "#09090b" }}
                          />
                        )}
                        {ch.type === "bar" && (
                          <Bar
                            name={ch.yAxisColumn}
                            dataKey="value"
                            fill={colors[0]}
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                        {ch.type === "scatter" && (
                          <Area
                            type="monotone"
                            name={ch.yAxisColumn}
                            dataKey="value"
                            fill={`url(#gradient-${ch.id})`}
                            stroke={colors[0]}
                          />
                        )}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>

                  {/* SVG Gradient inject per card */}
                  <svg className="absolute w-0 h-0">
                    <defs>
                      <linearGradient id={`gradient-${ch.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="mt-2 pt-2 border-t border-[#27272A]/40 text-4xs font-mono text-slate-500 flex justify-between items-center">
                  <span>Kolom: {ch.xAxisColumn} ✖ {ch.yAxisColumn}</span>
                  <button
                    onClick={() => onRemoveChart(ch.id)}
                    className="text-slate-600 hover:text-rose-400 font-sans transition-colors cursor-pointer"
                  >
                    Copot Sematan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-[#27272A] rounded-xl p-12 text-center bg-[#020617]/50 max-w-2xl mx-auto flex flex-col items-center justify-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mb-3 animate-bounce" />
          <h4 className="text-sm font-semibold text-slate-300">Dasbor Anda Masih Bersih</h4>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed font-sans">
            Mintalah tim <strong>Data Scientist / Analyst</strong> Anda untuk menavigasi ke tab pembangun grafik di atas, mengatur visualisasi penting, dan mengeklik <strong>"Sematkan ke Dasbor Stakeholder"</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
