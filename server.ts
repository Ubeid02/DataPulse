import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit to handle dataset rows
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini client (server-side only)
// Note: User-Agent set to 'aistudio-build' for AI Studio telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint for analyzing data statistics and generating executive summaries
app.post("/api/analyze", async (req, res) => {
  try {
    const { datasetName, sampleRows, columns, rowCount, statsSummary, customPrompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please add it in the Secrets panel in AI Studio UI.",
      });
    }

    // Build a prompt that includes the statistical description of the user's data
    const prompt = `
You are DataPulse AI, an elite virtual Data Scientist and business strategist.
The user has uploaded a dataset named "${datasetName || "Unnamed Dataset"}".
Here is the metadata of the dataset:
- Total rows: ${rowCount || "unknown"}
- Detected Columns and their detected formats: ${JSON.stringify(columns || [])}
- Descriptive Statistics / Value ranges / Distribution metrics: ${JSON.stringify(statsSummary || {})}
${customPrompt ? `- Custom focus or analyst instructions: "${customPrompt}"` : ""}

Here are some sample rows from raw data (JSON format):
${JSON.stringify(sampleRows || [])}

Perform a rigorous statistical and clinical data analysis, identify critical correlations, unusual anomalies or outliers, key business performance indicators (KPIs), and form strategic recommendations.

You MUST respond strictly in valid JSON format matching the following structural schema:
{
  "summary": "A comprehensive executive summary of the dataset. Explain what this dataset is, key takeaways, and what the anomalies/trends are. Write in clear, professional, and elegant business Indonesian. Use Markdown elements such as lists, bold highlights, or subheaders where appropriate.",
  "metrics": [
    {
      "label": "A relevant high-level KPI derived from columns (e.g. Total Revenue, Avg Order Value, Success Rate, Growth Deviation)",
      "value": "Calculated value (formatted as readable string e.g. 'Rp 1.2M' or '84.2%')",
      "change": "Estimated or theoretical percentage change/trend (e.g., '+12.4%' or '-3.2%')",
      "suffix": "Unit or context",
      "iconName": "A lucide icon name (e.g., 'DollarSign', 'TrendingUp', 'Users', 'AlertTriangle', 'Clock', 'Activity')"
    }
  ],
  "findings": [
    {
      "title": "A headline identifying a correlation, anomaly, seasonal trend, or insight",
      "description": "Elaborate description on why this matters and the underlying analytical details.",
      "badgeSeverity": "success" | "warning" | "info" | "danger"
    }
  ],
  "recommendedCharts": [
    {
      "type": "line" | "bar" | "pie" | "scatter",
      "title": "A chart title suggesting what to visualize (e.g., Revenue Growth Over Time)",
      "xAxisColumn": "One of the columns in the metadata to plot on X axis",
      "yAxisColumn": "One of the columns in the metadata to plot on Y axis",
      "reason": "Brief explanation of why this visualization is the most effective for this finding"
    }
  ],
  "forecast": "A forward-looking paragraph or prediction analysis based on simple regression extrapolation. Explain what the future values are predicted to look like for the key indicators over the next 2-3 quarters."
}
`;

    // Call Gemini 3.5 Flash for basic text / structured tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "metrics", "findings", "recommendedCharts", "forecast"],
          properties: {
            summary: { type: Type.STRING },
            forecast: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["label", "value", "change", "suffix", "iconName"],
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  change: { type: Type.STRING },
                  suffix: { type: Type.STRING },
                  iconName: { type: Type.STRING },
                },
              },
            },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "badgeSeverity"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  badgeSeverity: { type: Type.STRING },
                },
              },
            },
            recommendedCharts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["type", "title", "xAxisColumn", "yAxisColumn", "reason"],
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  xAxisColumn: { type: Type.STRING },
                  yAxisColumn: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text?.trim() || "{}");
    res.json({
      success: true,
      analysis: parsedJson,
    });
  } catch (error: any) {
    console.error("Error running Gemini API:", error);
    
    const errorStr = String(error?.stack || "") + " " + String(error?.message || "") + " " + JSON.stringify(error || {});
    let errMsg = "Internal server error conducting AI data analysis.";
    
    // Check if the API key is reported as leaked, invalid, or forbidden
    if (
      errorStr.toLowerCase().includes("leaked") ||
      errorStr.toLowerCase().includes("permission_denied") ||
      errorStr.toLowerCase().includes("403") ||
      errorStr.toLowerCase().includes("bocor") ||
      errorStr.toLowerCase().includes("key") ||
      error?.status === 403 ||
      error?.error?.code === 403
    ) {
      errMsg = "Kunci API Gemini (GEMINI_API_KEY) Anda terdeteksi tidak valid atau dilaporkan bocor oleh Google demi alasan keamanan. Silakan perbarui Kunci API Anda dengan kunci baru melalui panel rahasia pengembang (Settings > Secrets) di AI Studio. Sementara itu, Anda tetap dapat menguji modul ini secara penuh dengan mengeklik tombol 'Load Presets Demo (Offline)'.";
    } else {
      errMsg = error?.message || "Internal server error conducting AI data analysis.";
    }

    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Configure Vite integration or static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DataPulse running perfectly at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Critical: Failed to start server:", err);
});
