/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { generateRichEmployees } from "./src/data/employees";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// In-memory caching/store of employee database
const richEmployees = generateRichEmployees();

// --- API ENDPOINTS ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", count: richEmployees.length });
});

// 2. Fetch full list of rich profiles
app.get("/api/employees", (req, res) => {
  res.json(richEmployees);
});

// 3. PEGAWAY AI Query endpoint
app.post("/api/ai/query", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if API Key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it to Secrets panel in Settings.",
      });
    }

    // Initialize GoogleGenAI SDK correctly based on guidelines
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Build a compact text index of our actual database to send to Gemini as context
    // We'll summarize our 120 employees in a robust & clean format
    const compactPegawaiList = richEmployees.map((e, index) => {
      return `${index + 1}. NIP: ${e.nip} | Nama: ${e.nama} | Golongan-Pangkat: ${e.golongan}-${e.pangkat} | Jabatan: ${e.jabatan} | Unit Kerja: ${e.unitKerja} | KGB YAD: ${e.kgbYAD} | Pangkat YAD: ${e.pangkatYAD} | Pensiun TMT: ${e.pensiunTMT} | Lahir: ${e.tanggalLahir} | Gender: ${e.gender} | Status: ${e.statusPegawai}`;
    }).join("\n");

    const systemInstruction = `Kamu adalah PEGAWAY AI, asisten pintar manajemen kepegawaian (Smart ASN Assistant) untuk sistem kepegawaian Indonesia (seperti MySAPK BKN modern).
Tugasmu adalah membantu admin mengelola dan mencari informasi data kepegawaian secara instan dengan bahasa alami.

Tanggal hari ini (Current Date): 2026-06-04 (Kamis, 4 Juni 2026). Gunakan tanggal ini untuk menghitung kriteria seperti "bulan depan", "tahun ini", "menjelang pensiun", atau "jatuh tempo".

Berikut adalah daftar lengkap data pegawai aktif (Source of Truth):
${compactPegawaiList}

Aturan Menjawab:
1. Jawablah dalam bahasa Indonesia yang ramah, profesional, sopan, dan bernuansa enterprise premium.
2. Selalu gunakan format markdown yang rapi, tebalkan nama pegawai atau tanggal penting, dan gunakan tabel untuk menampilkan data multi-kolom agar mudah dibaca.
3. Bantu admin menyaring data berdasarkan pertanyaan mereka.
   - Misalnya jika ditanya "Siapa yang pensiun tahun ini?", cari yang pensiunTMT nya tahun 2026 atau sekitarnya.
   - Jika ditanya "Siapa yang KGB bulan depan?", carilah PNS yang memiliki 'KGB YAD' di bulan Juli 2026 (atau sekitar 30 hari dari 4 Juni 2026).
   - "Berapa jumlah pegawai Golongan IV?", hitung jumlah yang memiliki golongan IV/a, IV/b, IV/c, IV/d, IV/e dan sebutkan rinciannya.
4. Berikan insight otomatis secara proaktif (misal: mengingatkan tindakan administratif yang harus segera diambil, seperti pemrosesan berkas KP atau KGB).
5. Jangan berasumsi atau membuat data fiktif di luar dari daftar pegawai yang terdaftar di atas.`;

    // Process chat history from request
    const contents: any[] = [];
    
    // Add history if present
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Gemini 3.5 Flash Model according to guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2, // low temperature for precise data matching
      },
    });

    const aiText = response.text || "Mohon maaf, saya saat ini sedang tidak dapat memproses jawaban.";
    res.json({ text: aiText });

  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ error: error.message || "Interal Server Error during AI query generation" });
  }
});


// 4. Biometric Face Verification Comparison endpoint
app.post("/api/auth/face-verify", async (req, res) => {
  try {
    const { email, capturedImage, referenceImage } = req.body;
    if (!email || !capturedImage || !referenceImage) {
      return res.status(400).json({ error: "Email, Tangkapan Kamera, dan Foto Referensi diperlukan." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum terkonfigurasi pada server. Silakan tambahkan pada menu Secrets di Settings.",
      });
    }

    // Extract bare base64 data string
    const cleanBase64 = (imgStr: string) => {
      const parts = imgStr.split(",");
      return parts.length > 1 ? parts[1] : parts[0];
    };

    const base64Captured = cleanBase64(capturedImage);
    const base64Reference = cleanBase64(referenceImage);

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Analisis kedua foto wajah berikut secara saksama untuk keperluan login sistem SIMPATI.
Gambar 1 (Foto 1) adalah Foto Referensi asli yang terdaftar secara sah untuk pengguna ini.
Gambar 2 (Foto 2) adalah Tangkapan Kamera langsung (Live Webcam Capture) saat pengguna mencoba masuk.

Tugas Anda:
1. Sebagai pakar biometrik profesional, tentukan apakah kedua gambar menunjukkan wajah ORANG YANG SAMA.
2. Berikan nilai tingkat kecocokan/kepercayaan (%) kemiripan wajah dari skala 0 sampai 100.
3. Berikan "reason" dalam Bahasa Indonesia yang singkat, ramah, dan akademis (menilai sudut pandang, kesamaan struktur hidung, mata, alis, bibir, atau bentuk wajah).
4. Jika persentase kemiripan di atas 70%, anggap match = true. Jika di bawah itu, anggap match = false.

Respons HARUS berupa JSON murni dengan format exact seperti ini:
{
  "match": boolean,
  "confidence": number,
  "reason": "keterangan singkat kesamaan fitur"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Reference
          }
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Captured
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const jsonStr = response.text || "{}";
    try {
      const result = JSON.parse(jsonStr.trim());
      res.json(result);
    } catch (e) {
      console.error("Malformed JSON received from Gemini:", jsonStr);
      res.json({
        match: false,
        confidence: 0,
        reason: "Format respons dari AI tidak valid. Hubungi admin sistem."
      });
    }

  } catch (error: any) {
    console.error("Face Verification Server Error:", error);
    res.status(500).json({ error: error.message || "Gagal melakukan pencocokan wajah pada server." });
  }
});


// --- VITE MIDDLEWARE SETUP & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PEGAWAY SERVER] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
