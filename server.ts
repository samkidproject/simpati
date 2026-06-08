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

// Enable JSON parsing with higher limit for image base64 and excel imports
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import fs from "fs";

// Storage File Paths inside workspace data folder
const EMPLOYEES_FILE = path.join(process.cwd(), "src", "data", "employees_db.json");
const ALLOWED_EMAILS_FILE = path.join(process.cwd(), "src", "data", "allowed_emails.json");
const FACE_REFS_FILE = path.join(process.cwd(), "src", "data", "face_references.json");

// Helper: load employees
function loadEmployees() {
  try {
    if (fs.existsSync(EMPLOYEES_FILE)) {
      const data = fs.readFileSync(EMPLOYEES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Gagal membaca file database karyawan:", err);
  }
  // Initialize from default rich employees list if no file exists
  const defaultList = generateRichEmployees();
  saveEmployees(defaultList);
  return defaultList;
}

// Helper: save employees
function saveEmployees(list: any[]) {
  try {
    const dir = path.dirname(EMPLOYEES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Gagal menulis file database karyawan:", err);
    return false;
  }
}

// Helper: load allowed emails
function loadAllowedEmails() {
  try {
    if (fs.existsSync(ALLOWED_EMAILS_FILE)) {
      const data = fs.readFileSync(ALLOWED_EMAILS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Gagal membaca file daftar email diizinkan:", err);
  }
  const defaultList = ["samkidproject@gmail.com", "lukepoktlampung@gmail.com"];
  saveAllowedEmails(defaultList);
  return defaultList;
}

// Helper: save allowed emails
function saveAllowedEmails(list: string[]) {
  try {
    const dir = path.dirname(ALLOWED_EMAILS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ALLOWED_EMAILS_FILE, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Gagal menulis file daftar email diizinkan:", err);
    return false;
  }
}

// Helper: load face references
function loadFaceReferences() {
  try {
    if (fs.existsSync(FACE_REFS_FILE)) {
      const data = fs.readFileSync(FACE_REFS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Gagal membaca file foto referensi biometrik:", err);
  }
  const defaultRefs = {};
  saveFaceReferences(defaultRefs);
  return defaultRefs;
}

// Helper: save face references
function saveFaceReferences(refs: Record<string, string>) {
  try {
    const dir = path.dirname(FACE_REFS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FACE_REFS_FILE, JSON.stringify(refs, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Gagal menulis file foto referensi biometrik:", err);
    return false;
  }
}

// In-memory cache of employee database loaded initially
let richEmployees = loadEmployees();

// --- API ENDPOINTS ---

// 1. Health check
app.get("/api/health", (req, res) => {
  richEmployees = loadEmployees();
  res.json({ status: "ok", count: richEmployees.length });
});

// 2. Fetch full list of rich profiles from server storage
app.get("/api/employees", (req, res) => {
  richEmployees = loadEmployees();
  res.json(richEmployees);
});

// 2b. Update employees from client
app.post("/api/employees", (req, res) => {
  const newList = req.body;
  if (Array.isArray(newList)) {
    richEmployees = newList;
    saveEmployees(newList);
    res.json({ success: true, count: newList.length });
  } else {
    res.status(400).json({ error: "Data harus berupa array pegawai." });
  }
});

// 2c. Fetch allowed emails whitelist
app.get("/api/config/allowed-emails", (req, res) => {
  const list = loadAllowedEmails();
  res.json(list);
});

// 2d. Update allowed emails whitelist
app.post("/api/config/allowed-emails", (req, res) => {
  const newList = req.body;
  if (Array.isArray(newList)) {
    saveAllowedEmails(newList);
    res.json({ success: true, count: newList.length });
  } else {
    res.status(400).json({ error: "Data harus berupa array email." });
  }
});

// 2e. List registered Face ID emails
app.get("/api/config/face-references", (req, res) => {
  const refs = loadFaceReferences();
  res.json(Object.keys(refs));
});

// 2f. Fetch details for a registered Face ID
app.get("/api/config/face-reference/:email", (req, res) => {
  const { email } = req.params;
  const cleanEmail = email.trim().toLowerCase();
  const refs = loadFaceReferences();
  const referenceImage = refs[cleanEmail] || null;
  res.json({ email: cleanEmail, referenceImage });
});

// 2g. Update/save biometric Face ID reference
app.post("/api/config/face-reference", (req, res) => {
  const { email, referenceImage } = req.body;
  if (!email || !referenceImage) {
    return res.status(400).json({ error: "Email dan Foto Referensi diperlukan." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const refs = loadFaceReferences();
  refs[cleanEmail] = referenceImage;
  saveFaceReferences(refs);
  res.json({ success: true, message: `Face ID untuk ${cleanEmail} telah terdaftar.` });
});

// 2h. Delete Face ID reference
app.delete("/api/config/face-reference/:email", (req, res) => {
  const { email } = req.params;
  const cleanEmail = email.trim().toLowerCase();
  const refs = loadFaceReferences();
  if (refs[cleanEmail]) {
    delete refs[cleanEmail];
    saveFaceReferences(refs);
    res.json({ success: true, message: `Face ID untuk ${cleanEmail} telah dihapus.` });
  } else {
    res.status(404).json({ error: "Face ID tidak ditemukan." });
  }
});

// 3. PEGAWAY AI Query endpoint
app.post("/api/ai/query", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Refresh memory cache from storage file so AI has the latest imported/updated database
    richEmployees = loadEmployees();

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
    let { email, capturedImage, referenceImage } = req.body;
    if (!email || !capturedImage) {
      return res.status(400).json({ error: "Email dan Tangkapan Kamera diperlukan." });
    }

    const emailKey = email.trim().toLowerCase();

    // Look up the reference image in the server database if not provided inside request parameters
    if (!referenceImage) {
      const refs = loadFaceReferences();
      referenceImage = refs[emailKey];
    }

    if (!referenceImage) {
      return res.status(400).json({ error: "Foto referensi Face ID tidak terdaftar untuk email " + emailKey + " di database server." });
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
      result.referenceImage = referenceImage;
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
