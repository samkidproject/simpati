/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Employee } from '../types';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  FileCheck, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  Bell,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface DashboardTabProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
}

const getPangkatName = (gol: string): string => {
  const list = [
    { golongan: 'I/a', pangkat: 'Juru Muda' },
    { golongan: 'I/b', pangkat: 'Juru Muda Tkt I' },
    { golongan: 'I/c', pangkat: 'Juru' },
    { golongan: 'I/d', pangkat: 'Juru Tkt I' },
    { golongan: 'II/a', pangkat: 'Pengatur Muda' },
    { golongan: 'II/b', pangkat: 'Pengatur Muda Tkt I' },
    { golongan: 'II/c', pangkat: 'Pengatur' },
    { golongan: 'II/d', pangkat: 'Pengatur Tkt I' },
    { golongan: 'III/a', pangkat: 'Penata Muda' },
    { golongan: 'III/b', pangkat: 'Penata Muda Tkt I' },
    { golongan: 'III/c', pangkat: 'Penata' },
    { golongan: 'III/d', pangkat: 'Penata Tkt I' },
    { golongan: 'IV/a', pangkat: 'Pembina' },
    { golongan: 'IV/b', pangkat: 'Pembina Tkt I' },
    { golongan: 'IV/c', pangkat: 'Pembina Utama Muda' },
    { golongan: 'IV/d', pangkat: 'Pembina Utama Madya' },
    { golongan: 'IV/e', pangkat: 'Pembina Utama' }
  ];
  return list.find(x => x.golongan === gol)?.pangkat || '';
};

export default function DashboardTab({
  employees,
  onSelectEmployee,
  setCurrentTab,
  darkMode
}: DashboardTabProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Parse dates and calculate metrics based on Current Date: 2026-06-04
  const TODAY = new Date('2026-06-04');
  
  const getDaysDiff = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffTime = d.getTime() - TODAY.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Alert / Smart Notifications
  // KGB dalam 30 hari (kgbYAD is in June or early July)
  const kgbAlerts = employees.filter(e => {
    const diff = getDaysDiff(e.kgbYAD);
    return diff > 0 && diff <= 30;
  });

  // Kenaikan pangkat dalam 60 hari
  const pangkatAlerts = employees.filter(e => {
    const diff = getDaysDiff(e.pangkatYAD);
    return diff > 0 && diff <= 60;
  });

  // Pensiun tahun ini (pensiunTMT ends in 2026)
  const pensiunAlerts = employees.filter(e => {
    const d = new Date(e.pensiunTMT);
    return d.getFullYear() === 2026;
  });

  // Ulang tahun bulan ini (June)
  const bdaysThisMonth = employees.filter(e => {
    const d = new Date(e.tanggalLahir);
    return (d.getMonth() + 1) === 6; // June is month 6
  });

  // 2. Metrics for the 5 Modern Cards
  const totalPegawai = employees.length;
  const totalKgb30Days = kgbAlerts.length;
  const totalPangkat60Days = pangkatAlerts.length;
  const totalPensiunThisYear = pensiunAlerts.length;
  const totalBdaysThisMonth = bdaysThisMonth.length;

  // KGB Metrics for the dashboard widget
  const kgbBulanIni = employees.filter(e => e.statusKgb === 'Jatuh Tempo Bulan Ini');
  const kgb3BulanKeDepan = employees.filter(e => {
    const diff = getDaysDiff(e.kgbYAD);
    return diff > 0 && diff <= 92; // around 3 months (June to August)
  });
  const kgbTerlambat = employees.filter(e => e.statusKgb === 'Terlambat Diproses');
  
  // List of employees with upcoming KGB in near future sorted by priority
  const upcomingKgbList = employees
    .filter(e => {
      const diff = getDaysDiff(e.kgbYAD);
      return diff >= -180 && diff <= 120; // range of interest
    })
    .sort((a, b) => {
      if (a.statusKgb === 'Terlambat Diproses' && b.statusKgb !== 'Terlambat Diproses') return -1;
      if (b.statusKgb === 'Terlambat Diproses' && a.statusKgb !== 'Terlambat Diproses') return 1;
      if (a.statusKgb === 'Jatuh Tempo Bulan Ini' && b.statusKgb !== 'Jatuh Tempo Bulan Ini' && b.statusKgb !== 'Terlambat Diproses') return -1;
      if (b.statusKgb === 'Jatuh Tempo Bulan Ini' && a.statusKgb !== 'Jatuh Tempo Bulan Ini' && a.statusKgb !== 'Terlambat Diproses') return 1;
      return new Date(a.kgbYAD).getTime() - new Date(b.kgbYAD).getTime();
    })
    .slice(0, 10);
  
  // List of employees with upcoming pension (BUP) within 1 year (nearest 1 year)
  const upcomingPensiunList = employees
    .filter(e => {
      const diff = getDaysDiff(e.pensiunTMT);
      return diff >= -30 && diff <= 365;
    })
    .sort((a, b) => {
      return new Date(a.pensiunTMT).getTime() - new Date(b.pensiunTMT).getTime();
    });

  // Local helper for classifying position types (Struktural, JFT, JFU) based on standard BKN patterns
  function getJenisJabatan(jabatan: string, eselon?: string): 'Struktural' | 'JFT' | 'JFU' {
    if (eselon && eselon.trim() !== '' && eselon.trim() !== '-') {
      return 'Struktural';
    }
    const clean = (jabatan || '').trim();
    if (!clean) return 'JFU';

    // Split title into words by non-alphanumeric characters, and skip empty ones
    const words = clean.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (words.length === 0) return 'JFU';

    // Get the first word in lowercase
    let firstWord = words[0].toLowerCase();

    // If first word is a common prefix like plt, plh, pj, pjs, look at the next word
    if (['plt', 'plh', 'pj', 'pjs'].includes(firstWord) && words.length > 1) {
      firstWord = words[1].toLowerCase();
    }

    // Check if firstWord starts with any of the requested prefixes
    const strukturalKeywords = ['kepala', 'inspektorat', 'asisten', 'koordinator'];
    if (strukturalKeywords.some(k => firstWord.startsWith(k))) {
      return 'Struktural';
    }

    const jftKeywords = ['ahli', 'pemula', 'pertama', 'terampil', 'mahir', 'penyelia', 'pranata', 'auditor', 'analis', 'jaksa'];
    if (jftKeywords.some(k => firstWord.startsWith(k))) {
      return 'JFT';
    }

    return 'JFU';
  }

  // Sebaran Tipe Jabatan (Struktural, JFT, JFU)
  const tipeJabatanCounts = { 'Struktural': 0, 'JFT': 0, 'JFU': 0 };
  employees.forEach(e => {
    const tipe = getJenisJabatan(e.jabatan, e.eselon);
    tipeJabatanCounts[tipe]++;
  });

  // 3. Chart Data Aggregations from the actual database list
  // Sebaran Golongan (Full Levels)
  const STND_GOL_ORDER = [
    'IV/e', 'IV/d', 'IV/c', 'IV/b', 'IV/a',
    'III/d', 'III/c', 'III/b', 'III/a',
    'II/d', 'II/c', 'II/b', 'II/a',
    'I/d', 'I/c', 'I/b', 'I/a'
  ];

  const golCounts: { [key: string]: number } = {};
  employees.forEach(e => {
    const g = (e.golongan || '').trim();
    if (g) {
      golCounts[g] = (golCounts[g] || 0) + 1;
    }
  });

  const activeGols = STND_GOL_ORDER.filter(g => (golCounts[g] || 0) > 0);
  Object.keys(golCounts).forEach(key => {
    if (key && !activeGols.includes(key)) {
      activeGols.push(key);
    }
  });

  const chartGols = activeGols.length > 0 ? activeGols : ['IV/b', 'IV/a', 'III/d', 'III/c', 'III/a'];

  // Sebaran Usia
  const ageCounts = { '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0 };
  employees.forEach(e => {
    const bDate = new Date(e.tanggalLahir);
    let birthYear = bDate.getFullYear();
    if (!birthYear || isNaN(birthYear)) {
      const match = (e.tanggalLahir || '').match(/\b(19\d\d|20\d\d)\b/);
      if (match) {
        birthYear = parseInt(match[0], 10);
      }
    }
    if (birthYear && !isNaN(birthYear)) {
      const age = 2026 - birthYear;
      if (age >= 20 && age <= 29) ageCounts['20-29']++;
      else if (age >= 30 && age <= 39) ageCounts['30-39']++;
      else if (age >= 40 && age <= 49) ageCounts['40-49']++;
      else if (age >= 50 && age <= 59) ageCounts['50-59']++;
    }
  });

  // Pegawai per Unit Kerja (Top 5)
  const unitCounts: { [key: string]: number } = {};
  employees.forEach(e => {
    if (e.unitKerja) {
      unitCounts[e.unitKerja] = (unitCounts[e.unitKerja] || 0) + 1;
    }
  });
  const sortedUnits = Object.entries(unitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Welcome Card */}
      <div 
        className={`p-6 md:p-8 rounded-[20px] shadow-sm relative overflow-hidden transition-all duration-300 transform motion-safe:hover:scale-[1.005] ${
          darkMode 
            ? 'bg-gradient-to-r from-[#1F2937] via-gray-900 to-[#F4B400]/10 text-white border border-gray-800'
            : 'bg-gradient-to-r from-[#F4B400] via-[#F59E0B] to-yellow-100 text-slate-900'
        }`}
      >
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-900/10 dark:bg-amber-500/10 text-slate-800 dark:text-amber-400">
              SISTEM SMART ASN 2026
            </span>
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>4 Juni 2026</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight font-display">
            Selamat Datang di SIMPATI
          </h2>
          <p className="text-sm md:text-base max-w-2xl opacity-90 leading-relaxed font-sans">
            Sistem manajemen kepegawaian modern terintegrasi untuk menyederhanakan pemantauan kenaikan pangkat, berkas berkala, pensiun, dan analisis data personil berbasis AI.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button 
              onClick={() => setCurrentTab('ai')}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold shadow-md inline-flex items-center gap-1.5 cursor-pointer bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Tanya SIMPATI AI
            </button>
            <button 
              onClick={() => setCurrentTab('pegawai')}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer border-slate-900/20 text-slate-850 hover:bg-slate-900/5 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/5 transition-all duration-200"
            >
              Lihat {employees.length >= 10000 ? '10.000+' : employees.length.toLocaleString()} Pegawai
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative ambient background blur */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Smart Notification Alerts Banner */}
      {(kgbAlerts.length > 0 || pangkatAlerts.length > 0) && (
        <div className={`p-5 rounded-[20px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
          darkMode ? 'bg-amber-950/10 border-amber-500/25 text-gray-200' : 'bg-amber-50 border-amber-300/60 text-slate-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Bell className="w-5.5 h-5.5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold font-sans text-sm tracking-wide">Pemberitahuan Sistem Penting</h3>
              <div className="text-xs space-y-1.5 mt-1 font-sans opacity-95">
                {kgbAlerts.slice(0, 1).map((e) => (
                  <p key={e.id} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    KGB atas nama <span className="font-semibold cursor-pointer text-amber-600 dark:text-amber-400 underline decoration-dotted" onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}>{e.nama}</span> akan jatuh tempo dalam {getDaysDiff(e.kgbYAD)} hari ({e.kgbYAD}).
                  </p>
                ))}
                {pangkatAlerts.slice(0, 1).map((e) => (
                  <p key={e.id} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Kenaikan pangkat atas nama <span className="font-semibold cursor-pointer text-indigo-600 dark:text-indigo-400 underline decoration-dotted" onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}>{e.nama}</span> akan jatuh tempo dalam {getDaysDiff(e.pangkatYAD)} hari ({e.pangkatYAD}).
                  </p>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('pegawai')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            Prosedur Administrasi
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Four Modern KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pegawai */}
        <div className={`p-4 md:p-5 rounded-[20px] transition-all duration-300 md:hover:-translate-y-1 relative overflow-hidden group border-l-4 border-[#F4B400] ${
          darkMode ? 'bg-gray-905 border-y border-r border-gray-800 text-white' : 'bg-white border-y border-r border-gray-100 shadow-sm shadow-gray-100/50 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total ASN</span>
            <div className="p-2.5 rounded-xl bg-[#F4B400]/10 text-[#F4B400]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">{totalPegawai.toLocaleString()}</h4>
            <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> +14 PNS Baru
            </span>
          </div>
        </div>

        {/* Card 2: KGB Mendatang */}
        <div className={`p-4 md:p-5 rounded-[20px] transition-all duration-300 md:hover:-translate-y-1 relative overflow-hidden border-l-4 border-[#F59E0B] ${
          darkMode ? 'bg-gray-905 border-y border-r border-gray-800 text-white' : 'bg-white border-y border-r border-gray-100 shadow-sm shadow-gray-100/50 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">KGB 30 Hari</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-[#F59E0B]/15 text-[#F59E0B]">
              H-30 HARI
            </span>
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">{totalKgb30Days}</h4>
            <span className="text-[10px] text-[#F59E0B] font-mono block mt-1 font-semibold">
              Terjadwal Bulan Ini
            </span>
          </div>
        </div>

        {/* Card 3: Kenaikan Pangkat */}
        <div className={`p-4 md:p-5 rounded-[20px] transition-all duration-300 md:hover:-translate-y-1 relative overflow-hidden border-l-4 border-[#10B981] ${
          darkMode ? 'bg-gray-905 border-y border-r border-gray-800 text-white' : 'bg-white border-y border-r border-gray-100 shadow-sm shadow-gray-100/50 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">KP 60 Hari</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-[#10B981]/15 text-[#10B981]">
              BATCH IV
            </span>
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">{totalPangkat60Days}</h4>
            <span className="text-[10px] text-emerald-500 font-sans block mt-1 font-semibold">
              Berkas Tersertifikasi
            </span>
          </div>
        </div>

        {/* Card 4: Pegawai Pensiun */}
        <div className={`p-4 md:p-5 rounded-[20px] transition-all duration-300 md:hover:-translate-y-1 relative overflow-hidden col-span-1 border-l-4 border-[#EF4444] ${
          darkMode ? 'bg-gray-905 border-y border-r border-gray-800 text-white' : 'bg-white border-y border-r border-gray-100 shadow-sm shadow-gray-100/50 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pensiun 2026</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">{totalPensiunThisYear}</h4>
            <span className="text-[10px] text-rose-500 font-mono block mt-1 font-semibold">
              Masa Bakti Selesai
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Beautiful Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">

        {/* Chart 1: Sebaran Golongan Utama (Simplified & Cleaned) */}
        <div className={`p-5 md:p-6 rounded-[20px] border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/30 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base tracking-wide font-display">Sebaran Golongan Utama</h3>
              <p className="text-xs text-gray-400 font-sans">Jumlah pegawai berdasarkan jenjang golongan pangkat</p>
            </div>
            <span className="text-xs bg-amber-500/15 text-amber-500 px-2.5 py-1 rounded-full font-bold">{employees.length.toLocaleString()} Profil</span>
          </div>

          <div className="h-64 flex items-end justify-around pb-6 pt-4 relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 bottom-[6%] border-b border-gray-200/50 dark:border-gray-800" />
            <div className="absolute inset-x-0 bottom-[35%] border-b border-gray-200/50 dark:border-gray-800" />
            <div className="absolute inset-x-0 bottom-[65%] border-b border-gray-200/50 dark:border-gray-800" />
            <div className="absolute inset-x-0 bottom-[95%] border-b border-gray-200/50 dark:border-gray-800" />

            {/* Bars */}
            {chartGols.map(gol => {
              const val = golCounts[gol] || 0;
              const maxVal = Math.max(...Object.values(golCounts), 1);
              const percentageHeight = maxVal > 0 ? (val / maxVal) * 80 : 0;
              const isHovered = activeTooltip === `gol-${gol}`;

              return (
                <div 
                  key={gol} 
                  className="flex flex-col items-center h-full justify-end z-10 w-11 sm:w-14 group relative select-none transition-all duration-300 hover:scale-105"
                  onMouseEnter={() => setActiveTooltip(`gol-${gol}`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  {/* Floating tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-50 text-center font-mono pointer-events-none w-36">
                      <p className="font-bold text-[11px]">Golongan {gol}</p>
                      <p className="font-semibold text-[10px] text-amber-400">{val} ASN ({employees.length > 0 ? Math.round((val / employees.length) * 100) : 0}%)</p>
                    </div>
                  )}

                  {/* Vertical Column Bar Wrapper */}
                  <div className="relative w-full flex-1 flex items-end justify-center min-h-0 h-40">
                    <div 
                      style={{ height: `${percentageHeight}%` }} 
                      className="w-6 sm:w-8 rounded-t bg-gradient-to-t from-amber-500 to-amber-300 dark:from-amber-600 dark:to-yellow-500 shadow-sm shadow-amber-500/10 border-t border-x border-amber-300/25 group-hover:from-amber-400 group-hover:to-yellow-300 transition-all duration-300 min-h-[4px]"
                    />
                  </div>
                  <span className="mt-2 text-[10px] sm:text-xs font-bold font-mono text-gray-500 dark:text-gray-400">{gol}</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-550 font-mono mt-0.5">{val} Peg.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Sebaran Tipe Jabatan (As requested: "sebarang pangkat golongan dan ll") */}
        <div className={`p-5 md:p-6 rounded-[20px] border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/30 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base tracking-wide font-display">Sebaran Tipe Jabatan</h3>
              <p className="text-xs text-gray-400 font-sans">Proporsi pegawai berdasarkan klaster jabatan BKN</p>
            </div>
            <span className="text-xs bg-indigo-500/15 text-indigo-500 px-2.5 py-1 rounded-full font-bold">Tipe ASN</span>
          </div>

          <div className="h-64 flex flex-col justify-center space-y-4 pt-2">
            {[
              { type: 'Struktural', key: 'Struktural' as const, label: 'Jabatan Struktural (Kepemimpinan)', color: 'bg-amber-500' },
              { type: 'JFT', key: 'JFT' as const, label: 'Jabatan Fungsional Tertentu (Keahlian)', color: 'bg-indigo-500' },
              { type: 'JFU', key: 'JFU' as const, label: 'Jabatan Fungsional Umum (Pelaksana)', color: 'bg-emerald-555 bg-emerald-500' }
            ].map((item) => {
              const count = tipeJabatanCounts[item.key];
              const percentage = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                    <span className="font-mono font-bold text-gray-500 dark:text-gray-400">
                      {count.toLocaleString()} ASN ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Sebaran Usia (Custom SVG Area Curved Graph) */}
        <div className={`p-5 md:p-6 rounded-[20px] border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/30 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base tracking-wide font-display">Demografi Sebaran Usia</h3>
              <p className="text-xs text-gray-400 font-sans">Pengelompokan usia untuk penentuan regenerasi PNS</p>
            </div>
            <span className="text-xs bg-teal-500/15 text-teal-500 px-2.5 py-1 rounded-full font-bold">Usia Aktif</span>
          </div>

          <div className="h-64 relative pt-4">
            {/* Render a premium custom SVG Line Chart */}
            {(() => {
              const maxAgeCount = Math.max(...Object.values(ageCounts), 1);
              return (
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="380" y2="20" stroke={darkMode ? "#374151" : "#E5E7EB"} strokeDasharray="3 3" />
                  <line x1="30" y1="70" x2="380" y2="70" stroke={darkMode ? "#374151" : "#E5E7EB"} strokeDasharray="3 3" />
                  <line x1="30" y1="120" x2="380" y2="120" stroke={darkMode ? "#374151" : "#E5E7EB"} strokeDasharray="3 3" />
                  <line x1="30" y1="170" x2="380" y2="170" stroke={darkMode ? "#374151" : "#E5E7EB"} />

                  {/* Curving math */}
                  <path 
                    d={`M 60,170 
                        C 110,${170 - (ageCounts['20-29']/maxAgeCount)*130} 110,${170 - (ageCounts['30-39']/maxAgeCount)*130} 160,${170 - (ageCounts['30-39']/maxAgeCount)*130} 
                        C 210,${170 - (ageCounts['30-39']/maxAgeCount)*130} 210,${170 - (ageCounts['40-49']/maxAgeCount)*130} 260,${170 - (ageCounts['40-49']/maxAgeCount)*130} 
                        C 310,${170 - (ageCounts['40-49']/maxAgeCount)*130} 310,${170 - (ageCounts['50-59']/maxAgeCount)*130} 360,${170 - (ageCounts['50-59']/maxAgeCount)*130} 
                        L 360,170 Z`} 
                    fill="url(#areaGrad)" 
                  />

                  {/* Plot Curved Line */}
                  <path 
                    d={`M 60,${170 - (ageCounts['20-29']/maxAgeCount)*130} 
                        C 110,${170 - (ageCounts['20-29']/maxAgeCount)*130} 110,${170 - (ageCounts['30-39']/maxAgeCount)*130} 160,${170 - (ageCounts['30-39']/maxAgeCount)*130} 
                        C 210,${170 - (ageCounts['30-39']/maxAgeCount)*130} 210,${170 - (ageCounts['40-49']/maxAgeCount)*130} 260,${170 - (ageCounts['40-49']/maxAgeCount)*130} 
                        C 310,${170 - (ageCounts['40-49']/maxAgeCount)*130} 310,${170 - (ageCounts['50-59']/maxAgeCount)*130} 360,${170 - (ageCounts['50-59']/maxAgeCount)*130}`} 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />

                  {/* Data dots with tooltip trigger on hover */}
                  {[
                    { label: '20-29', val: ageCounts['20-29'], x: 60 },
                    { label: '30-39', val: ageCounts['30-39'], x: 160 },
                    { label: '40-49', val: ageCounts['40-49'], x: 260 },
                    { label: '50-59', val: ageCounts['50-59'], x: 360 }
                  ].map((dot) => {
                    const y = 170 - (dot.val / maxAgeCount) * 130;
                    const isHovered = activeTooltip === `age-${dot.label}`;
                    return (
                      <g 
                        key={dot.label}
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveTooltip(`age-${dot.label}`)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <circle 
                          cx={dot.x} 
                          cy={y} 
                          r="6.5" 
                          fill="#FFFFFF" 
                          stroke="#10B981" 
                          strokeWidth="3" 
                        />
                        <circle 
                          cx={dot.x} 
                          cy={y} 
                          r="12" 
                          fill="#10B981" 
                          fillOpacity={isHovered ? 0.25 : 0} 
                          className="transition-all duration-300"
                        />
                        <text 
                          x={dot.x} 
                          y="192" 
                          textAnchor="middle" 
                          fill={darkMode ? "#9CA3AF" : "#4B5563"} 
                          fontSize="9" 
                          fontWeight="bold"
                          fontFamily="Inter"
                        >
                          {dot.label} Thn
                        </text>

                        {/* Dynamic label */}
                        <text
                          x={dot.x}
                          y={y - 12}
                          textAnchor="middle"
                          fill={darkMode ? "#10B981" : "#059669"}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono"
                        >
                          {dot.val} Peg.
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Chart 4: Pegawai per Unit Kerja (Premium Horizontal Bar Layout) */}
        <div className={`p-5 md:p-6 rounded-[20px] border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/30 text-slate-800'
        }`}>
          <div>
            <h3 className="font-bold text-base tracking-wide font-display">Unit Kerja Terpadat</h3>
            <p className="text-xs text-gray-400 font-sans mb-5">Distribusi personil pegawai PNS/ASN terbesar menurut SKPD</p>
          </div>

          <div className="space-y-4">
            {sortedUnits.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 font-medium">No units found or no uploaded data</div>
            ) : (
              sortedUnits.map(([unit, count], i) => {
                const maxCount = Math.max(...sortedUnits.map(([_, c]) => c));
                const widthPerc = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const barColors = [
                  'from-amber-400 to-amber-500',
                  'from-indigo-400 to-indigo-500',
                  'from-teal-400 to-teal-500',
                  'from-emerald-400 to-emerald-500',
                  'from-sky-400 to-sky-500'
                ];

                return (
                  <div key={unit} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-semibold tracking-wide truncate max-w-[80%] text-gray-700 dark:text-gray-200">
                        {unit}
                      </span>
                      <span className="font-mono font-bold text-amber-500">{count} ASN</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div 
                        style={{ width: `${widthPerc}%` }} 
                        className={`h-full rounded-full bg-gradient-to-r ${barColors[i % barColors.length]} transition-all duration-750`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SECTION: MONITORING KENAIKAN GAJI BERKALA (KGB) */}
      <div className={`p-6 md:p-8 rounded-[24px] border ${
        darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150/80 shadow-sm shadow-gray-100/50 text-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-150 dark:border-gray-800 font-sans">
          <div>
            <span className="font-extrabold text-[10px] tracking-widest text-[#F4B400] uppercase block mb-1">
              Modul Kepegawaian Otomatis
            </span>
            <h3 className="text-xl font-black tracking-tight font-display flex items-center gap-2">
              <DollarSign className="w-5.5 h-5.5 text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 p-1 rounded-lg" />
              MONITORING KENAIKAN GAJI BERKALA (KGB)
            </h3>
            <p className="text-xs text-gray-405 dark:text-gray-550 mt-1 font-medium font-sans">
              Prediksi KGB instan real-time berdasarkan decoding data NIP & golongan awal NRP dikoordinasikan otomatis
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-gray-500">Live Status Sync</span>
          </div>
        </div>

        {/* KGB MINI KPI BADGES GROUP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 font-sans">
          
          {/* Card 1: KGB Bulan Ini */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.015] ${
            darkMode 
              ? 'bg-amber-500/5 border-amber-500/15 text-white' 
              : 'bg-amber-50/50 border-amber-300/[0.45] text-slate-850'
          }`}>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">KGB Bulan Ini</p>
              <h4 className="text-2xl font-black font-display text-amber-500 mt-1">{kgbBulanIni.length} <span className="text-xs font-semibold text-gray-400 lowercase animate-pulse">orang</span></h4>
              <p className="text-[9px] text-gray-450 dark:text-gray-500 font-sans mt-0.5">Jatuh tempo bulan ini (Juni 2026)</p>
            </div>
          </div>

          {/* Card 2: KGB 3 Bulan Depan */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.015] ${
            darkMode 
              ? 'bg-indigo-500/5 border-indigo-500/15 text-white' 
              : 'bg-indigo-50/30 border-indigo-200/50 text-slate-850'
          }`}>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">KGB 3 Bulan Ke Depan</p>
              <h4 className="text-2xl font-black font-display text-indigo-500 mt-1">{kgb3BulanKeDepan.length} <span className="text-xs font-semibold text-gray-400 lowercase">orang</span></h4>
              <p className="text-[9px] text-gray-450 dark:text-gray-500 font-sans mt-0.5">TMT Juni s.d. Agustus 2026</p>
            </div>
          </div>

          {/* Card 3: Terlambat Diproses */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.015] ${
            darkMode 
              ? 'bg-rose-500/5 border-rose-500/15 text-white' 
              : 'bg-rose-50/30 border-rose-200/50 text-slate-850'
          }`}>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Terlambat Diproses</p>
              <h4 className="text-2xl font-black font-display text-rose-500 mt-1">{kgbTerlambat.length} <span className="text-xs font-semibold text-gray-400 lowercase">orang</span></h4>
              <p className="text-[9px] text-rose-450 dark:text-gray-500 font-sans mt-0.5">Administrasi terdeteksi overdue/keterlambatan</p>
            </div>
          </div>

        </div>

        {/* KGB INTERNAL DATA TABLE LIST */}
        <div className="space-y-3 font-sans">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 scroll-mt-20 font-sans mb-3 flex items-center gap-1.5">
            Daftar Real-time Jatuh Tempo KGB Terdekat 
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-[10px] rounded-md text-gray-500 font-mono font-bold leading-normal">{upcomingKgbList.length} ASN Terkait</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-sans min-w-[800px]">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[10px] tracking-wider ${
                  darkMode ? 'bg-gray-950/40 border-gray-850 text-gray-400' : 'bg-gray-50 border-gray-150 text-slate-500'
                }`}>
                  <th className="py-3 px-4">Nama / NIP</th>
                  <th className="py-3 px-3 text-center">NRP / Gol Awal</th>
                  <th className="py-3 px-3 text-center">TMT CPNS / KGB 1</th>
                  <th className="py-3 px-3 text-center">KGB Terakhir</th>
                  <th className="py-3 px-3 text-center">KGB Berikutnya (YAD)</th>
                  <th className="py-3 px-3 text-center">Status Pemantauan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-850 leading-relaxed">
                {upcomingKgbList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 dark:text-gray-550 font-medium font-sans">
                      Tidak ada data KGB yang terdeteksi
                    </td>
                  </tr>
                ) : (
                  upcomingKgbList.map((e) => {
                    const diffYad = getDaysDiff(e.kgbYAD);
                    const isOverdue = e.statusKgb === 'Terlambat Diproses';
                    const isThisMonth = e.statusKgb === 'Jatuh Tempo Bulan Ini';
                    const isThisYear = e.statusKgb === 'Jatuh Tempo Tahun Ini';

                    return (
                      <tr 
                        key={e.id} 
                        className={`transition-colors group hover:bg-slate-50 dark:hover:bg-gray-800/10 ${
                          isOverdue 
                            ? 'bg-rose-500/[0.015]' 
                            : isThisMonth 
                            ? 'bg-amber-500/[0.015]' 
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img 
                            src={e.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                            alt={e.nama} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-gray-250 dark:border-gray-700 shrink-0 select-none"
                          />
                          <div className="min-w-0">
                            <span 
                              onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}
                              className="font-bold text-slate-800 dark:text-gray-150 text-xs tracking-tight hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer block leading-snug truncate group-hover:underline"
                            >
                              {e.nama}
                            </span>
                            <span className="text-[9.5px] text-gray-400 dark:text-gray-500 font-mono tracking-tight block mt-0.5">NIP: {e.nip?.split('/')[0]?.trim()}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5">
                            <span className="inline-block text-[9px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded font-mono shrink-0">
                              NRP {e.nip?.split('/')[1]?.trim() || '-'}
                            </span>
                            <div className="text-[9.5px] text-gray-400 font-medium">Awal: <span className="font-bold text-slate-600 dark:text-gray-300">{e.golonganAwal || '-'}</span></div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] font-bold text-gray-600 dark:text-gray-300">{e.tmtCpns || '-'}</span>
                            <div className="text-[9px] text-gray-400 font-medium font-sans">K1: {e.kgbPertama || '-'}</div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                          {e.kgbTerakhir || '-'}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5 border-r border-dotted border-gray-200 dark:border-gray-800 pr-1">
                            <span className="font-mono text-[10.5px] font-extrabold tracking-tight text-slate-800 dark:text-gray-100">{e.kgbYAD || '-'}</span>
                            <div className="text-[9px] text-gray-400 font-semibold">
                              {diffYad === 0 ? (
                                <span className="text-amber-500 font-bold animate-pulse">✓ Hari ini!</span>
                              ) : diffYad < 0 ? (
                                <span className="text-rose-500 font-bold">{Math.abs(diffYad)} hari lalu</span>
                              ) : (
                                <span className="text-emerald-500 font-bold">{diffYad} hari lagi</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold inline-block leading-none border uppercase font-sans tracking-wider ${
                            isOverdue 
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/5 animate-pulse' 
                              : isThisMonth 
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/5 animate-pulse' 
                              : isThisYear 
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                          }`}>
                            {e.statusKgb || 'Belum Jatuh Tempo'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-[10px] leading-none font-bold text-slate-600 hover:text-amber-500 hover:border-amber-500 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:border-amber-400 cursor-pointer transition-all bg-white dark:bg-gray-950 shadow-xs"
                          >
                            Buka
                            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION: MONITORING BATAS USIA PENSIUN */}
      <div className={`p-6 md:p-8 rounded-[24px] border ${
        darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150/80 shadow-sm shadow-gray-100/50 text-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-150 dark:border-gray-800 font-sans">
          <div>
            <span className="font-extrabold text-[10px] tracking-widest text-[#F4B400] uppercase block mb-1">
              Sistem Pemantauan Masa Bakti
            </span>
            <h3 className="text-xl font-black tracking-tight font-display flex items-center gap-2">
              <Calendar className="w-5.5 h-5.5 text-rose-500 bg-rose-500/10 dark:bg-rose-500/15 p-1 rounded-lg" />
              MONITORING BATAS USIA PENSIUN (BUP)
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium font-sans">
              Daftar Pegawai Negeri Sipil yang memasuki batas usia pensiun dalam 1 tahun terdekat
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15">
              Jaksa: 60 Tahun
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              TU / Staf: 58 Tahun
            </span>
          </div>
        </div>

        {/* PENSION DATA TABLE LIST */}
        <div className="space-y-3 font-sans">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 scroll-mt-20 font-sans mb-3 flex items-center gap-1.5">
            Daftar PNS Memasuki Masa BUP 
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-[10px] rounded-md text-gray-500 font-mono font-bold leading-normal">{upcomingPensiunList.length} ASN Terkait</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-sans min-w-[800px]">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[10px] tracking-wider ${
                  darkMode ? 'bg-gray-950/40 border-gray-850 text-gray-400' : 'bg-gray-50 border-gray-150 text-slate-500'
                }`}>
                  <th className="py-3 px-4">Nama / NIP</th>
                  <th className="py-3 px-3">Jabatan & Satuan Kerja</th>
                  <th className="py-3 px-3 text-center">Status Jaksa</th>
                  <th className="py-3 px-3 text-center">Tanggal Lahir</th>
                  <th className="py-3 px-3 text-center">Ketentuan BUP</th>
                  <th className="py-3 px-3 text-center">TMT Pensiun</th>
                  <th className="py-3 px-3 text-center">Sisa Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-850 leading-relaxed font-sans">
                {upcomingPensiunList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 dark:text-gray-550 font-medium font-sans animate-pulse">
                      Tidak ada pegawai yang memasuki Batas Usia Pensiun dalam 1 tahun terdekat
                    </td>
                  </tr>
                ) : (
                  upcomingPensiunList.map((e) => {
                    const diffDays = getDaysDiff(e.pensiunTMT);
                    const isJaksa = e.statusJaksa === 'Jaksa';
                    const bupLimit = isJaksa ? 60 : 58;

                    // Calculate current age
                    let currentAge = '-';
                    if (e.tanggalLahir) {
                      const dob = new Date(e.tanggalLahir);
                      const diffMs = TODAY.getTime() - dob.getTime();
                      const ageDate = new Date(diffMs);
                      currentAge = `${Math.abs(ageDate.getUTCFullYear() - 1970)} Thn`;
                    }

                    return (
                      <tr 
                        key={e.id} 
                        className={`transition-colors group hover:bg-slate-50/80 dark:hover:bg-gray-800/10 ${
                          diffDays <= 60 && diffDays >= 0
                            ? 'bg-rose-500/[0.015]' 
                            : diffDays < 0 
                            ? 'bg-slate-100/10'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img 
                            src={e.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                            alt={e.nama} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-gray-250 dark:border-gray-700 shrink-0 select-none"
                          />
                          <div className="min-w-0">
                            <span 
                              onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}
                              className="font-bold text-slate-800 dark:text-gray-150 text-xs tracking-tight hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer block leading-snug truncate group-hover:underline"
                            >
                              {e.nama}
                            </span>
                            <span className="text-[9.5px] text-gray-400 dark:text-gray-555 font-mono block mt-0.5">NIP: {e.nip?.split('/')[0]?.trim()}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 max-w-[240px]">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-gray-300 truncate leading-snug">{e.jabatan}</div>
                          <div className="text-[9.5px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{e.unitKerja}</div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${
                            isJaksa
                              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {isJaksa ? 'Jaksa' : 'Staf / TU'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10.5px] font-semibold text-gray-600 dark:text-gray-350">{e.tanggalLahir || '-'}</span>
                            <div className="text-[9px] text-gray-405 dark:text-gray-550 font-medium font-sans">Usia: {currentAge}</div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-[11px] text-gray-700 dark:text-gray-300">
                          {bupLimit} Tahun
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-[11px] font-extrabold text-slate-850 dark:text-gray-100">
                          {e.pensiunTMT || '-'}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="font-semibold text-[11px]">
                            {diffDays === 0 ? (
                              <span className="text-amber-500 font-black animate-pulse">✓ BUP Hari Ini!</span>
                            ) : diffDays < 0 ? (
                              <span className="text-gray-400 dark:text-gray-500 font-medium">Masa Bakti Selesai ({Math.abs(diffDays)} hari lalu)</span>
                            ) : diffDays <= 60 ? (
                              <span className="text-rose-500 font-black animate-pulse">Tinggal {diffDays} hari lagi!</span>
                            ) : (
                              <span className="text-emerald-500 font-bold">{diffDays} hari lagi</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => { onSelectEmployee(e); setCurrentTab('pegawai'); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-200 dark:border-gray-800 text-[10px] leading-none font-bold text-slate-650 hover:text-amber-500 hover:border-amber-500 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:border-amber-400 cursor-pointer transition-all bg-white dark:bg-gray-950 shadow-xs"
                          >
                            Buka Profil
                            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Assistant Proactive Insight Panel */}
      <div className={`p-5 rounded-[20px] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border ${
        darkMode ? 'bg-gray-900/60 border-neutral-800' : 'bg-gradient-to-br from-indigo-50/50 to-amber-50/50 border-amber-200/50'
      }`}>
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-sm font-bold font-sans tracking-wide ${darkMode ? 'text-amber-400' : 'text-slate-800'}`}>
              Insight Otomatis SIMPATI AI
            </h4>
            <p className="text-xs text-gray-555 leading-relaxed font-sans">
              Anda memiliki <strong>{totalKgb30Days} berkas Kenaikan Gaji Berkala (KGB)</strong> dan <strong>{totalPangkat60Days} usul Kenaikan Pangkat (KP)</strong> yang harus segera diproses minggu ini. Silahkan buka menu <strong>Data Pegawai</strong> untuk mencetak dokumen format SKCPNS/SKPNS secara massal.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentTab('ai')}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-200 shrink-0 cursor-pointer"
        >
          Tanya Insight Pelayanan
        </button>
      </div>

    </div>
  );
}
