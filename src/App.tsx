/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { generateRichEmployees } from './data/employees';
import { enrichEmployeeKgb } from './utils/kgbUtils';
import { Employee } from './types';
import {
  fetchAllowedEmailsFromFirestore,
  syncAllowedEmailsToFirestore,
  fetchEmployeesFromFirestore,
  syncEmployeesToFirestore,
  fetchFaceReferenceFromFirestore,
  saveFaceReferenceToFirestore,
  deleteFaceReferenceFromFirestore
} from './lib/firestoreService';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DashboardTab from './components/DashboardTab';
import TableTab from './components/TableTab';
import ProfileTab from './components/ProfileTab';
import CalendarTab from './components/CalendarTab';
import AiTab from './components/AiTab';
import SettingsTab from './components/SettingsTab';
import { Menu, Sun, Moon, Bell, Search, ShieldAlert, Award, LogOut, Lock, ShieldCheck, Mail, CheckCircle2, AlertTriangle, Key, Camera, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Read from localStorage to persist
    const saved = localStorage.getItem('simpati_dark_mode');
    return saved === 'true';
  });

  const [instansiName, setInstansiName] = useState<string>(() => {
    return localStorage.getItem('simpati_instansi_name') || 'Dinas Komunikasi, Informatika, dan Statistik';
  });
  const [instansiAddress, setInstansiAddress] = useState<string>(() => {
    return localStorage.getItem('simpati_instansi_address') || 'Jl. Letjen Ryacudu No. 17, Bandar Lampung';
  });

  // Authentic User System & Whitelist state management
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('simpati_user_email');
  });

  const [allowedEmails, setAllowedEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('simpati_allowed_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Always ensure the two super admins exist with lowercase comparison
          const merged = Array.from(new Set([
            'samkidproject@gmail.com',
            'lukepoktlampung@gmail.com',
            ...parsed.map(e => e.trim().toLowerCase())
          ]));
          return merged;
        }
      }
    } catch (e) {
      console.error("Gagal memuat daftar otorisasi email:", e);
    }
    return ['samkidproject@gmail.com', 'lukepoktlampung@gmail.com'];
  });

  const [hasLoadedAllowedEmails, setHasLoadedAllowedEmails] = useState<boolean>(false);

  // Sync Whitelist with Cloud Firestore on startup
  useEffect(() => {
    const loadWhitelist = async () => {
      try {
        const list = await fetchAllowedEmailsFromFirestore();
        // Always ensure super admins
        const merged = Array.from(new Set([
          'samkidproject@gmail.com',
          'lukepoktlampung@gmail.com',
          ...list.map(e => e.trim().toLowerCase())
        ]));
        setAllowedEmails(merged);
      } catch (err) {
        console.error("Gagal sync allowed_emails dari Firestore:", err);
      } finally {
        setHasLoadedAllowedEmails(true);
      }
    };
    loadWhitelist();
  }, []);

  // Sync Whitelist changes back to Cloud Firestore
  useEffect(() => {
    if (!hasLoadedAllowedEmails) return;
    localStorage.setItem('simpati_allowed_emails', JSON.stringify(allowedEmails));
    const saveWhitelist = async () => {
      try {
        await syncAllowedEmailsToFirestore(allowedEmails);
      } catch (err) {
        console.error("Gagal menyimpan allowed_emails ke Firestore:", err);
      }
    };
    saveWhitelist();
  }, [allowedEmails, hasLoadedAllowedEmails]);

  const handleAddAllowedEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    if (allowedEmails.includes(clean)) return;
    setAllowedEmails(prev => [...prev, clean]);
  };

  const handleRemoveAllowedEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    // Super admins are strictly locked and cannot be deleted
    if (clean === 'samkidproject@gmail.com' || clean === 'lukepoktlampung@gmail.com') return;
    setAllowedEmails(prev => prev.filter(e => e !== clean));
  };

  const handleLogout = () => {
    localStorage.removeItem('simpati_user_email');
    setCurrentUserEmail(null);
  };

  // Biometric Face ID Login state hooks
  const [isFaceLoginMode, setIsFaceLoginMode] = useState<boolean>(false);
  const [faceLoginEmail, setFaceLoginEmail] = useState<string>('');
  const [faceLoginStep, setFaceLoginStep] = useState<'email' | 'scanner' | 'verifying' | 'success' | 'fail'>('email');
  const [faceLoginError, setFaceLoginError] = useState<string | null>(null);
  const [faceCapturedImage, setFaceCapturedImage] = useState<string | null>(null);
  const [faceRegMode, setFaceRegMode] = useState<'upload' | 'camera'>('upload'); // standard upload matches sandbox best
  const [faceCameraActive, setFaceCameraActive] = useState<boolean>(false);
  const [faceCameraStream, setFaceCameraStream] = useState<MediaStream | null>(null);
  const [faceVerifyResult, setFaceVerifyResult] = useState<{ match: boolean; confidence: number; reason: string } | null>(null);

  const faceVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const startFaceLoginCamera = async () => {
    setFaceLoginError(null);
    setFaceCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' }
      });
      setFaceCameraStream(mediaStream);
      setFaceCameraActive(true);
      setTimeout(() => {
        if (faceVideoRef.current) {
          faceVideoRef.current.srcObject = mediaStream;
          faceVideoRef.current.play().catch(err => console.error("Error face video play:", err));
        }
      }, 50);
    } catch (err) {
      console.error("Camera access error:", err);
      setFaceLoginError("Tidak dapat mengakses kamera peramban. Silakan gunakan opsi 'Unggah Foto Wajah' sebagai alternatif.");
    }
  };

  const stopFaceLoginCamera = () => {
    if (faceCameraStream) {
      faceCameraStream.getTracks().forEach(track => track.stop());
      setFaceCameraStream(null);
    }
    setFaceCameraActive(false);
  };

  const captureFaceLoginPhoto = () => {
    if (faceVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(faceVideoRef.current, 0, 0, 400, 400);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setFaceCapturedImage(base64);
        stopFaceLoginCamera();
        // Trigger verification
        handleVerifyFaceBiometrics(base64);
      }
    }
  };

  const handleFaceLoginFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 400, 400);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          setFaceCapturedImage(base64);
          // Trigger verification
          handleVerifyFaceBiometrics(base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getApiUrl = (endpoint: string): string => {
    const host = window.location.hostname;
    const isInternal = host === "localhost" || host === "127.0.0.1" || host.includes("asia-east1.run.app") || host.includes(".run.app");
    if (isInternal) {
      return endpoint;
    }
    return `https://ais-dev-6owthlexa57dc46oumj7fr-263187568059.asia-east1.run.app${endpoint}`;
  };

  const handleVerifyFaceBiometrics = async (capturedBase64: string) => {
    setFaceLoginStep('verifying');
    setFaceLoginError(null);

    const emailKey = faceLoginEmail.trim().toLowerCase();

    try {
      // Fetch Face ID photo reference from Cloud Firestore (enabling cross-device login)
      const referenceImage = await fetchFaceReferenceFromFirestore(emailKey) || 
                             localStorage.getItem(`simpati_face_ref_${emailKey}`) || 
                             undefined;

      if (!referenceImage) {
        throw new Error("Foto referensi Face ID belum terdaftar di database cloud untuk email ini. Silakan hubungi Super Admin di tab Pengaturan.");
      }

      const res = await fetch(getApiUrl("/api/auth/face-verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailKey,
          capturedImage: capturedBase64,
          referenceImage
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal melakukan pencocokan wajah di server.");
      }

      const result = await res.json();
      setFaceVerifyResult(result);

      if (result.match) {
        setFaceLoginStep('success');
        setTimeout(() => {
          localStorage.setItem('simpati_user_email', emailKey);
          setCurrentUserEmail(emailKey);
          // Sync to local storage in case we are logging in on a new device to keep it fast
          if (result.referenceImage || referenceImage) {
            localStorage.setItem(`simpati_face_ref_${emailKey}`, result.referenceImage || referenceImage);
          }
          // resets
          setIsFaceLoginMode(false);
          setFaceLoginEmail('');
          setFaceLoginStep('email');
          setFaceCapturedImage(null);
          setFaceVerifyResult(null);
        }, 1500);
      } else {
        setFaceLoginStep('fail');
        setFaceLoginError(`Verifikasi Wajah Gagal (${result.confidence}% kemiripan). Alasan: ${result.reason}`);
      }
    } catch (err: any) {
      console.error(err);
      setFaceLoginStep('fail');
      setFaceLoginError(err.message || "Gagal menghubungi server verifikasi AI.");
    }
  };

  const handleFaceLoginEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFaceLoginError(null);
    const cleanEmail = faceLoginEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setFaceLoginError("Email tidak boleh kosong.");
      return;
    }

    if (!allowedEmails.includes(cleanEmail)) {
      setFaceLoginError(`Akses Ditolak! Akun Google "${cleanEmail}" belum diotorisasi untuk membuka SIMPATI.`);
      return;
    }

    const referenceImage = localStorage.getItem(`simpati_face_ref_${cleanEmail}`);
    if (!referenceImage) {
      setFaceLoginError("Anda belum mendaftarkan biometrik wajah. Harap login menggunakan Email aslinya terlebih dahulu, lalu buka menu Pengaturan untuk mendaftarkan biometrik.");
      return;
    }

    // Reference exists, transition to capture scanner
    setFaceLoginStep('scanner');
    setFaceCapturedImage(null);
  };

  const handleCancelFaceLogin = () => {
    stopFaceLoginCamera();
    setIsFaceLoginMode(false);
    setFaceLoginEmail('');
    setFaceLoginStep('email');
    setFaceCapturedImage(null);
    setFaceLoginError(null);
  };

  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanInput = loginEmailInput.trim().toLowerCase();
    
    if (!cleanInput) {
      setLoginError('Alamat email tidak boleh kosong.');
      return;
    }

    // Standard RFC 5322 Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanInput)) {
      setLoginError('Mohon masukkan alamat email yang valid.');
      return;
    }

    // Check inclusion
    if (allowedEmails.includes(cleanInput)) {
      setLoginSuccess(true);
      setTimeout(() => {
        localStorage.setItem('simpati_user_email', cleanInput);
        setCurrentUserEmail(cleanInput);
        setLoginSuccess(false);
        setLoginEmailInput('');
      }, 1200);
    } else {
      setLoginError(`Akses Ditolak! Akun Google "${cleanInput}" belum diotorisasi untuk membuka SIMPATI. can hubungi Super Admin (samkidproject@gmail.com atau lukepoktlampung@gmail.com) untuk memperoleh izin akses.`);
    }
  };

  // Helper check status
  const isSuperAdmin = currentUserEmail ? ['samkidproject@gmail.com', 'lukepoktlampung@gmail.com'].includes(currentUserEmail.toLowerCase().trim()) : false;
  const isAuthorized = currentUserEmail ? allowedEmails.includes(currentUserEmail.toLowerCase().trim()) : false;

  useEffect(() => {
    localStorage.setItem('simpati_instansi_name', instansiName);
  }, [instansiName]);

  useEffect(() => {
    localStorage.setItem('simpati_instansi_address', instansiAddress);
  }, [instansiAddress]);

  const [hasLoadedEmployees, setHasLoadedEmployees] = useState<boolean>(false);

  // Manage live state of employees list with localStorage persistence to load the latest uploaded data on startup
  const [employeesList, setEmployeesList] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('simpati_employees_v1');
      if (saved) {
        const parsed: Employee[] = JSON.parse(saved);
        return parsed.map((emp) => enrichEmployeeKgb(emp));
      }
    } catch (e) {
      console.error("Gagal memuat data dari localStorage:", e);
    }
    // Fallback: start with empty array as requested to remove default sample data
    return [];
  });

  // Sync Employees with Cloud Firestore on startup
  useEffect(() => {
    const fetchEmployeesFromCloud = async () => {
      try {
        const list = await fetchEmployeesFromFirestore();
        if (list && list.length > 0) {
          setEmployeesList(list.map((emp) => enrichEmployeeKgb(emp)));
        } else {
          // If Firestore became empty (custom wiped), set empty state
          setEmployeesList([]);
        }
      } catch (err) {
        console.error("Gagal sync data pegawai dari Firestore:", err);
      } finally {
        setHasLoadedEmployees(true);
      }
    };
    fetchEmployeesFromCloud();
  }, []);

  // Watch, persist locally, and synchronize employees list to Cloud Firestore database when changed
  useEffect(() => {
    try {
      localStorage.setItem('simpati_employees_v1', JSON.stringify(employeesList));
    } catch (e) {
      console.error("Gagal menyimpan data ke localStorage:", e);
    }

    if (!hasLoadedEmployees) return;

    const saveEmployeesList = async () => {
      try {
        await syncEmployeesToFirestore(employeesList);
      } catch (err) {
        console.error("Gagal menyimpan data pegawai ke Firestore:", err);
      }
    };
    saveEmployeesList();
  }, [employeesList, hasLoadedEmployees]);

  // Toggle Dark theme in DOM
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('simpati_dark_mode', String(next));
      return next;
    });
  };

  // Synchronize CSS class modifiers based on state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Quick alert navigation to specific employee profile card
  const handleSelectEmployeeProfile = (emp: Employee) => {
    setSelectedEmployee(emp);
    setCurrentTab('pegawai');
  };

  // --- MAIN ACCESS CONTROL GATE CARD ---
  if (!currentUserEmail || !isAuthorized) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 transition-colors duration-300 font-sans ${
        darkMode 
          ? 'bg-gray-950 text-gray-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black' 
          : 'bg-slate-50 text-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-150 via-slate-50 to-gray-200'
      }`}>
        
        {/* Upper Brand Badge */}
        <div className="flex flex-col items-center mb-6 text-center animate-fade-in">
          <div className="w-14 h-14 bg-[#F4B400] rounded-2xl flex items-center justify-center font-black text-[#1F2937] text-3xl shadow-xl shadow-amber-500/20 mb-3 border border-amber-400/20 animate-pulse">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight font-display text-[#F4B400] uppercase leading-none">
            SIMPATI
          </h1>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
            Sistem Monitoring Pegawai Terintegrasi
          </p>
        </div>

        {/* Access Gate Card */}
        <div className={`w-full max-w-md p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-900/95 border-gray-805 shadow-2xl shadow-black/80 backdrop-blur-md' 
            : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'
        }`}>
          {/* Main header selection depending on Face Mode */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-150 dark:border-gray-800">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              {isFaceLoginMode ? <Camera className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                {isFaceLoginMode ? "Biometrik Face Login (Alternatif)" : "Otorisasi Akun Google"}
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium font-sans animate-fade-in">
                {isFaceLoginMode 
                  ? "Verifikasi Cocok Wajah menggunakan Gemini AI" 
                  : "Sistem Keamanan Data Rahasia Kepegawaian"}
              </p>
            </div>
          </div>

          {/* Render UI according to Biometric Mode */}
          {isFaceLoginMode ? (
            <div className="space-y-4 animate-fade-in">
              {/* Step 1: Face Login Email Verification */}
              {faceLoginStep === 'email' && (
                <form onSubmit={handleFaceLoginEmailSubmit} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="face-email" className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Masukkan Email Terdaftar
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="face-email"
                        type="email"
                        value={faceLoginEmail}
                        onChange={(e) => {
                          setFaceLoginEmail(e.target.value);
                          if (faceLoginError) setFaceLoginError(null);
                        }}
                        placeholder="nama@gmail.com"
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-sans outline-none focus:ring-2 focus:ring-amber-500/35 transition-all ${
                          darkMode 
                            ? 'bg-gray-950 border-gray-800 focus:border-amber-500 text-white' 
                            : 'bg-gray-50 border-gray-200 focus:border-amber-500 text-slate-850'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {faceLoginError && (
                    <div className="flex gap-2.5 p-3.5 bg-rose-500/10 border border-rose-550/20 rounded-xl text-rose-500 text-[11px] font-semibold leading-relaxed">
                      <AlertTriangle className="w-4 h-5 shrink-0 text-rose-500 mt-0.5" />
                      <span>{faceLoginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-450 text-[#1F2937] text-xs font-black transition-all shadow-md shadow-amber-500/10 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Tahap Selanjutnya: Scanning
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelFaceLogin}
                    className="w-full py-2.5 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-slate-850 dark:hover:text-white transition-colors"
                  >
                    Batal, Kembali ke Login Email
                  </button>
                </form>
              )}

              {/* Step 2: Biometric capture or upload */}
              {faceLoginStep === 'scanner' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-300 font-medium">Melakukan verifikasi untuk:</p>
                    <span className="text-[11px] font-mono bg-amber-500/10 px-2 py-0.5 rounded text-amber-500 font-bold mt-1 inline-block">{faceLoginEmail}</span>
                  </div>

                  {/* Camera vs Upload selector */}
                  <div className="flex bg-gray-150 dark:bg-gray-950 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setFaceRegMode('upload'); stopFaceLoginCamera(); }}
                      className={`flex-1 py-1.5 text-[11px] font-black rounded-md transition-all cursor-pointer uppercase ${
                        faceRegMode === 'upload' 
                          ? 'bg-amber-500 text-slate-950 shadow-sm' 
                          : 'text-gray-400'
                      }`}
                    >
                      Unggah Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFaceRegMode('camera'); startFaceLoginCamera(); }}
                      className={`flex-1 py-1.5 text-[11px] font-black rounded-md transition-all cursor-pointer uppercase ${
                        faceRegMode === 'camera' 
                          ? 'bg-amber-500 text-slate-950 shadow-sm' 
                          : 'text-gray-400'
                      }`}
                    >
                      Kamera Live
                    </button>
                  </div>

                  {/* Media Screen Area */}
                  <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-slate-950 rounded-2xl border border-gray-850 flex flex-col items-center justify-center overflow-hidden">
                    {faceRegMode === 'camera' ? (
                      <>
                        {faceCameraActive ? (
                          <div className="relative w-full h-full">
                            <video 
                              ref={faceVideoRef} 
                              className="w-full h-full object-cover scale-x-[-1]" 
                              playsInline 
                              muted 
                            />
                            {/* Scanning indicator */}
                            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full m-6 pointer-events-none animate-pulse flex items-center justify-center">
                              <div className="w-full h-[1.5px] bg-[#F4B400]/80 absolute top-1/2 left-0 transform -translate-y-1/2 animate-bounce" />
                            </div>
                            <div className="absolute bottom-2 left-0 right-0 text-center">
                              <span className="px-2 py-0.5 bg-black/85 rounded-full text-[9px] font-bold text-amber-500 uppercase tracking-widest backdrop-blur-md">
                                Menunggu Deteksi Wajah
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-400 space-y-3">
                            <Camera className="w-10 h-10 mx-auto text-gray-750 animate-pulse" />
                            <p className="text-[10px]">Hidupkan kamera Anda untuk melakukan scanning wajah.</p>
                            <button
                              type="button"
                              onClick={startFaceLoginCamera}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                              Mulai Scan
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center space-y-3">
                        <Camera className="w-10 h-10 mx-auto text-amber-500/80" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-300">Unggah Tangkapan Wajah</h5>
                          <p className="text-[9px] text-gray-400 leading-relaxed mt-1">Sistem akan memindai dan membandingkan file dengan profil yang set.</p>
                        </div>
                        <label className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-black uppercase rounded-xl cursor-pointer shadow">
                          Pilih File Foto
                          <input type="file" accept="image/*" onChange={handleFaceLoginFileUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {faceRegMode === 'camera' && faceCameraActive && (
                    <button
                      type="button"
                      onClick={captureFaceLoginPhoto}
                      className="w-full py-3 bg-[#F4B400] hover:bg-amber-450 text-[#1F2937] text-xs font-black rounded-xl uppercase tracking-wider font-sans flex items-center justify-center gap-1.5 shadow"
                    >
                      <Camera className="w-4 h-4 animate-pulse" />
                      Pindai Wajah Sekarang
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { stopFaceLoginCamera(); setFaceLoginStep('email'); }}
                    className="w-full py-2 text-xs font-bold text-gray-400 text-center"
                  >
                    Kembali
                  </button>
                </div>
              )}

              {/* Step 3: Verifying */}
              {faceLoginStep === 'verifying' && (
                <div className="text-center py-8 space-y-4 animate-pulse">
                  <div className="w-16 h-16 rounded-full border-4 border-t-amber-500 border-amber-500/20 animate-spin mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase">Menganalisis Biometrik</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Gemini AI sedang membandingkan konformitas struktur fitur wajah Anda berdasarkan Foto Referensi yang terdaftar...</p>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {faceLoginStep === 'success' && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-emerald-500">Akses Diterima!</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Identitas terkonfirmasi. Pengalihan masuk ke SIMPATI...</p>
                  </div>
                </div>
              )}

              {/* Step 5: Fail */}
              {faceLoginStep === 'fail' && (
                <div className="py-2 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider">Gagal Mengautentikasi</h4>
                  </div>

                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                    <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                      {faceLoginError}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFaceLoginStep('scanner');
                        setFaceVerifyResult(null);
                        setFaceLoginError(null);
                        if (faceRegMode === 'camera') startFaceLoginCamera();
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba Scan Ulang
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelFaceLogin}
                      className="w-full py-2 border border-gray-350 dark:border-gray-800 text-gray-400 text-xs font-bold rounded-xl"
                    >
                      Batal, Gunakan Email Standar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Traditional login layout with toggle link */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="login-email" className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                  Alamat Email Akun Google
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmailInput}
                    onChange={(e) => {
                      setLoginEmailInput(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="nama@gmail.com / kejaksaan.go.id"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-sans outline-none focus:ring-2 focus:ring-amber-500/35 transition-all ${
                      darkMode 
                        ? 'bg-gray-950 border-gray-800 focus:border-amber-500 text-white' 
                        : 'bg-gray-50 border-gray-200 focus:border-amber-500 text-slate-850'
                    }`}
                    required
                    disabled={loginSuccess}
                  />
                </div>
              </div>

              {/* Error & Success States */}
              {loginError && (
                <div className="flex gap-2.5 p-3.5 bg-rose-500/10 border border-rose-550/20 rounded-xl text-rose-500 text-[11px] font-semibold leading-relaxed">
                  <AlertTriangle className="w-4 h-5 shrink-0 text-rose-500 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce text-emerald-500" />
                  <span>Verifikasi berhasil! Masuk ke sistem...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginSuccess}
                className={`w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-450 text-[#1F2937] text-xs font-black transition-all shadow-md shadow-amber-500/10 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                  loginSuccess ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Masuk dengan Akun Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-150 dark:border-gray-805"></div>
                <span className="flex-shrink mx-4 text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest leading-none select-none">Atau alternatif</span>
                <div className="flex-grow border-t border-gray-150 dark:border-gray-805"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFaceLoginMode(true);
                  setFaceLoginStep('email');
                  setFaceLoginEmail('');
                }}
                className="w-full py-3 rounded-xl border border-dashed border-[#F4B400]/40 text-[#F4B400] text-xs font-black hover:bg-[#F4B400]/10 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Camera className="w-4 h-4 animate-pulse" />
                Masuk dengan Deteksi Wajah (Face ID)
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-8 font-mono">
          © 2026 SIMPATI • Whitelisted Google Accounts Authentication System
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 font-sans ${
      darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F9FAFB] text-[#111827]'
    }`}>
      
      {/* LEFT NAVIGATION: Desktop Sidebar / Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isMobileDrawerOpen}
        setIsOpen={setIsMobileDrawerOpen}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* RESPONSIVE TOP BAR */}
        <header className={`h-20 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 border-b backdrop-blur-md transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-950/70 border-gray-800 text-white' 
            : 'bg-white/50 border-gray-150 text-slate-800'
        }`}>
          {/* Mobile hamburger menu trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className={`p-2 rounded-xl border md:hidden transition-colors cursor-pointer ${
                darkMode ? 'border-gray-800 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-50 text-slate-800'
              }`}
              id="mobile-drawer-trigger"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Title Branding */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F4B400] flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                S
              </div>
              <h1 className="text-base font-black tracking-tight font-display text-[#F4B400] uppercase">
                SIMPATI
              </h1>
            </div>

            <div className="hidden md:block max-w-xl truncate">
              <h2 className="text-sm md:text-base font-extrabold tracking-tight font-sans truncate">{instansiName}</h2>
              <p className="text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 font-medium font-sans truncate">{instansiAddress}</p>
            </div>
          </div>

          {/* Quick Header actions */}
          <div className="flex items-center gap-3">
            
            {/* User credentials identifier pill */}
            <div className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 border rounded-xl max-w-xs ${
              darkMode 
                ? 'bg-gray-905 border-gray-800 text-gray-200' 
                : 'bg-gray-50 border-gray-200 text-slate-800 shadow-xs'
            }`}>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold leading-none uppercase">
                  {isSuperAdmin ? 'SUPER ADMIN' : 'ASN PEGAWAI'}
                </span>
                <span className="text-[11px] font-extrabold truncate max-w-[130px] sm:max-w-[160px] font-sans mt-0.5" title={currentUserEmail}>
                  {currentUserEmail}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-rose-500/10 hover:text-rose-500 text-amber-500 flex items-center justify-center cursor-pointer transition-colors"
                onClick={handleLogout}
                title="Keluar Sesi"
              >
                <LogOut className="w-4 h-4" />
              </div>
            </div>

            {/* Dynamic System clock label */}
            <div className={`hidden lg:flex items-center p-2.5 rounded-xl border text-xs font-bold font-mono tracking-wide ${
              darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-slate-700'
            }`}>
              <span>4 Juni 2026</span>
            </div>
          </div>
        </header>

        {/* PRIMARY SCROLLABLE INTERACTIVE VIEWPORT CANVAS */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* DASHBOARD RINGKASAN PANEL */}
            {currentTab === 'dashboard' && (
              <DashboardTab
                employees={employeesList}
                onSelectEmployee={handleSelectEmployeeProfile}
                setCurrentTab={setCurrentTab}
                darkMode={darkMode}
              />
            )}

            {/* DATA PEGAWAI TAB (Switch dynamically between advanced search table or detail profile) */}
            {currentTab === 'pegawai' && (
              selectedEmployee === null ? (
                <TableTab
                  employees={employeesList}
                  onSelectEmployee={setSelectedEmployee}
                  selectedEmployee={selectedEmployee}
                  darkMode={darkMode}
                  onUpdateEmployees={setEmployeesList}
                  instansiName={instansiName}
                  instansiAddress={instansiAddress}
                />
              ) : (
                <ProfileTab
                  employee={selectedEmployee}
                  onBackToList={() => setSelectedEmployee(null)}
                  darkMode={darkMode}
                />
              )
            )}

            {/* KALENDER ASN KEPEGAWAIAN GRID TAB */}
            {currentTab === 'kalender' && (
              <CalendarTab
                employees={employeesList}
                onSelectEmployee={handleSelectEmployeeProfile}
                setCurrentTab={setCurrentTab}
                darkMode={darkMode}
              />
            )}

            {/* SIMPATI AI ASSISTANT CONSOLE CHAT TAB */}
            {currentTab === 'ai' && (
              <AiTab darkMode={darkMode} />
            )}

            {/* PENGATURAN INSTANSI TAB */}
            {currentTab === 'pengaturan' && (
              <SettingsTab
                instansiName={instansiName}
                setInstansiName={setInstansiName}
                instansiAddress={instansiAddress}
                setInstansiAddress={setInstansiAddress}
                employeeCount={employeesList.length}
                darkMode={darkMode}
                currentUserEmail={currentUserEmail || ''}
                allowedEmails={allowedEmails}
                onAddAllowedEmail={handleAddAllowedEmail}
                onRemoveAllowedEmail={handleRemoveAllowedEmail}
                employees={employeesList}
                onUpdateEmployees={setEmployeesList}
              />
            )}

          </div>
        </main>

        {/* BOTTOM NAVIGATION: Android UI native feel bar (Active on mobile viewports only) */}
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            setSelectedEmployee(null); // Clear selected employee when switching mobile tabs for clean navigation
          }}
          darkMode={darkMode}
        />

      </div>
    </div>
  );
}
