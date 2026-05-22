import React, { useState, useMemo } from "react";
import { AreaChart, BarChart3, LineChart, PieChart, Plus, Sparkles, TrendingUp, RefreshCw, Trash2, Heart } from "lucide-react";
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

interface ChartBuilderProps {
  dataset: Dataset;
  customCharts: CustomChart[];
  onAddChart: (chart: CustomChart) => void;
  onRemoveChart: (id: string) => void;
}

const PALETTE: Record<string, string[]> = {
  indigo: ["#6366f1", "#818cf8", "#c7d2fe", "#4f46e5", "#3730a3"],
  emerald: ["#10b981", "#34d399", "#a7f3d0", "#059669", "#064e3b"],
  rose: ["#f43f5e", "#fb7185", "#fecdd3", "#e11d48", "#881337"],
  amber: ["#f59e0b", "#fbbf24", "#fef3c7", "#d97706", "#78350f"],
  violet: ["#8b5cf6", "#a78bfa", "#ddd6fe", "#7c3aed", "#4c1d95"]
};

export default function ChartBuilder({ dataset, customCharts, onAddChart, onRemoveChart }: ChartBuilderProps) {
  const [xAxisCol, setXAxisCol] = useState<string>("");
  const [yAxisCol, setYAxisCol] = useState<string>("");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie" | "scatter">("line");
  const [colorScheme, setColorScheme] = useState<string>("indigo");
  const [chartTitle, setChartTitle] = useState<string>("");

  const numericColumns = useMemo(() => dataset.columns.filter(c => c.isNumeric), [dataset.columns]);
  const allColumns = useMemo(() => dataset.columns, [dataset.columns]);

  // Set default properties on mount or dataset shift
  React.useEffect(() => {
    if (allColumns.length > 0) {
      // Pick first non-numeric or date column for X axis as standard category choice
      const categoryCol = allColumns.find(c => !c.isNumeric) || allColumns[0];
      setXAxisCol(categoryCol.name);
    }
    if (numericColumns.length > 0) {
      setYAxisCol(numericColumns[0].name);
      setChartTitle(`Analisis Tren ${numericColumns[0].name}`);
    }
  }, [allColumns, numericColumns]);

  const handleYAxisChange = (colName: string) => {
    setYAxisCol(colName);
    setChartTitle(`Tren Sebaran ${colName}`);
  };

  const handleAddChart = () => {
    if (!xAxisCol || !yAxisCol) return;
    const newChart: CustomChart = {
      id: `custom_chart_${Date.now()}`,
      type: chartType,
      title: chartTitle || `${yAxisCol} terhadap ${xAxisCol}`,
      xAxisColumn: xAxisCol,
      yAxisColumn: yAxisCol,
      colorScheme
    };
    onAddChart(newChart);
  };

  // Prepare aggregated pie data in case standard values have too many categories (group beyond top-6)
  const chartData = useMemo(() => {
    if (!xAxisCol || !yAxisCol) return [];

    const rawData = dataset.rows || [];
    
    // Limits lines to 30 elements to prevent charts from looking super cluttered in small viewports
    const displayLimit = chartType === "pie" ? 6 : 24;
    
    if (chartType === "pie") {
      // Aggregate Y values grouped by X Categories
      const groups: Record<string, number> = {};
      rawData.forEach(row => {
        const xVal = String(row[xAxisCol] || "Lain-Lain");
        const yVal = parseFloat(String(row[yAxisCol])) || 0;
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

    // For line, bar, scatter - take up to 24 rows directly for sharp and responsive display
    return rawData.slice(0, displayLimit).map((row, idx) => ({
      name: String(row[xAxisCol] || idx + 1),
      value: typeof row[yAxisCol] === "number" ? row[yAxisCol] : null,
      rowRaw: row
    }));
  }, [dataset.rows, xAxisCol, yAxisCol, chartType]);

  const colors = PALETTE[colorScheme] || PALETTE.indigo;

  return (
    <div id="chart-builder-section" className="bg-[#09090B] border border-[#27272A] rounded-xl p-6 shadow-xl mb-8">
      <div className="flex items-center gap-2 mb-1.5 border-b border-[#27272A] pb-4">
        <BarChart3 className="w-5 h-5 text-sky-450" />
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Dynamic Chart Builder Workspace
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Arsir dimensi dan metrik untuk merancang visualisasi interaktif. Sematkan ke dasbor utama stakeholder dengan tombol "Sematkan".
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Controls Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-3xs font-mono uppercase text-slate-500 mb-1.5 font-bold">Jenis Visualisasi</label>
            <div className="grid grid-cols-4 gap-1.5 bg-[#020617] p-1 rounded-lg border border-[#27272A]">
              <button
                id="type-line-btn"
                onClick={() => setChartType("line")}
                className={`py-1.5 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  chartType === "line" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
                <span className="text-4xs mt-0.5 font-sans">Line</span>
              </button>
              <button
                id="type-bar-btn"
                onClick={() => setChartType("bar")}
                className={`py-1.5 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  chartType === "bar" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-4xs mt-0.5 font-sans">Bar</span>
              </button>
              <button
                id="type-pie-btn"
                onClick={() => setChartType("pie")}
                className={`py-1.5 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  chartType === "pie" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Pie Chart Aggregate"
              >
                <PieChart className="w-4 h-4" />
                <span className="text-4xs mt-0.5 font-sans">Pie</span>
              </button>
              <button
                id="type-scatter-btn"
                onClick={() => setChartType("scatter")}
                className={`py-1.5 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                  chartType === "scatter" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Scatter Plot"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-4xs mt-0.5 font-sans">Scatter</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-3xs font-mono uppercase text-slate-500 mb-1 font-bold">Sumbu Horizontal (X-Axis)</label>
            <select
              id="chart-xaxis-select"
              value={xAxisCol}
              onChange={(e) => setXAxisCol(e.target.value)}
              className="w-full bg-[#020617] text-slate-200 border border-[#27272A] rounded-lg p-2 text-xs focus:border-sky-500/50 focus:outline-none"
            >
              {allColumns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-3xs font-mono uppercase text-slate-500 mb-1 font-bold">Sumbu Vertikal (Y-Axis / Ukuran)</label>
            <select
              id="chart-yaxis-select"
              value={yAxisCol}
              onChange={(e) => handleYAxisChange(e.target.value)}
              className="w-full bg-[#020617] text-slate-200 border border-[#27272A] rounded-lg p-2 text-xs focus:border-sky-500/50 focus:outline-none"
            >
              {numericColumns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-3xs font-mono uppercase text-slate-500 mb-1 font-bold">Judul Visualisasi</label>
            <input
              type="text"
              id="chart-title-input"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Judul grafik..."
              className="w-full bg-[#020617] text-slate-100 border border-[#27272A] rounded-lg p-2 text-xs focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-3xs font-mono uppercase text-slate-500 mb-1.5 font-bold">Skema Warna</label>
            <div className="flex gap-1.5">
              {Object.keys(PALETTE).map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => setColorScheme(scheme)}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    colorScheme === scheme ? "scale-110 border-white" : "border-slate-950 hover:border-slate-750"
                  }`}
                  style={{ backgroundColor: PALETTE[scheme][0] }}
                  title={scheme}
                />
              ))}
            </div>
          </div>

          <button
            id="pin-chart-dashboard-btn"
            onClick={handleAddChart}
            disabled={!xAxisCol || !yAxisCol}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:bg-[#18181B] disabled:text-slate-500 disabled:cursor-not-allowed border border-transparent disabled:border-[#27272A]"
          >
            <Plus className="w-4 h-4" />
            Sematkan ke Dasbor Stakeholder
          </button>
        </div>

        {/* Live Preview Display and Deck Board */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
          {/* Main Chart Live Preview Box */}
          <div className="bg-[#020617] border border-[#27272A] rounded-xl p-4 flex-1 flex flex-col justify-center min-h-[300px]">
            <div className="flex items-center justify-between mb-3 border-b border-[#27272A]/40 pb-2">
              <span className="text-slate-400 font-semibold text-xs font-sans truncate">{chartTitle || "Pratinjau Grafik"}</span>
              <span className="text-3xs font-mono text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Live Preview
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "pie" ? (
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
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
                      <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                    </RechartsPieChart>
                  ) : (
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontFamily: "monospace" }}
                        itemStyle={{ fontSize: "11px", color: colors[0] }}
                      />
                      <Legend height={24} iconSize={8} wrapperStyle={{ fontSize: "10px" }} />

                      {chartType === "line" && (
                        <Line
                          type="monotone"
                          name={yAxisCol}
                          dataKey="value"
                          stroke={colors[0]}
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1, fill: "#09090b" }}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {chartType === "bar" && (
                        <Bar
                          name={yAxisCol}
                          dataKey="value"
                          fill={colors[0]}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                      {chartType === "scatter" && (
                        <Area
                          type="monotone"
                          name={yAxisCol}
                          dataKey="value"
                          fill={`url(#gradient-${colorScheme})`}
                          stroke={colors[0]}
                        />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>

                {/* Gradients injected dynamically */}
                <svg className="absolute w-0 h-0">
                  <defs>
                    <linearGradient id={`gradient-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 bg-[#020617]">
                <AreaChart className="w-8 h-8 animate-pulse mb-2 text-slate-700" />
                <p className="text-xs font-sans">Pilih X-Axis dan Y-Axis yang valid untuk memetakan visualisasi.</p>
              </div>
            )}
          </div>

          {/* Stakeholder layout review board list */}
          {customCharts.length > 0 && (
            <div className="bg-[#18181B]/40 border border-[#27272A] rounded-xl p-4">
              <span className="text-3xs text-slate-500 font-mono font-bold uppercase tracking-wider block mb-3">
                Daftar Visualisasi Disematkan ({customCharts.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {customCharts.map(ch => (
                  <div key={ch.id} className="bg-[#09090B] border border-[#27272A] hover:border-slate-700 rounded-lg py-1.5 px-3 flex items-center justify-between gap-3 text-xs w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[ch.colorScheme]?.[0] || "#93c5fd" }} />
                      <span className="text-slate-300 font-medium truncate max-w-[140px] font-sans">{ch.title}</span>
                    </div>
                    <button
                      onClick={() => onRemoveChart(ch.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                      title="Hapus grafik"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
