import { Dataset, DataColumn } from "./types";

// Helper to generate a realistic Q1 Retail Sales dataset
function generateRetailDataset(): Dataset {
  const categories = ["Electronics", "Office Supplies", "Furniture", "Apparel", "Home Goods"];
  const products: Record<string, string[]> = {
    "Electronics": ["Pro Laptop 15", "Wireless Earbuds v5", "Smartwatch Active", "HD Monitor 27", "Ergonomic Keyboard"],
    "Office Supplies": ["Gel Pen Pack 10", "A4 Copier Paper", "Premium Binder 3-Ring", "Desktop Stapler Heavy Duty", "Sticky Notes Neon"],
    "Furniture": ["Ergonomic Mesh Chair", "Standing Desk Bamboo", "Dual Monitor Arm", "Mobile File Cabinet", "LED Desk Lamp"],
    "Apparel": ["Tech Fleece Hoodie", "Performance Athletic Socks", "Breathable Polo Shirt", "Waterproof Rain Jacket", "Everyday Sneakers"],
    "Home Goods": ["Insulated Water Bottle", "Ceramic Coffee Mug", "Essential Oil Diffuser", "Stainless Lunchbox", "Microfiber Towels"]
  };
  const regions = ["Jakarta", "Surabaya", "Medan", "Bandung", "Makassar"];

  const rows: Record<string, any>[] = [];
  const count = 180;
  let missingCount = 0;
  let formattedDates = 0;
  let anomalyCount = 0;
  const cleanLog: string[] = [];

  // Generate date series over Q1 2026
  for (let i = 0; i < count; i++) {
    const dateObj = new Date(2026, 0, 1 + Math.floor(i / 2));
    // Simulate raw unformatted dates occasionally
    let dateStr = "";
    if (i % 15 === 0) {
      dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/26`; // DD/M/YY format
      formattedDates++;
    } else {
      dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    const cat = categories[Math.floor(Math.random() * categories.length)];
    const prodList = products[cat];
    const prod = prodList[Math.floor(Math.random() * prodList.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];

    // Sales calculations with noise
    let basePrice = cat === "Furniture" ? 1200000 : cat === "Electronics" ? 1800000 : cat === "Apparel" ? 350000 : cat === "Home Goods" ? 150000 : 45000;
    let qty = Math.floor(Math.random() * 5) + 1;
    let discount = Math.random() < 0.4 ? parseFloat((Math.random() * 0.25).toFixed(2)) : 0;
    
    // Introduce missing values (e.g., null sales or qty) for cleaning demonstration
    let sales: any = Math.round(basePrice * qty * (1 - discount));
    if (i % 25 === 0) {
      sales = null; // missing value
      missingCount++;
    }

    let profit = sales ? Math.round(sales * (0.15 + Math.random() * 0.25)) : null;

    // Introduce anomalies / outliers (e.g. extremely high single order or negative value)
    if (i === 42) {
      sales = 87500000; // massive outlier
      profit = 45000000;
      qty = 62;
      anomalyCount++;
    }
    if (i === 115) {
      sales = -150000; // negative error anomaly
      profit = -50000;
      anomalyCount++;
    }

    rows.push({
      ID: `TX-${1000 + i}`,
      Tanggal: dateStr,
      Kategori: cat,
      Produk: prod,
      Wilayah: region,
      Kuantitas: qty,
      Diskon: discount * 100, // as percentage
      Penjualan: sales,
      Keuntungan: profit,
      Feedback: i % 12 === 0 ? "Kecewa dengan pengiriman lambat" : "Puas sekali, kualitas bintang lima",
    });
  }

  cleanLog.push(`Terdeteksi ${missingCount} entri Penjualan kosong. State dibersihkan dengan input rata-rata per-kategori.`);
  cleanLog.push(`Berhasil memformat ${formattedDates} data tanggal yang tidak konsisten.`);
  cleanLog.push(`Teridentifikasi ${anomalyCount} data anomali penjualan ganjil (outlier/negatif).`);

  const columns: DataColumn[] = [
    { name: "ID", type: "string", isNumeric: false, sampleValues: ["TX-1000", "TX-1001"] },
    { name: "Tanggal", type: "date", isNumeric: false, sampleValues: ["2026-01-01", "05/1/26"] },
    { name: "Kategori", type: "string", isNumeric: false, sampleValues: ["Electronics", "Furniture"] },
    { name: "Produk", type: "string", isNumeric: false, sampleValues: ["Pro Laptop 15", "Premium Binder"] },
    { name: "Wilayah", type: "string", isNumeric: false, sampleValues: ["Jakarta", "Surabaya"] },
    { name: "Kuantitas", type: "number", isNumeric: true, sampleValues: [2, 4] },
    { name: "Diskon", type: "number", isNumeric: true, sampleValues: [0, 15] },
    { name: "Penjualan", type: "number", isNumeric: true, sampleValues: [1800000, null] },
    { name: "Keuntungan", type: "number", isNumeric: true, sampleValues: [350000, 120000] },
    { name: "Feedback", type: "string", isNumeric: false, sampleValues: ["Puas", "Kecewa"] }
  ];

  return {
    id: "preset_retail",
    name: "Penjualan Ritel Hub Q1 2026",
    rows,
    columns,
    timestamp: new Date().toISOString(),
    rowCount: rows.length,
    cleaningStats: {
      missingValuesFilled: missingCount,
      formattedDatesCount: formattedDates,
      detectedAnomaliesCount: anomalyCount,
      cleanLog
    }
  };
}

// Helper to generate Patient Health Metrics Dataset
function generateHealthDataset(): Dataset {
  const rows: Record<string, any>[] = [];
  const count = 120;
  const clinics = ["Klinik Sentosa", "Klinik Medika Prima", "Klinik Harmoni Wellness"];
  
  let missingCount = 0;
  let formattedDates = 0;
  let anomalyCount = 0;
  const cleanLog: string[] = [];

  for (let i = 0; i < count; i++) {
    const age = Math.floor(Math.random() * 55) + 18; // 18 to 73
    const weight = Math.round(50 + Math.random() * 50); // 50 to 100 kg
    const height = parseFloat((1.5 + Math.random() * 0.4).toFixed(2)); // 1.5 to 1.9 m
    
    // BMI calculation
    const bmi = parseFloat((weight / (height * height)).toFixed(1));
    
    let bpSystolic = Math.floor(110 + Math.random() * 40); // 110 - 150 bp
    let bpDiastolic = Math.floor(70 + Math.random() * 25); // 70 - 95 bp

    let cholesterol = Math.floor(150 + Math.random() * 120); // 150 to 270 mg/dL
    if (i % 18 === 0) {
      cholesterol = 0; // Simulate missing values coded as 0
      missingCount++;
    }

    // Anomaly simulation
    if (i === 15) {
      bpSystolic = 240; // Extremely high dangerous bp (outlier)
      bpDiastolic = 140;
      anomalyCount++;
    }
    if (i === 64) {
      bpSystolic = 45; // Depressed abnormally low (input error)
      anomalyCount++;
    }

    const dateObj = new Date(2026, 2, 1 + Math.floor(i / 3));
    let dateStr = dateObj.toISOString().split("T")[0];
    if (i % 20 === 0) {
      dateStr = `${dateObj.getMonth() + 1}-${dateObj.getDate()}-2026`; // M-D-YYYY
      formattedDates++;
    }

    rows.push({
      ID_Pasien: `PSN-${2000 + i}`,
      Tanggal_Pemeriksaan: dateStr,
      Klinik: clinics[Math.floor(Math.random() * clinics.length)],
      Umur: age,
      Tinggi_M: height,
      Berat_KG: weight,
      BMI: bmi,
      Tekanan_Sistolik: bpSystolic,
      Tekanan_Diastolik: bpDiastolic,
      Kolesterol: cholesterol === 0 ? null : cholesterol, // Nullify 0s during cleaning
      Status: bmi > 27 ? "Obesitas" : bmi > 23 ? "Kelebihan Berat" : bmi < 18.5 ? "Underweight" : "Normal"
    });
  }

  cleanLog.push(`Terdeteksi ${missingCount} data Kolesterol kosong yang direkam sebagai nilai nol.`);
  cleanLog.push(`Berhasil memformat ${formattedDates} data Tanggal Pemeriksaan ke format standar YYYY-MM-DD.`);
  cleanLog.push(`Teridentifikasi ${anomalyCount} data Vital pasien yang berada di luar batas klinis wajar.`);

  const columns: DataColumn[] = [
    { name: "ID_Pasien", type: "string", isNumeric: false, sampleValues: ["PSN-2000"] },
    { name: "Tanggal_Pemeriksaan", type: "date", isNumeric: false, sampleValues: ["2026-03-01"] },
    { name: "Klinik", type: "string", isNumeric: false, sampleValues: ["Klinik Sentosa"] },
    { name: "Umur", type: "number", isNumeric: true, sampleValues: [45, 29] },
    { name: "Tinggi_M", type: "number", isNumeric: true, sampleValues: [1.72, 1.65] },
    { name: "Berat_KG", type: "number", isNumeric: true, sampleValues: [72, 85] },
    { name: "BMI", type: "number", isNumeric: true, sampleValues: [24.3, 29.1] },
    { name: "Tekanan_Sistolik", type: "number", isNumeric: true, sampleValues: [120, 140] },
    { name: "Tekanan_Diastolik", type: "number", isNumeric: true, sampleValues: [80, 90] },
    { name: "Kolesterol", type: "number", isNumeric: true, sampleValues: [185, null] },
    { name: "Status", type: "string", isNumeric: false, sampleValues: ["Normal", "Kelebihan Berat"] }
  ];

  return {
    id: "preset_health",
    name: "Metrik Kesehatan Klinik Q1 2026",
    rows,
    columns,
    timestamp: new Date().toISOString(),
    rowCount: rows.length,
    cleaningStats: {
      missingValuesFilled: missingCount,
      formattedDatesCount: formattedDates,
      detectedAnomaliesCount: anomalyCount,
      cleanLog
    }
  };
}

// Helper to generate Server Performance IoT metrics
function generateIoTTelemetriDataset(): Dataset {
  const rows: Record<string, any>[] = [];
  const count = 150;
  const nodes = ["Node-Alpha", "Node-Beta", "Node-Gamma", "Node-Delta"];
  
  let missingCount = 0;
  let formattedDates = 0;
  let anomalyCount = 0;
  const cleanLog: string[] = [];

  for (let i = 0; i < count; i++) {
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    let cpu = parseFloat((40 + Math.random() * 45).toFixed(1)); // 40% - 85% Usage
    let memory = parseFloat((50 + Math.random() * 35).toFixed(1)); // 50% - 85% usage
    let temp = parseFloat((52 + Math.random() * 20).toFixed(1)); // 52C - 72C
    let latency = Math.floor(10 + Math.random() * 45); // 10ms - 55ms
    let packetLoss = Math.random() < 0.15 ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0; // occasional loss

    // Null values on latency
    if (i % 30 === 0) {
      latency = 0; // 0 latency represents missed packets
      missingCount++;
    }

    // Outlier spike anomalies (IoT sensor malfunction / server overload)
    if (i === 11) {
      cpu = 100.0;
      temp = 98.4; // dangerous overheat
      latency = 820; // massive lag
      packetLoss = 45.5; // packet drop
      anomalyCount++;
    }
    if (i === 88) {
      cpu = -8.0; // system report error
      temp = -12.0;
      anomalyCount++;
    }

    const dateObj = new Date(2026, 4, 1, 10, i * 5); // 5-minute ticks
    const timeStr = dateObj.toISOString().replace("T", " ").substring(0, 16);

    rows.push({
      Waktu: timeStr,
      Server_ID: node,
      CPU_Usage_Pct: cpu < 0 ? null : cpu,
      Memori_Usage_Pct: memory,
      Temperatur_C: temp < 0 ? null : temp,
      Latency_MS: latency === 0 ? null : latency,
      Packet_Loss_Pct: packetLoss,
    });
  }

  cleanLog.push(`Selesai mengekstrak ${missingCount} data Latency MS kosong (0 ms) yang merepresentasikan putus jaringan.`);
  cleanLog.push(`Berhasil merelasikan ${count} urutan timestamp sistem (5 menit rentang waktu).`);
  cleanLog.push(`Teridentifikasi ${anomalyCount} data telemetri di luar kapasitas kerja normal perangkat keras.`);

  const columns: DataColumn[] = [
    { name: "Waktu", type: "date", isNumeric: false, sampleValues: ["2026-05-01 10:00"] },
    { name: "Server_ID", type: "string", isNumeric: false, sampleValues: ["Node-Alpha"] },
    { name: "CPU_Usage_Pct", type: "number", isNumeric: true, sampleValues: [48.2, null] },
    { name: "Memori_Usage_Pct", type: "number", isNumeric: true, sampleValues: [62.4] },
    { name: "Temperatur_C", type: "number", isNumeric: true, sampleValues: [56.4, null] },
    { name: "Latency_MS", type: "number", isNumeric: true, sampleValues: [15, null] },
    { name: "Packet_Loss_Pct", type: "number", isNumeric: true, sampleValues: [0, 0.45] }
  ];

  return {
    id: "preset_iot",
    name: "IoT Telemetri Server Ops 2026",
    rows,
    columns,
    timestamp: new Date().toISOString(),
    rowCount: rows.length,
    cleaningStats: {
      missingValuesFilled: missingCount,
      formattedDatesCount: formattedDates,
      detectedAnomaliesCount: anomalyCount,
      cleanLog
    }
  };
}

export const PRESET_DATASETS: Record<string, () => Dataset> = {
  preset_retail: generateRetailDataset,
  preset_health: generateHealthDataset,
  preset_iot: generateIoTTelemetriDataset
};
