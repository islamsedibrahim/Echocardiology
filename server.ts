import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Ultrasound pipeline
  app.post("/api/analyze", upload.single("media"), async (req, res) => {
    try {
      // If a MedGemma API URL is provided and is a valid HTTP URL, we route the request to the real model
      if (process.env.MEDGEMMA_API_URL && process.env.MEDGEMMA_API_URL.startsWith("http")) {
        let base64Image = "";
        
        // Convert uploaded file to base64 to send to Python API
        if (req.file) {
          const fileData = fs.readFileSync(req.file.path);
          base64Image = fileData.toString("base64");
          // Clean up local temp file
          fs.unlinkSync(req.file.path);
        }

        const externalResponse = await fetch(process.env.MEDGEMMA_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: req.body.patientContext || "Analyze this ultrasound.",
            image_base64: base64Image
          })
        });

        const externalData = await externalResponse.json();
        
        return res.json({
          success: true,
          report: externalData.report // Adjust this based on your Python API's exact shape
        });
      }

      // ----------------------------------------------------
      // FALLBACK MOCK DATA: Used while the API is not connected
      // ----------------------------------------------------
      setTimeout(() => {
        if (req.file) {
          fs.unlinkSync(req.file.path); // clean up mocked file upload
        }
        res.json({
          success: true,
          report: {
            patientContext: req.body.patientContext || "Unknown",
            scanType: req.body.scanType || "Echocardiogram",
            findings: [
              { id: "f1", title: "Left Ventricular Function", description: "Preserved LVEF at ~60%.", severity: "normal" },
              { id: "f2", title: "Aortic Valve", description: "Mild aortic sclerosis without significant stenosis.", severity: "mild" },
              { id: "f3", title: "Mitral Regurgitation", description: "Moderate anterior leaflet prolapse with associated MR.", severity: "abnormal" },
              { id: "f4", title: "Pericardium", description: "No significant pericardial effusion identified.", severity: "normal" }
            ],
            measurements: [
              { name: "LVEF (%)", value: 60, min: 50, max: 70, fill: "#00F0FF" },
              { name: "LVIDd (cm)", value: 4.5, min: 3.5, max: 5.7, fill: "#34C759" },
              { name: "LVPWd (cm)", value: 0.9, min: 0.6, max: 1.1, fill: "#34C759" },
              { name: "LA Vol (ml/m²)", value: 28, min: 16, max: 34, fill: "#34C759" },
              { name: "RVSP (mmHg)", value: 25, min: 15, max: 30, fill: "#34C759" },
            ],
            aiRecommendation: "Recommend follow-up echocardiogram in 12 months to monitor mitral regurgitation and aortic sclerosis. No immediate acute intervention indicated based on current images.",
            confidenceScore: 0.92,
            timestamp: new Date().toISOString()
          }
        });
      }, 2000); // 2 second mocked processing time

    } catch (error) {
      console.error("Error communicating with MedGemma API:", error);
      res.status(500).json({ success: false, error: "Failed to process image analysis." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // In Express v5 or later, you should use app.get('*all', ...) depending on the express version.
    // express 4.x uses '*'
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
