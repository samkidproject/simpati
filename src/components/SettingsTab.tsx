/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Building, MapPin, CheckCircle, Save, Info, Award, Settings, Shield, Trash2, Plus, Users, Lock, ShieldCheck, Camera, X, RefreshCw, AlertCircle, Check, Upload, Database } from 'lucide-react';
import { Employee } from '../types';
import { parseExcelToEmployees } from '../utils/excelParser';
import { 
  fetchRegisteredFaceEmailsFromFirestore, 
  saveFaceReferenceToFirestore, 
  deleteFaceReferenceFromFirestore 
} from '../lib/firestoreService';

interface SettingsTabProps {
  instansiName: string;
  setInstansiName: (name: string) => void;
  instansiAddress: string;
  setInstansiAddress: (address: string) => void;
  employeeCount: number;
  darkMode: boolean;
  currentUserEmail: string;
  allowedEmails: string[];
  onAddAllowedEmail: (email: string) => void;
  onRemoveAllowedEmail: (email: string) => void;
  employees: Employee[];
  onUpdateEmployees?: (employees: Employee[]) => void;
}

export default function SettingsTab({
  instansiName,
  setInstansiName,
  instansiAddress,
  setInstansiAddress,
  employeeCount,
  darkMode,
  currentUserEmail,
  allowedEmails,
  onAddAllowedEmail,
  onRemoveAllowedEmail,
  employees,
  onUpdateEmployees
 }: SettingsTabProps) {
  const [nameInput, setNameInput] = useState(instansiName);
  const [addressInput, setAddressInput] = useState(instansiAddress);
  const [successMsg, setSuccessMsg] = useState(false);
  
  // Whitelist UI management states
  const [newEmailInput, setNewEmailInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Database maintenance & Excel Import states
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    count?: number;
  }>({ status: 'idle', message: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ status: 'loading', message: 'Membaca dan memproses file excel...' });

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          if (!buffer) {
            setImportStatus({ status: 'error', message: 'Gagal membaca format biner file.' });
            return;
          }
          const parsed = await parseExcelToEmployees(buffer);
          if (parsed.length === 0) {
            setImportStatus({ status: 'error', message: 'Lembar kerja kosong atau tidak sesuai kriteria format.' });
            return;
          }

          if (onUpdateEmployees) {
            const existingNips = new Set(employees.map(emp => emp.nip));
            const uniqueParsed = parsed.filter(emp => !existingNips.has(emp.nip));
            
            const merged = [...uniqueParsed, ...employees];
            onUpdateEmployees(merged);

            setImportStatus({
              status: 'success',
              message: `Berhasil mengunggah ${uniqueParsed.length} personil Kejaksaan Baru! (Ada ${parsed.length - uniqueParsed.length} duplikat diabaikan)`,
              count: uniqueParsed.length
            });
          }

          setTimeout(() => {
            setImportStatus({ status: 'idle', message: '' });
          }, 6000);
        } catch (innerErr: any) {
          setImportStatus({ status: 'error', message: `Kesalahan memproses: ${innerErr.message || innerErr}` });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setImportStatus({ status: 'error', message: `Gagal membaca file: ${err.message || err}` });
    }
  };

  const handleWipeDatabase = () => {
    if (onUpdateEmployees) {
      onUpdateEmployees([]);
      setImportStatus({
        status: 'success',
        message: 'Kelepasan seluruh database telah dikonfirmasi dan dibersihkan!'
      });
      setShowClearConfirm(false);
      setTimeout(() => {
        setImportStatus({ status: 'idle', message: '' });
      }, 5500);
    }
  };

  // States for face biometric enrollment
  const [registeredFaces, setRegisteredFaces] = useState<string[]>(() => {
    return allowedEmails.filter(email => !!localStorage.getItem(`simpati_face_ref_${email}`));
  });

  // Load the list of registered Face ID profiles from Cloud Firestore
  useEffect(() => {
    const loadFaceRegistrations = async () => {
      try {
        const cloudFaces = await fetchRegisteredFaceEmailsFromFirestore();
        const localFaces = allowedEmails.filter(email => !!localStorage.getItem(`simpati_face_ref_${email}`));
        const combined = Array.from(new Set([...cloudFaces, ...localFaces]));
        setRegisteredFaces(combined);
      } catch (e) {
        console.error("Gagal sinkron data Face ID dari cloud:", e);
      }
    };
    loadFaceRegistrations();
  }, [allowedEmails]);

  const [activeFaceRegEmail, setActiveFaceRegEmail] = useState<string | null>(null);
  const [regMode, setRegMode] = useState<'camera' | 'upload'>('upload'); // default to upload because iframes restrict camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: 'user' } 
      });
      setStream(mediaStream);
      setCameraActive(true);
      // Wait briefly for ref positioning
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => console.error("Error video play:", err));
        }
      }, 50);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Kamera tidak dapat diakses (bisa karena kendala peramban/iFrame). Harap gunakan opsi 'Unggah Foto Wajah' sebagai alternatif.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveFaceReference = async () => {
    if (activeFaceRegEmail && capturedImage) {
      try {
        localStorage.setItem(`simpati_face_ref_${activeFaceRegEmail}`, capturedImage);
        await saveFaceReferenceToFirestore(activeFaceRegEmail, capturedImage);

        setRegisteredFaces(prev => {
          if (prev.includes(activeFaceRegEmail)) return prev;
          return [...prev, activeFaceRegEmail];
        });
        setActionSuccess(`Face ID untuk "${activeFaceRegEmail}" berhasil terdaftar di cloud & perangkat ini!`);
        setTimeout(() => setActionSuccess(null), 3500);
        closeFaceRegistration();
      } catch (err: any) {
        console.error(err);
        setActionSuccess(`Gagal mengunggah Face ID ke Cloud: ${err.message || err}`);
        setTimeout(() => setActionSuccess(null), 4500);
      }
    }
  };

  const deleteFaceReference = async (email: string) => {
    try {
      localStorage.removeItem(`simpati_face_ref_${email}`);
      await deleteFaceReferenceFromFirestore(email);

      setRegisteredFaces(prev => prev.filter(e => e !== email));
      setActionSuccess(`Data Face ID untuk "${email}" telah dihapus dari cloud.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error(err);
      setActionSuccess(`Gagal menghapus dari cloud: ${err.message || err}`);
      setTimeout(() => setActionSuccess(null), 4500);
    }
  };

  const closeFaceRegistration = () => {
    stopCamera();
    setActiveFaceRegEmail(null);
    setCapturedImage(null);
    setCameraError(null);
  };

  const isSuperAdmin = ['samkidproject@gmail.com', 'lukepoktlampung@gmail.com'].includes(currentUserEmail.toLowerCase().trim());

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    
    const email = newEmailInput.trim().toLowerCase();
    if (!email) {
      setActionError('Email tidak boleh kosong.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setActionError('Masukkan alamat email yang valid.');
      return;
    }

    if (allowedEmails.includes(email)) {
      setActionError(`Email "${email}" sudah ada dalam whitelist.`);
      return;
    }

    onAddAllowedEmail(email);
    setNewEmailInput('');
    setActionSuccess(`Berhasil mengotorisasi email "${email}"!`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleRemoveEmail = (email: string) => {
    setActionError(null);
    setActionSuccess(null);
    
    if (email === 'samkidproject@gmail.com' || email === 'lukepoktlampung@gmail.com') {
      setActionError('Sesi utama Super Admin permanen tidak dapat dihapus.');
      return;
    }

    onRemoveAllowedEmail(email);
    setActionSuccess(`Hak akses email "${email}" telah dicabut.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setInstansiName(nameInput.trim());
    setInstansiAddress(addressInput.trim());
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-24 font-sans animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight font-display text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            PENGATURAN INSTANSI
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium font-sans">
            Konfigurasi identitas organisasi dan format penamaan dokumen cetak
          </p>
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main configure card */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 md:p-8 space-y-6 ${
          darkMode 
            ? 'bg-gray-900/60 border-gray-800 text-white' 
            : 'bg-white border-gray-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 pb-4 border-b border-gray-150 dark:border-gray-800">
            <Building className="w-5 h-5 text-[#F4B400]" />
            <span className="font-extrabold text-sm tracking-wide uppercase">Identitas Resmi</span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Nama Instansi */}
            <div className="flex flex-col gap-2">
              <label 
                htmlFor="instansi-name-input"
                className="text-xs font-bold font-sans uppercase tracking-wider text-gray-400"
              >
                Nama Instansi
              </label>
              <div className="relative">
                <input
                  id="instansi-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Masukkan nama instansi..."
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-sans outline-none focus:ring-2 focus:ring-amber-500/35 transition-all ${
                    darkMode 
                      ? 'bg-gray-950 border-gray-800 focus:border-amber-500 text-white' 
                      : 'bg-gray-50 border-gray-200 focus:border-amber-500 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Alamat Instansi */}
            <div className="flex flex-col gap-2">
              <label 
                htmlFor="instansi-address-input"
                className="text-xs font-bold font-sans uppercase tracking-wider text-gray-400"
              >
                Alamat / Keterangan Dinas
              </label>
              <div className="relative">
                <textarea
                  id="instansi-address-input"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Masukkan alamat resmi jalan, nomor telepon, atau email dinas..."
                  required
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-sans outline-none focus:ring-2 focus:ring-amber-500/35 transition-all resize-none ${
                    darkMode 
                      ? 'bg-gray-950 border-gray-800 focus:border-amber-500 text-white' 
                      : 'bg-gray-50 border-gray-200 focus:border-amber-500 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Notifications info */}
            {successMsg && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold animate-pulse">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Pengaturan instansi berhasil disimpan dan diterapkan pada format PDF!</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                id="btn-save-settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-md shadow-amber-500/10 uppercase font-sans"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        {/* Right Info / Live Preview Card */}
        <div className="space-y-6">
          
          {/* Live Preview of Header printout */}
          <div className={`rounded-2xl border p-6 space-y-4 ${
            darkMode 
              ? 'bg-gray-900/60 border-gray-800 text-white' 
              : 'bg-white border-gray-200 text-slate-800 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 pb-3 border-b border-gray-150 dark:border-gray-800">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-sm tracking-wide uppercase">Tinjauan KOP Cetak</span>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-sans mb-4">
              Visualisasi tampilan header (KOP Surat) yang akan tercetak otomatis saat mengekspor laporan Pegawai sebagai file PDF:
            </p>

            <div className="border border-dashed border-gray-300 dark:border-gray-750 rounded-xl p-4 bg-gray-50 dark:bg-gray-950 font-sans text-center select-none">
              <h4 className="text-[11px] font-black tracking-wide text-slate-800 dark:text-gray-100 uppercase leading-none">
                DATA PEGAWAI {nameInput.trim() || '...'}
              </h4>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 leading-tight font-medium">
                {addressInput.trim() || '...'}
              </p>
              <div className="border-t-2 border-slate-700 dark:border-slate-400 border-b border-slate-700 dark:border-slate-400 h-1 mt-2 mb-4" />
              
              <div className="text-[8px] text-left text-gray-300 bg-gray-400/15 dark:bg-gray-900 rounded-lg p-2 font-mono">
                <div>Tanggal Cetak: 4 Juni 2026</div>
                <div>Total Pegawai: {employeeCount} orang</div>
                <div>Kriteria / Filter: [Eselon / Unit Kerja Aktif]</div>
              </div>
            </div>
          </div>

          {/* Guidelines / help info card */}
          <div className={`rounded-2xl border p-6 space-y-3.5 ${
            darkMode 
              ? 'bg-gray-900/60 border-gray-800 text-white' 
              : 'bg-white border-gray-200 text-slate-800 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="font-extrabold text-xs tracking-wider uppercase font-sans">Administrasi Sistem</span>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed font-sans">
              Setiap nama instansi disimpan di dalam <span className="font-mono text-[11px] px-1 bg-amber-500/10 text-amber-500 rounded font-bold">localStorage</span> peramban web per-browser, sehingga perubahan tetap aman saat Anda menyegarkan (refresh) halaman SIMPATI.
            </p>

            <div className="flex gap-2.5 items-start bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-400 dark:text-gray-400 leading-relaxed font-sans">
                Pengaturan nama instansi ini juga tersinkronisasi langsung saat user melakukan pencarian cerdas berbasis AI pada fitur <strong>SIMPATI AI</strong>.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Super Admin Whitelist Management Interface */}
      {isSuperAdmin && (
        <div className={`rounded-2xl border p-6 md:p-8 space-y-6 animate-fade-in ${
          darkMode 
            ? 'bg-gray-900/60 border-gray-800 text-white' 
            : 'bg-white border-gray-250 text-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-150 dark:border-gray-800">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide uppercase font-sans text-slate-800 dark:text-gray-105">
                Otorisasi Akses Pengguna (Sistem Whitelist)
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-sans mt-0.5 font-medium">
                Kelola daftar akun Google yang diperbolehkan membuka database kepegawaian SIMPATI
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Add new email column / block */}
            <div className="md:col-span-1 space-y-4">
              <h4 className="text-xs font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest font-sans">
                Otorisasi Baris Baru
              </h4>
              <form onSubmit={handleAddEmail} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="new-whitelist-email" className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Alamat Email Google / ASN
                  </label>
                  <input
                    id="new-whitelist-email"
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="nama.pegawai@gmail.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-sans outline-none focus:ring-2 focus:ring-amber-500/35 transition-all ${
                      darkMode 
                        ? 'bg-gray-950 border-gray-800 focus:border-amber-500 text-white' 
                        : 'bg-gray-50 border-gray-200 focus:border-amber-500 text-slate-850'
                    }`}
                  />
                </div>

                {actionError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl">
                    {actionError}
                  </div>
                )}

                {actionSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl">
                    {actionSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4B400] hover:bg-amber-450 text-[#1F2937] text-xs font-black shadow-md shadow-amber-500/10 uppercase cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Berikan Hak Akses
                </button>
              </form>
            </div>

            {/* List whitelisted users column / block */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest font-sans">
                  Akun Terdaftar ({allowedEmails.length})
                </h4>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>Daftar Whitelist</span>
                </div>
              </div>

              <div className={`border rounded-xl divide-y overflow-hidden max-h-64 overflow-y-auto ${
                darkMode ? 'border-gray-800 divide-gray-800 bg-gray-950/20' : 'border-gray-150 divide-gray-150 bg-gray-50/20'
              }`}>
                {allowedEmails.map((email) => {
                  const isPermanentAdmin = email === 'samkidproject@gmail.com' || email === 'lukepoktlampung@gmail.com';
                  const hasFaceId = registeredFaces.includes(email);
                  
                  return (
                    <div key={email} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <div className={`w-2 h-2 rounded-full ${isPermanentAdmin ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="font-semibold font-mono tracking-tight text-xs sm:text-sm">{email}</span>
                        {isPermanentAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold uppercase select-none">
                            Super Admin
                          </span>
                        )}
                        
                        {/* Biometric indicator badge */}
                        {hasFaceId ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded font-bold uppercase select-none flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Face ID Aktif
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/10 text-gray-400 border border-gray-400/20 rounded font-bold uppercase select-none">
                            Face ID Kosong
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Manage biometric Face ID button */}
                        {hasFaceId ? (
                          <button
                            type="button"
                            onClick={() => deleteFaceReference(email)}
                            title="Hapus Face ID"
                            className="p-1 px-2 py-1 rounded-lg border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 transition-colors text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus Face ID</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFaceRegEmail(email);
                              setRegMode('upload'); // standard upload option first for stability
                              setCapturedImage(null);
                            }}
                            title="Daftarkan Biometrik Wajah"
                            className="p-1 px-2 py-1 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/15 transition-colors text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Set Face ID</span>
                          </button>
                        )}

                        {!isPermanentAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            title="Hapus Hak Akses"
                            className="p-1 px-2 py-1 rounded-lg border border-rose-500/20 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cabut</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dangerous Database Management section */}
      {isSuperAdmin && (
        <div className={`rounded-2xl border p-6 md:p-8 space-y-6 animate-fade-in ${
          darkMode 
            ? 'bg-gray-900/60 border-gray-800 text-white' 
            : 'bg-white border-gray-250 text-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-150 dark:border-gray-800">
            <div className="p-1.5 bg-[#EA4335]/10 rounded-lg text-[#EA4335]">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide uppercase font-sans text-slate-800 dark:text-gray-105">
                Pemeliharaan & Pangkalan Data Pegawai
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-sans mt-0.5 font-medium">
                Kelola pembersihan pangkalan data dan impor batch Pegawai Kejaksaan secara keseluruhan
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1 pr-0 md:pr-4">
              <h4 className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider font-sans">
                Status Kapasitas Database
              </h4>
              <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed font-semibold">
                Saat ini tersimpan sebanyak <span className="font-mono text-amber-500 font-extrabold text-sm">{employees.length}</span> personil di browser Anda. Anda dapat mengunggah file spreadsheet Excel (.xlsx / .xlam / .csv) untuk memasukkan data personil baru, atau menghapus seluruh basis data untuk instalasi bersih.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Excel upload input button */}
              <label className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2 font-sans shadow-md shadow-emerald-600/15 cursor-pointer transition-all duration-200">
                <Upload className="w-4 h-4" />
                Unggah Excel (.xlam/.xlsx)
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlam,.csv"
                  className="hidden"
                  onChange={handleImportExcel}
                />
              </label>

              {/* Reset database clear button */}
              <button
                onClick={() => setShowClearConfirm(true)}
                type="button"
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#EA4335] hover:bg-[#EA4335]/90 text-white inline-flex items-center gap-2 font-sans cursor-pointer shadow-md shadow-red-600/15 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Reset Data (Wipe)
              </button>
            </div>
          </div>

          {/* Wipe Confirmation block nested */}
          {showClearConfirm && (
            <div className={`p-5 rounded-[20px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans transition-all duration-300 ${
              darkMode 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-rose-50 border-rose-250 text-rose-800 shadow-sm'
            }`}>
              <div className="space-y-1.5 flex-1 pr-4">
                <h4 className="font-extrabold text-[#EA4335] text-sm tracking-wide flex items-center gap-2">
                  <span className="text-base">⚠️</span> KONFIRMASI TINDAKAN BERBAHAYA
                </h4>
                <p className="text-xs text-slate-400 dark:text-gray-300 leading-relaxed font-semibold">
                  Tindakan ini akan memusnahkan seluruh pangkalan data {employees.length} pegawai dari peramban ini secara permanen. Ekspor data terlebih dahulu jika diperlukan. Apakah Anda yakin?
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleWipeDatabase}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#EA4335] hover:bg-[#EA4335]/95 text-white shadow-md cursor-pointer transition-all duration-200"
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-350 hover:bg-gray-100 text-slate-700'
                  }`}
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}

          {/* Import status notification banner */}
          {importStatus.status !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all duration-300 ${
              importStatus.status === 'loading'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : importStatus.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {importStatus.status === 'loading' && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
                {importStatus.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {importStatus.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                <span>{importStatus.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportStatus({ status: 'idle', message: '' })}
                className="text-gray-400 hover:text-gray-105 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Biometric enrollment popup */}
      {activeFaceRegEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl relative ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-250 text-slate-800'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight uppercase">Pendaftaran Face ID</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono leading-none mt-1">{activeFaceRegEmail}</p>
                </div>
              </div>
              <button 
                onClick={closeFaceRegistration} 
                className="p-1 px-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-gray-150 dark:border-gray-800 my-1" />

            {/* Mode selectors */}
            <div className="flex bg-gray-150 dark:bg-gray-950 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => { setRegMode('upload'); stopCamera(); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  regMode === 'upload' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-gray-400 dark:text-gray-505'
                }`}
              >
                Unggah File Wajah
              </button>
              <button
                type="button"
                onClick={() => { setRegMode('camera'); startCamera(); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  regMode === 'camera' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-gray-400 dark:text-gray-505'
                }`}
              >
                Kamera Live
              </button>
            </div>

            {/* Main scanning box */}
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-950 rounded-2xl border border-gray-850 flex flex-col items-center justify-center overflow-hidden shadow-inner">
              {regMode === 'camera' ? (
                <>
                  {cameraActive && !capturedImage ? (
                    <div className="relative w-full h-full">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover scale-x-[-1]" 
                        playsInline 
                        muted 
                      />
                      {/* Advanced Face ID visual reticle */}
                      <div className="absolute inset-0 border-[3px] border-amber-500/45 rounded-full m-8 pointer-events-none animate-pulse flex items-center justify-center">
                        <div className="w-full h-[1.5px] bg-amber-500/70 absolute top-1/2 left-0 transform -translate-y-1/2 animate-bounce" />
                      </div>
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="px-2.5 py-0.5 bg-black/80 rounded-full text-[9px] font-bold text-amber-500 uppercase tracking-wider backdrop-blur-md">
                          Wajah menghadap ke depan
                        </span>
                      </div>
                    </div>
                  ) : capturedImage ? (
                    <img src={capturedImage} alt="Live capture preview" className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <div className="p-4 text-center text-gray-400 space-y-3">
                      <Camera className="w-10 h-10 mx-auto text-gray-700 animate-pulse" />
                      {cameraError ? (
                        <p className="text-[10px] text-rose-500 font-medium px-4">{cameraError}</p>
                      ) : (
                        <p className="text-[10px] text-gray-405">Aktifkan webcam untuk mengambil foto wajah Anda secara aslinya.</p>
                      )}
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Mulai Kamera
                      </button>
                    </div>
                  )}
                </>
              ) : (
                regMode === 'upload' && (
                  capturedImage ? (
                    <div className="relative w-full h-full">
                      <img src={capturedImage} alt="Uploaded face" className="w-full h-full object-cover animate-fade-in" />
                      <button
                        type="button"
                        onClick={() => setCapturedImage(null)}
                        className="absolute bottom-3 right-3 py-1 px-3 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer shadow hover:bg-rose-450"
                      >
                        Ulangi
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mx-auto">
                        <Camera className="w-7 h-7 text-amber-500" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-300">Pilih Foto Profil Wajah</h5>
                        <p className="text-[10px] text-gray-405 leading-relaxed mt-1">Gunakan foto close-up wajah formal/depan yang jelas.</p>
                      </div>
                      <label className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-black uppercase rounded-xl cursor-pointer transition-colors shadow">
                        Pilih Berkas Foto
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  )
                )
              )}
            </div>

            {/* Camera shutter control */}
            {regMode === 'camera' && cameraActive && !capturedImage && (
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full py-2.5 bg-[#F4B400] hover:bg-amber-450 text-[#1F2937] text-xs font-black rounded-xl uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Tangkap Foto Wajah
              </button>
            )}

            {/* Save reference action button */}
            {capturedImage && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={saveFaceReference}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer shadow-emerald-500/10"
                >
                  <Check className="w-4 h-4" />
                  Simpan Biometrik Wajah
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    if (regMode === 'camera') startCamera();
                  }}
                  className="w-full py-2 border border-gray-300 dark:border-gray-800 text-gray-500 text-xs font-semibold rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Ambil Foto Ulang
                </button>
              </div>
            )}

            <div className="flex items-start gap-2 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-normal font-sans">
                Foto akan diamankan secara lokal di peramban ini. Mesin AI Gemini hanya akan dipanggil untuk analisis komparaktif saat Anda login lewat laman depan.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
