/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee } from '../types';
import { 
  User, 
  Award, 
  Briefcase, 
  Coins, 
  ChevronLeft
} from 'lucide-react';

interface ProfileTabProps {
  employee: Employee;
  onBackToList?: () => void;
  darkMode: boolean;
}

export function getJenisJabatan(jabatan: string, eselon?: string): 'Struktural' | 'JFT' | 'JFU' {
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

export default function ProfileTab({
  employee,
  onBackToList,
  darkMode
}: ProfileTabProps) {
  const jenisJabatan = getJenisJabatan(employee.jabatan, employee.eselon);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Back button option for responsive drawers */}
      {onBackToList && (
        <button
          onClick={onBackToList}
          className={`px-4 py-2 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Tabel Data
        </button>
      )}

      {/* Profile Header Block */}
      <div className={`p-6 rounded-[20px] border relative overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/50 text-slate-850'
      }`}>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          
          {/* Picture frame */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-amber-500 bg-slate-950 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
            {employee.gender === 'P' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <User className="w-12 h-12 md:w-16 md:h-16" />
                <span className="text-[9px] font-bold tracking-widest font-mono mt-1 text-pink-400/90">PEREMPUAN</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <User className="w-12 h-12 md:w-16 md:h-16" />
                <span className="text-[9px] font-bold tracking-widest font-mono mt-1 text-blue-400/90">LAKI-LAKI</span>
              </div>
            )}
          </div>

          {/* Primary credentials */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                employee.statusPegawai?.toUpperCase() === 'PNS' 
                  ? 'bg-emerald-500/20 text-emerald-500' 
                  : employee.statusPegawai?.toUpperCase().includes('PPPK')
                  ? 'bg-amber-500/20 text-amber-500'
                  : employee.statusPegawai?.toUpperCase().includes('CPNS')
                  ? 'bg-blue-500/20 text-blue-500'
                  : 'bg-indigo-505/20 text-indigo-400'
              }`}>
                {employee.statusPegawai}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                Golongan {employee.golongan}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                jenisJabatan === 'Struktural'
                  ? 'bg-red-500/15 text-red-500'
                  : jenisJabatan === 'JFT'
                  ? 'bg-teal-500/15 text-teal-500'
                  : 'bg-gray-500/15 text-gray-500'
              }`}>
                {jenisJabatan}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold font-display leading-snug">
              {employee.nama}
            </h3>
            <div className="text-sm space-y-1 text-gray-400 font-sans font-medium">
              {(() => {
                const parts = (employee.nip || '').split('/');
                const nipVal = parts[0]?.trim() || '-';
                const nrpVal = parts[1]?.trim() || '';
                return (
                  <div className="space-y-0.5 leading-normal">
                    <p className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-extrabold text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">NIP</span> 
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{nipVal}</span>
                    </p>
                    {nrpVal && (
                      <p className="flex items-center gap-1.5 font-mono text-xs mt-1">
                        <span className="font-extrabold text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">NRP</span> 
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{nrpVal}</span>
                      </p>
                    )}
                  </div>
                );
              })()}
              <p className="text-gray-700 dark:text-gray-300 font-semibold">{employee.jabatan}</p>
              <p className="text-xs text-amber-500">{employee.pangkat} / {employee.unitKerja}</p>
            </div>
          </div>
        </div>

        {/* Decorative background overlay */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Bento-grid single view profile content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cell 1: Identitas Kepegawaian */}
        <div className={`p-6 rounded-[20px] border shadow-sm transition-all duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150 text-slate-850'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 mb-4 border-gray-200 dark:border-gray-800">
            <User className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm tracking-wide uppercase font-display text-slate-800 dark:text-gray-205">Identitas Pegawai</h4>
          </div>
          <div className="space-y-4 text-sm font-medium">
            {(() => {
              const parts = (employee.nip || '').split('/');
              const nipVal = parts[0]?.trim() || '-';
              const nrpVal = parts[1]?.trim() || '';
              
              const pItems = [
                { label: 'Nama Lengkap', value: employee.nama },
                { label: 'NIP Baru (18 Digit)', value: nipVal, isMono: true },
              ];
              
              if (nrpVal) {
                pItems.push({ label: 'NRP / No. Register', value: nrpVal, isMono: true });
              }
              
              pItems.push(
                { label: 'Status Kepegawaian', value: employee.statusPegawai, isMono: false },
                { label: 'Status Jaksa', value: employee.statusJaksa || '-', isMono: false },
                { label: 'Jenis Kelamin', value: employee.gender === 'L' ? 'Laki-Laki' : 'Perempuan', isMono: false },
                { label: 'Tanggal Lahir', value: employee.tanggalLahir || '-', isMono: false },
                { label: 'Batas Usia Pensiun', value: `${employee.statusJaksa === 'Jaksa' ? '60 Tahun' : '58 Tahun'} (TMT: ${employee.pensiunTMT})`, isMono: false }
              );
              
              return pItems.map((prop, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                  <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">{prop.label}</span>
                  <span className={`font-semibold text-right ${prop.isMono ? 'font-mono text-xs text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-gray-200'}`}>
                    {prop.value}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Cell 2: Jabatan & Satker */}
        <div className={`p-6 rounded-[20px] border shadow-sm transition-all duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150 text-slate-850'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 mb-4 border-gray-200 dark:border-gray-800">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm tracking-wide uppercase font-display text-slate-800 dark:text-gray-205">Jabatan & Penempatan</h4>
          </div>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Jabatan Struktural/Fungsional</span>
              <span className="text-slate-850 dark:text-gray-200 font-semibold text-right max-w-[200px] truncate" title={employee.jabatan}>{employee.jabatan}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Jenis Jabatan</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                jenisJabatan === 'Struktural'
                  ? 'bg-red-500/15 text-red-500'
                  : jenisJabatan === 'JFT'
                  ? 'bg-teal-500/15 text-teal-500'
                  : 'bg-gray-500/15 text-gray-500'
              }`}>{jenisJabatan}</span>
            </div>
            {employee.eselon && employee.eselon !== '-' && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
                <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Eselon</span>
                <span className="text-slate-850 dark:text-gray-200 font-extrabold font-mono text-xs bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400">{employee.eselon}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">TMT Jabatan</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-semibold">{employee.tmtJabatan || '-'}</span>
            </div>
            {employee.tmtJabatan && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
                <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Lama Menjabat</span>
                <span className="text-slate-850 dark:text-gray-200 font-sans font-semibold">
                  {employee.lamaMenjabat || (() => {
                    const tmt = new Date(employee.tmtJabatan);
                    if (isNaN(tmt.getTime())) return '-';
                    const ref = new Date('2026-06-05');
                    let years = ref.getFullYear() - tmt.getFullYear();
                    let months = ref.getMonth() - tmt.getMonth();
                    if (months < 0 || (months === 0 && ref.getDate() < tmt.getDate())) {
                      years--;
                      months += 12;
                    }
                    if (ref.getDate() < tmt.getDate()) {
                      months--;
                      if (months < 0) {
                        months += 12;
                        years--;
                      }
                    }
                    const parts = [];
                    if (years > 0) parts.push(`${years} Tahun`);
                    if (months > 0 || years === 0) parts.push(`${months} Bulan`);
                    return parts.join(' ') || '0 Bulan';
                  })()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Unit Kerja / Satker</span>
              <span className="text-slate-850 dark:text-gray-200 font-semibold text-right max-w-[180px] truncate" title={employee.unitKerja}>{employee.unitKerja}</span>
            </div>
          </div>
        </div>

        {/* Cell 3: Kenaikan Pangkat */}
        <div className={`p-6 rounded-[20px] border shadow-sm transition-all duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150 text-slate-850'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 mb-4 border-gray-200 dark:border-gray-800">
            <Award className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm tracking-wide uppercase font-display text-slate-800 dark:text-gray-205">Pangkat & Golongan</h4>
          </div>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Pangkat Terakhir</span>
              <span className="text-slate-850 dark:text-gray-200 font-semibold">{employee.pangkat}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Golongan Ruang</span>
              <span className="text-amber-500 font-mono font-extrabold">{employee.golongan}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">TMT Pangkat Aktif</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-semibold">{employee.pangkatTerakhir || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Rencana Kenaikan Pangkat YAD</span>
              <span className="text-indigo-500 font-mono font-semibold">{employee.pangkatYAD || '-'}</span>
            </div>
          </div>
        </div>

        {/* Cell 4: Gaji Berkala / KGB */}
        <div className={`p-6 rounded-[20px] border shadow-sm transition-all duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150 text-slate-850'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 mb-4 border-gray-200 dark:border-gray-800">
            <Coins className="w-5 h-5 text-teal-400" />
            <h4 className="font-bold text-sm tracking-wide uppercase font-display text-slate-800 dark:text-gray-205">Sistem Kenaikan Gaji Berkala (KGB)</h4>
          </div>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Golongan Awal</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400">{employee.golonganAwal || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">TMT CPNS</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-semibold">{employee.tmtCpns || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">KGB Pertama</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-semibold">{employee.kgbPertama || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">TMT KGB Terakhir</span>
              <span className="text-slate-850 dark:text-gray-200 font-mono font-semibold">{employee.kgbTerakhir || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">KGB YAD (Mendatang)</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-mono font-extrabold">{employee.kgbYAD || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800/50 border-none pb-0">
              <span className="text-xs text-gray-400 font-sans tracking-wide uppercase">Status KGB</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                employee.statusKgb === 'Terlambat Diproses'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : employee.statusKgb === 'Jatuh Tempo Bulan Ini'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                  : employee.statusKgb === 'Jatuh Tempo Tahun Ini'
                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/10'
                  : 'bg-slate-100 text-slate-600 dark:bg-gray-850 dark:text-gray-405'
              }`}>{employee.statusKgb || 'Belum Jatuh Tempo'}</span>
            </div>
            <div className="mt-2 text-[10.5px] text-gray-400 leading-relaxed font-sans italic bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10">
              Semua agenda kenaikan berkala di atas diprediksi secara otomatis & live dari nomor NIP PNS & NRP golongan awal tanpa input manual.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
