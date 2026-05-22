import { Dataset, DataColumn, CleaningStats } from "./types";

// Parse raw CSV string into rows and columns with validation
export function parseCSV(rawText: string, fileName: string): Dataset {
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    throw new Error("Berkas kosong atau tidak valid.");
  }

  // Handle delimiter detection (comma or semicolon)
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = commaCount >= semicolonCount ? "," : ";";

  // Simple CSV line splitter that respects quotes
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        result.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0 || headers.every(h => !h)) {
    throw new Error("Header kolom tidak terdeteksi pada baris pertama berkas.");
  }

  const rows: Record<string, any>[] = [];
  let brokenRowsCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      brokenRowsCount++;
      continue; // Skip or report corrupted rows
    }

    const rowObj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let rawVal = values[index];
      // Clean quotes
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
        rawVal = rawVal.substring(1, rawVal.length - 1);
      }

      // Convert to appropriate type initially (smart check)
      if (rawVal === "" || rawVal.toLocaleLowerCase() === "null" || rawVal.toLocaleLowerCase() === "none" || rawVal === "NaN") {
        rowObj[header] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal.trim() !== "") {
        rowObj[header] = Number(rawVal);
      } else if (rawVal.toLowerCase() === "true") {
        rowObj[header] = true;
      } else if (rawVal.toLowerCase() === "false") {
        rowObj[header] = false;
      } else {
        rowObj[header] = rawVal;
      }
    });

    rows.push(rowObj);
  }

  // Column types detection
  const detectedColumns: DataColumn[] = headers.map(header => {
    // Collect non-null values for sample
    const nonNullValues = rows.map(r => r[header]).filter(v => v !== null && v !== undefined);
    const firstVal = nonNullValues[0];
    
    let colType: "number" | "string" | "boolean" | "date" = "string";
    let isNumeric = false;

    if (typeof firstVal === "number") {
      colType = "number";
      isNumeric = true;
    } else if (typeof firstVal === "boolean") {
      colType = "boolean";
    } else if (typeof firstVal === "string") {
      // Test if date
      const dateParse = Date.parse(firstVal);
      const yearMatches = firstVal.match(/^\d{4}-\d{2}-\d{2}$/) || firstVal.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/);
      if (!isNaN(dateParse) && yearMatches) {
        colType = "date";
      } else {
        colType = "string";
      }
    }

    return {
      name: header,
      type: colType,
      isNumeric,
      sampleValues: nonNullValues.slice(0, 3)
    };
  });

  const cleanLog: string[] = [];
  if (brokenRowsCount > 0) {
    cleanLog.push(`Mengabaikan ${brokenRowsCount} baris data rusak karena ketidakcocokan jumlah kolom.`);
  }

  return {
    id: `upload_${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ""), // strip extension
    rows,
    columns: detectedColumns,
    timestamp: new Date().toISOString(),
    rowCount: rows.length,
    cleaningStats: {
      missingValuesFilled: 0,
      formattedDatesCount: 0,
      detectedAnomaliesCount: 0,
      cleanLog
    }
  };
}

// Convert JSON rows back to downloadable CSV string
export function convertToCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(","));

  // Value rows
  for (const row of rows) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return "";
      const stringified = String(val);
      // Escape commas and quotes if present
      if (stringified.includes(",") || stringified.includes('"') || stringified.includes("\n")) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// Perform automated Data Cleaning / ETL
export function cleanDataset(dataset: Dataset): Dataset {
  const newRows = JSON.parse(JSON.stringify(dataset.rows)) as Record<string, any>[];
  const logs: string[] = [];

  let missingFilled = 0;
  let dateFormattedCount = 0;
  let anomalyCount = 0;

  // 1. Calculate numerical averages for fallback
  const averages: Record<string, number> = {};
  dataset.columns.forEach(col => {
    if (col.isNumeric) {
      const vals = dataset.rows.map(r => r[col.name]).filter(v => typeof v === "number") as number[];
      if (vals.length > 0) {
        averages[col.name] = vals.reduce((sum, v) => sum + v, 0) / vals.length;
      } else {
        averages[col.name] = 0;
      }
    }
  });

  // 2. Perform element-wise cleaning
  newRows.forEach((row, idx) => {
    dataset.columns.forEach(col => {
      const val = row[col.name];

      // Clean missing numbers
      if (col.isNumeric && (val === null || val === undefined || isNaN(val))) {
        const fillVal = parseFloat(averages[col.name].toFixed(2));
        row[col.name] = fillVal;
        missingFilled++;
        if (missingFilled < 6) {
          logs.push(`[ETL] Perbaikan nilai kosong di baris ${idx + 1} kolom [${col.name}] diganti dengan rata-rata: ${fillVal}`);
        }
      }

      // Format date fields to standard YYYY-MM-DD
      if (col.type === "date" && val) {
        const dateParsed = Date.parse(String(val));
        if (!isNaN(dateParsed)) {
          const standardFormat = new Date(dateParsed).toISOString().split("T")[0];
          if (String(val) !== standardFormat) {
            row[col.name] = standardFormat;
            dateFormattedCount++;
          }
        }
      }

      // Detect and correct extreme numeric anomalies / outliers (Z-score concept with absolute range)
      // If a numeric value is negative where it should definitely be positive, or is > 15x averages
      if (col.isNumeric && typeof val === "number" && averages[col.name] > 0) {
        const ratio = val / averages[col.name];
        
        // Outlier correction: if ratio > 15x and average is significant, flag as anomaly and clamp it
        if (ratio > 15 && val > 100000) {
          const clampedVal = parseFloat((averages[col.name] * 3).toFixed(2));
          row[col.name] = clampedVal;
          anomalyCount++;
          logs.push(`[ETL] Outlier ekstrim dideteksi di baris ${idx + 1} kolom [${col.name}] (${val}). Di-clamp menjadi: ${clampedVal}`);
        }

        // Negative value correction (except for Profit column which can naturally be negative)
        if (val < 0 && !col.name.toLowerCase().includes("keuntungan") && !col.name.toLowerCase().includes("profit") && !col.name.toLowerCase().includes("loss")) {
          row[col.name] = Math.abs(val);
          anomalyCount++;
          logs.push(`[ETL] Nilai negatif tidak valid diperbaiki pada baris ${idx + 1} kolom [${col.name}] (${val}) -> (${Math.abs(val)})`);
        }
      }
    });
  });

  logs.push(`[ETL Selesai] Berhasil membersihkan ${missingFilled} nilai kosong, memformat ${dateFormattedCount} tanggal, dan menormalkan ${anomalyCount} anomali.`);

  return {
    ...dataset,
    rows: newRows,
    cleaningStats: {
      missingValuesFilled: missingFilled,
      formattedDatesCount: dateFormattedCount,
      detectedAnomaliesCount: anomalyCount,
      cleanLog: [...dataset.cleaningStats.cleanLog, ...logs]
    }
  };
}

// Calculate descriptive statistics for key columns
export interface ColumnStats {
  mean: number;
  min: number;
  max: number;
  count: number;
  sum: number;
  stdDev: number;
}

export function calculateStats(rows: Record<string, any>[], columnName: string): ColumnStats {
  const vals = rows
    .map(r => r[columnName])
    .filter(v => typeof v === "number" && v !== null && !isNaN(v)) as number[];

  if (vals.length === 0) {
    return { mean: 0, min: 0, max: 0, count: 0, sum: 0, stdDev: 0 };
  }

  const count = vals.length;
  const sum = vals.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  // standard deviation calculation
  const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    mean: parseFloat(mean.toFixed(2)),
    min,
    max,
    count,
    sum: parseFloat(sum.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2))
  };
}
