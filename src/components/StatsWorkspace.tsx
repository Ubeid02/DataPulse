import React, { useState, useMemo } from "react";
import { Activity, Play, TrendingUp, Cpu, Flame, BarChart3, HelpCircle } from "lucide-react";
import { Dataset } from "../types";
import { calculateStats } from "../utils";
import { ResponsiveContainer, ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface StatsWorkspaceProps {
  dataset: Dataset;
}

export default function StatsWorkspace({ dataset }: StatsWorkspaceProps) {
  const [selectedCol, setSelectedCol] = useState<string>("");
  const [targetCol, setTargetCol] = useState<string>("");
  const [forecastSteps, setForecastSteps] = useState<number>(4);
  const [forecastSummary, setForecastSummary] = useState<{
    slope: number;
    intercept: number;
    r2: number;
    predictedSteps: { index: number; label: string; value: number }[];
    equation: string;
    interpretation: string;
  } | null>(null);

  const numericColumns = useMemo(() => {
    return dataset.columns.filter(c => c.isNumeric);
  }, [dataset.columns]);

  // Set default columns on mount or dataset change
  React.useEffect(() => {
    if (numericColumns.length > 0) {
      setSelectedCol(numericColumns[0].name);
      // set default target for prediction as something different if possible
      setTargetCol(numericColumns[numericColumns.length - 1].name);
    }
  }, [numericColumns]);

  const activeStats = useMemo(() => {
    if (!selectedCol) return null;
    return calculateStats(dataset.rows, selectedCol);
  }, [dataset.rows, selectedCol]);

  // Compute a simple linear regression algorithm for predicting target over a linear trend index
  const runForecasting = () => {
    if (!targetCol || dataset.rows.length === 0) return;

    const dataPoints = dataset.rows
      .map((r, i) => ({
        x: i + 1,
        y: r[targetCol]
      }))
      .filter(p => typeof p.y === "number" && p.y !== null && !isNaN(p.y)) as { x: number; y: number }[];

    if (dataPoints.length < 5) {
      alert("Membutuhkan setidaknya 5 baris data valid untuk kalkulasi regresi.");
      return;
    }

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

    // Slope (m) and Intercept (c)
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared calculation
    const avgY = sumY / n;
    const totalSumSquares = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0);
    const residualSumSquares = dataPoints.reduce((sum, p) => {
      const predictedY = slope * p.x + intercept;
      return sum + Math.pow(p.y - predictedY, 2);
    }, 0);

    const r2 = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 1;

    // Generate output forecasting rows
    const predictedSteps = [];
    for (let s = 1; s <= forecastSteps; s++) {
      const nextIndex = n + s;
      const predictedVal = slope * nextIndex + intercept;
      predictedSteps.push({
        index: s,
        label: `Proyeksi T+${s}`,
        value: parseFloat(predictedVal.toFixed(2))
      });
    }

    let interpretation = "";
    if (slope > 0) {
      interpretation = `Tren positif terdeteksi. Setiap pertambahan 1 unit index berkorelasi dengan kenaikan rata-rata sebesar ${slope.toFixed(2)} unit pada ${targetCol}. R-Square: ${(r2 * 100).toFixed(1)}%.`;
    } else if (slope < 0) {
      interpretation = `Tren negatif terdeteksi. Setiap pertambahan 1 unit index berkorelasi dengan penurunan rata-rata sebesar ${Math.abs(slope).toFixed(2)} unit pada ${targetCol}. R-Square: ${(r2 * 100).toFixed(1)}%.`;
    } else {
      interpretation = `Tidak terdeteksi perubahan tren signifikan (mendatar).`;
    }

    setForecastSummary({
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      r2: parseFloat(r2.toFixed(4)),
      predictedSteps,
      equation: `Y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
      interpretation
    });
  };

  // Regression line rendering dataset
  const combinedChartData = useMemo(() => {
    if (!targetCol) return [];
    const points = dataset.rows
      .map((r, i) => {
        const yVal = r[targetCol];
        const hasY = typeof yVal === "number" && yVal !== null && !isNaN(yVal);
        return {
          index: i + 1,
          tanggal: r["Tanggal"] || r["Tanggal_Pemeriksaan"] || r["Waktu"] || `Baris ${i+1}`,
          "Aktual": hasY ? yVal : null,
          "Garis Regresi/Prediksi": forecastSummary ? parseFloat((forecastSummary.slope * (i + 1) + forecastSummary.intercept).toFixed(2)) : null
        };
      });

    // Append forecasted rows
    if (forecastSummary) {
      const lastIndex = points.length;
      forecastSummary.predictedSteps.forEach(step => {
        points.push({
          index: lastIndex + step.index,
          tanggal: step.label,
          "Aktual": null,
          "Garis Regresi/Prediksi": step.value
        });
      });
    }

    return points;
  }, [dataset.rows, targetCol, forecastSummary]);

  return (
    <div id="stats-workspace-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Descriptive Stats Panel */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 bg-teal-500/10 rounded-bl-xl text-teal-400 font-mono text-2xs uppercase tracking-wider">
          Stats Engine
        </div>

        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-teal-400" />
          Deskripsi Statistik Parametrik
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
          Pilih salah satu dimensi numerik untuk menghitung distribusi metrik pusat serta deviasi sebaran data secara otomatis.
        </p>

        {numericColumns.length > 0 ? (
          <div>
            <div className="mb-4">
              <label className="block text-3xs font-mono uppercase text-slate-500 mb-1.5 font-bold">Kolom Analisis</label>
              <select
                id="select-stats-column"
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
                className="w-full bg-[#020617] text-slate-200 border border-[#27272A] rounded-lg p-2 text-xs focus:border-teal-500/50 focus:outline-none"
              >
                {numericColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>

            {activeStats && (
              <div className="grid grid-cols-2 gap-3 bg-[#020617] p-3 rounded-lg border border-[#27272A]/60 text-xs">
                <div className="border-b border-[#27272A]/50 pb-2">
                  <span className="text-slate-500 text-3xs font-mono block">RATA-RATA (MEAN)</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{activeStats.mean.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-b border-[#27272A]/50 pb-2">
                  <span className="text-slate-500 text-3xs font-mono block">STANDAR DEVIASI</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{activeStats.stdDev.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-b border-[#27272A]/50 pb-2">
                  <span className="text-slate-500 text-3xs font-mono block">NILAI MINIMUM</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{activeStats.min.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-b border-[#27272A]/50 pb-2">
                  <span className="text-slate-500 text-3xs font-mono block">NILAI MAKSIMUM</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{activeStats.max.toLocaleString("id-ID")}</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-slate-500 text-3xs font-mono block">TOTAL KESELURUHAN (SUM)</span>
                  <span className="text-sm font-bold text-teal-400 font-mono">{activeStats.sum.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 bg-[#020617]/50 rounded-lg border border-[#27272A]">
            Tidak terdeteksi kolom numerik pada dokumen dataset ini.
          </div>
        )}
      </div>

      {/* Model Prediksi Simulator Engine */}
      <div className="lg:col-span-2 bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl relative flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-1.5">
            <Cpu className="w-5 h-5 text-sky-400" />
            Predictive Modeling & Forecasting Simulator
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
            Picu algoritma regresi kuadrat terkecil (OLS regression) untuk mengekstrak model linear dan menghasilkan proyeksi prediktif masa depan berdasarkan urutan index dataset.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-3xs font-mono uppercase text-slate-500 mb-1 font-bold">Variabel Target (Y)</label>
              <select
                id="regression-target-select"
                value={targetCol}
                onChange={(e) => {
                  setTargetCol(e.target.value);
                  setForecastSummary(null);
                }}
                className="w-full bg-[#020617] text-slate-200 border border-[#27272A] rounded-lg p-2 text-xs focus:border-sky-500/50 focus:outline-none"
              >
                {numericColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-3xs font-mono uppercase text-slate-500 mb-1 font-bold">Horizon Proyeksi</label>
              <select
                id="forecast-period-select"
                value={forecastSteps}
                onChange={(e) => {
                  setForecastSteps(Number(e.target.value));
                  setForecastSummary(null);
                }}
                className="w-full bg-[#020617] text-slate-200 border border-[#27272A] rounded-lg p-2 text-xs focus:border-sky-500/50 focus:outline-none"
              >
                <option value={3}>3 Periode Masa Depan</option>
                <option value={4}>4 Periode Masa Depan</option>
                <option value={6}>6 Periode Masa Depan</option>
                <option value={8}>8 Periode Masa Depan</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                id="run-forecasting-btn"
                onClick={runForecasting}
                className="w-full bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] active:scale-95 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                Jalankan Regresi ML
              </button>
            </div>
          </div>
        </div>

        {/* Prediction Equation and Explanation */}
        {forecastSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Left formula */}
            <div className="md:col-span-2 bg-[#020617] p-3 rounded-lg border border-[#27272A]/80 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-3xs text-slate-500 font-mono font-bold block">MODEL PERSAMAAN LINEAR</span>
                <span className="text-sm font-bold text-sky-400 font-mono block mt-1">{forecastSummary.equation}</span>
              </div>
              <div className="border-t border-[#27272A]/40 pt-2 text-slate-400 font-sans leading-normal">
                {forecastSummary.interpretation}
              </div>
            </div>

            {/* Combined Chart plotting actual points and trendline */}
            <div className="md:col-span-3 h-48 bg-[#020617] rounded-lg border border-[#27272A]/80 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="index" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "10px", fontFamily: "monospace" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                  <Scatter name="Data Aktual" dataKey="Aktual" fill="#10b981" shape="circle" />
                  <Line name="Garis Tren Regresi" dataKey="Garis Regresi/Prediksi" stroke="#0ea5e9" strokeWidth={2.5} dot={false} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center border border-dashed border-[#27272A] rounded-lg text-slate-500 bg-[#020617]/30">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs">Klik "Jalankan Regresi ML" untuk memvisualisasikan tren dan kalkulasi forecast.</p>
          </div>
        )}
      </div>
    </div>
  );
}
