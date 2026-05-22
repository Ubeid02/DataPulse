export interface DataColumn {
  name: string;
  type: "number" | "string" | "boolean" | "date";
  isNumeric: boolean;
  sampleValues: any[];
}

export interface CleaningStats {
  missingValuesFilled: number;
  formattedDatesCount: number;
  detectedAnomaliesCount: number;
  cleanLog: string[];
}

export interface Dataset {
  id: string;
  name: string;
  rows: Record<string, any>[];
  columns: DataColumn[];
  timestamp: string;
  rowCount: number;
  cleaningStats: CleaningStats;
}

export interface AIMetric {
  label: string;
  value: string;
  change: string;
  suffix: string;
  iconName: string;
}

export interface AIFinding {
  title: string;
  description: string;
  badgeSeverity: "success" | "warning" | "info" | "danger";
}

export interface AIChartRecommendation {
  type: "line" | "bar" | "pie" | "scatter";
  title: string;
  xAxisColumn: string;
  yAxisColumn: string;
  reason: string;
}

export interface AIAnalysisResult {
  summary: string;
  metrics: AIMetric[];
  findings: AIFinding[];
  recommendedCharts: AIChartRecommendation[];
  forecast: string;
}

export interface CustomChart {
  id: string;
  type: "line" | "bar" | "pie" | "scatter";
  title: string;
  xAxisColumn: string;
  yAxisColumn: string;
  colorScheme: string; // Tailwind bg color base, e.g., 'emerald', 'indigo', 'violet'
}
