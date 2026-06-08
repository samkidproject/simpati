/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee } from '../types';
import { 
  Search, 
  Download, 
  Printer, 
  ArrowUpDown, 
  Filter, 
  Eye, 
  X, 
  CheckCircle,
  TrendingDown,
  Building,
  UserCheck,
  Upload,
  Trash2,
  RefreshCw,
  User,
  Copy,
  Check
} from 'lucide-react';
import { parseExcelToEmployees } from '../utils/excelParser';

interface TableTabProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  selectedEmployee: Employee | null;
  darkMode: boolean;
  onUpdateEmployees?: (newEmployees: Employee[]) => void;
  instansiName?: string;
  instansiAddress?: string;
}

type SortKey = 'nip' | 'nama' | 'golongan' | 'jabatan' | 'unitKerja' | 'statusPegawai' | 'tmtJabatan';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function getJenisJabalan(jabatan: string, eselon?: string): 'Struktural' | 'JFT' | 'JFU' {
  // Retained for any legacy references, but let's redefine getJenisJabatan below
  return getJenisJabatan(jabatan, eselon);
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

export default function TableTab({
  employees,
  onSelectEmployee,
  selectedEmployee,
  darkMode,
  onUpdateEmployees,
  instansiName = 'Dinas Komunikasi, Informatika, dan Statistik',
  instansiAddress = 'Jl. Letjen Ryacudu No. 17, Bandar Lampung'
}: TableTabProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGolongan, setFilterGolongan] = useState('');
  const [filterUnitKerja, setFilterUnitKerja] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenisJabatan, setFilterJenisJabatan] = useState('');
  const [filterEselon, setFilterEselon] = useState('');
  const [filterTenureJabatan, setFilterTenureJabatan] = useState('');

  // Import states
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    count?: number;
  }>({ status: 'idle', message: '' });

  // Custom states for dataset control
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Perform full database wipe
  const handleWipeDatabase = () => {
    if (onUpdateEmployees) {
      onUpdateEmployees([]);
      setImportStatus({
        status: 'success',
        message: 'Database berhasil dibersihkan seluruhnya! (0 pegawai aktif)'
      });
      setShowClearConfirm(false);
      setTimeout(() => {
        setImportStatus({ status: 'idle', message: '' });
      }, 5500);
    }
  };

  // Perform permanent individual employee deletion
  const handleDeleteEmployee = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateEmployees) {
      const filtered = employees.filter(emp => emp.id !== idToDelete);
      onUpdateEmployees(filtered);
      
      // Clear selection if the deleted employee was being viewed
      if (selectedEmployee?.id === idToDelete) {
        onSelectEmployee(null as any);
      }

      setImportStatus({
        status: 'success',
        message: 'Pegawai berhasil dihapus secara permanen!'
      });
      setTimeout(() => {
        setImportStatus({ status: 'idle', message: '' });
      }, 4000);
    }
  };

  // State to track copied animation per employee row
  const [copiedEmployeeId, setCopiedEmployeeId] = useState<string | null>(null);

  // Perform copying of formatted text
  const handleCopyEmployeeData = (e: Employee, evt: React.MouseEvent) => {
    evt.stopPropagation();
    const txt = `Nama: ${e.nama}
NIP: ${e.nip || '-'}
Pangkat/Golongan: ${e.pangkat || '-'} (${e.golongan || '-'})
Jabatan: ${e.jabatan || '-'}
Unit Kerja: ${e.unitKerja || '-'}`;

    navigator.clipboard.writeText(txt).then(() => {
      setCopiedEmployeeId(e.id);
      setTimeout(() => {
        setCopiedEmployeeId(null);
      }, 2000);
    });
  };

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
            // Filter duplicates out (match by NIP, which is unique)
            const existingNips = new Set(employees.map(emp => emp.nip));
            const uniqueParsed = parsed.filter(emp => !existingNips.has(emp.nip));
            
            // To ensure they appear at the top, we prepend them
            const merged = [...uniqueParsed, ...employees];
            onUpdateEmployees(merged);

            setImportStatus({
              status: 'success',
              message: `Berhasil mengunggah ${uniqueParsed.length} personil Kejaksaan Baru! (Ada ${parsed.length - uniqueParsed.length} duplikat diabaikan)`,
              count: uniqueParsed.length
            });
          } else {
            setImportStatus({
              status: 'success',
              message: `Telah memproses ${parsed.length} personil Kejaksaan!`,
              count: parsed.length
            });
          }

          // Reset status notification after 6s
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

  // Primary and secondary sorting states
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { key: 'nama', direction: 'asc' }
  ]);

  // Infinite Scroll rendering control
  const [visibleCount, setVisibleCount] = useState(100);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fullDataset = employees;

  // Extract filter options dynamically from full generated list
  const golonganOptions = useMemo(() => {
    const list = new Set(fullDataset.map(e => e.golongan));
    return Array.from(list).sort();
  }, [fullDataset]);

  const unitKerjaOptions = useMemo(() => {
    const list = new Set(fullDataset.map(e => e.unitKerja));
    return Array.from(list).sort();
  }, [fullDataset]);

  const eselonOptions = useMemo(() => {
    const list = new Set(fullDataset.map(e => e.eselon).filter((es): es is string => !!es && es !== '-'));
    return Array.from(list).sort();
  }, [fullDataset]);

  const statusOptions = useMemo(() => {
    const list = new Set(fullDataset.map(e => e.statusPegawai).filter((st): st is string => !!st));
    return Array.from(list).sort();
  }, [fullDataset]);

  // Multi-column Sorting Handler
  const handleSort = (key: SortKey) => {
    setSortConfigs((prev) => {
      const existing = prev.find(config => config.key === key);
      if (existing) {
        if (existing.direction === 'asc') {
          return [{ key, direction: 'desc' }];
        } else {
          return []; // Remove sort
        }
      }
      return [{ key, direction: 'asc' }];
    });
    // Reset view bounds on sort change
    setVisibleCount(100);
  };

  // Real-time filtering matching search term & select properties
  const filteredDataset = useMemo(() => {
    let result = fullDataset;

    // Search query
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.nama.toLowerCase().includes(term) ||
        e.nip.includes(term) ||
        e.jabatan.toLowerCase().includes(term) ||
        e.unitKerja.toLowerCase().includes(term)
      );
    }

    // Dropdown filters
    if (filterGolongan) {
      result = result.filter(e => e.golongan === filterGolongan);
    }
    if (filterUnitKerja) {
      result = result.filter(e => e.unitKerja === filterUnitKerja);
    }
    if (filterStatus) {
      result = result.filter(e => e.statusPegawai === filterStatus);
    }
    if (filterJenisJabatan) {
      result = result.filter(e => getJenisJabatan(e.jabatan, e.eselon) === filterJenisJabatan);
    }
    if (filterEselon) {
      result = result.filter(e => e.eselon === filterEselon);
    }
    if (filterTenureJabatan) {
      const minYears = parseInt(filterTenureJabatan, 10);
      result = result.filter(e => {
        if (!e.tmtJabatan) return false;
        const tmt = new Date(e.tmtJabatan);
        if (isNaN(tmt.getTime())) return false;
        const ref = new Date('2026-06-05');
        let years = ref.getFullYear() - tmt.getFullYear();
        const m = ref.getMonth() - tmt.getMonth();
        if (m < 0 || (m === 0 && ref.getDate() < tmt.getDate())) {
          years--;
        }
        return years >= minYears;
      });
    }

    // Apply Sorting configuration
    if (sortConfigs.length > 0) {
      const { key, direction } = sortConfigs[0];
      const modifier = direction === 'asc' ? 1 : -1;

      result = [...result].sort((a, b) => {
        const valA = a[key] || '';
        const valB = b[key] || '';
        
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
    }

    return result;
  }, [fullDataset, searchTerm, filterGolongan, filterUnitKerja, filterStatus, filterJenisJabatan, filterEselon, filterTenureJabatan, sortConfigs]);

  // Infinite Scroll Trigger
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 350; // trigger loading 350px before bottom
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + threshold;
    
    if (isAtBottom && visibleCount < filteredDataset.length) {
      setVisibleCount(prev => Math.min(prev + 100, filteredDataset.length));
    }
  };

  // Lazy recovery reset
  useEffect(() => {
    setVisibleCount(100);
  }, [searchTerm, filterGolongan, filterUnitKerja, filterStatus, filterJenisJabatan, filterEselon, filterTenureJabatan]);

  // Sliced Render set
  const renderedEmployees = useMemo(() => {
    return filteredDataset.slice(0, visibleCount);
  }, [filteredDataset, visibleCount]);

  // Export to Excel (Clean CSV Formatter)
  const handleExportCSV = () => {
    const headers = ['Nomor', 'NIP', 'Nama Pegawai', 'Pangkat', 'Golongan', 'Eselon', 'Status Jaksa', 'Jabatan', 'Unit Kerja', 'Status Pegawai'];
    const rows = filteredDataset.map((e, index) => [
      index + 1,
      `'${e.nip}`, // Prevent scientific formatting in excel
      e.nama,
      e.pangkat || '-',
      e.golongan,
      e.eselon || '-',
      e.statusJaksa || '-',
      e.jabatan,
      e.unitKerja,
      e.statusPegawai
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pegawai_SIMPATI_${filterUnitKerja || 'Semua'}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Triggers Print Window with Dedicated Clean Stylesheet print Layout)
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredDataset.slice(0, 500).map((e, i) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${e.nip}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${e.nama}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.pangkat || '-'} (${e.golongan})</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${e.eselon || '-'}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${e.statusJaksa || '-'}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.jabatan}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.unitKerja}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${e.statusPegawai}</td>
      </tr>
    `).join('');

    const activeFilters: string[] = [];
    if (searchTerm) activeFilters.push(`Kata Kunci: "${searchTerm}"`);
    if (filterGolongan) activeFilters.push(`Golongan: ${filterGolongan}`);
    if (filterUnitKerja) activeFilters.push(`Unit Kerja: ${filterUnitKerja}`);
    if (filterStatus) activeFilters.push(`Status Pegawai: ${filterStatus}`);
    if (filterJenisJabatan) activeFilters.push(`Jenis Jabatan: ${filterJenisJabatan}`);
    if (filterEselon) activeFilters.push(`Eselon: ${filterEselon}`);
    if (filterTenureJabatan) activeFilters.push(`Masa Jabatan: >= ${filterTenureJabatan} Tahun`);

    const filterDescription = activeFilters.length > 0 
      ? activeFilters.join(' | ') 
      : 'Semua Data Pegawai (Tanpa Filter)';

    printWindow.document.write(`
      <html>
        <head>
          <title>DATA PEGAWAI ${instansiName.toUpperCase()}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #111827; padding: 20px; }
            .header-container { text-align: center; margin-bottom: 20px; }
            .header-title { font-size: 16px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-subtitle { font-size: 11px; font-weight: 500; margin: 4px 0 0 0; color: #4b5563; }
            .kop-border { border: 0; border-top: 2px solid #111827; border-bottom: 1px solid #111827; height: 4px; margin-top: 8px; margin-bottom: 20px; }
            .meta-info { font-size: 10px; color: #374151; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
            .meta-line { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th { background-color: #111827; color: white; padding: 8px 6px; border: 1px solid #374151; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 8px; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header-container">
            <h1 class="header-title">DATA PEGAWAI ${instansiName.toUpperCase()}</h1>
            <p class="header-subtitle">${instansiAddress}</p>
            <div class="kop-border"></div>
          </div>
          
          <div class="meta-info">
            <div class="meta-line"><strong>Tanggal Cetak:</strong> 4 Juni 2026</div>
            <div class="meta-line"><strong>Total Pegawai:</strong> ${filteredDataset.length} orang (Ditampilkan ${Math.min(500, filteredDataset.length)} Teratas)</div>
            <div class="meta-line"><strong>Kriteria / Filter Aktif:</strong> <span style="color: #4f46e5; font-weight: bold;">${filterDescription}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%; text-align: center;">No</th>
                <th style="width: 15%;">NIP</th>
                <th style="width: 21%;">Nama Lengkap</th>
                <th style="width: 15%;">Pangkat (Gol)</th>
                <th style="width: 7%; text-align: center;">Eselon</th>
                <th style="width: 8%; text-align: center;">Jaksa</th>
                <th style="width: 18%;">Jabatan</th>
                <th style="width: 14%;">Unit Kerja</th>
                <th style="width: 6%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterGolongan('');
    setFilterUnitKerja('');
    setFilterStatus('');
    setFilterJenisJabatan('');
    setFilterEselon('');
    setFilterTenureJabatan('');
  };

  return (
    <div className="space-y-4 pb-20">
      
      {/* Search & Export Utility panel */}
      <div className={`p-4 md:p-5 rounded-[20px] border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/50'
      }`}>
        
        {/* Real-time search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            id="search-pegawai"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NIP, nama lengkap, jabatan..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-sans tracking-wide transition-all duration-200 outline-none ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white focus:border-[#F4B400]/80 focus:bg-gray-850'
                : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-[#F4B400] focus:bg-white'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Export / utilities button group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintPDF}
            title="Cetak/PDF"
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl border inline-flex items-center gap-2 font-sans cursor-pointer transition-all duration-200 ${
              darkMode 
                ? 'border-gray-700 hover:bg-gray-800 text-gray-200' 
                : 'border-gray-200 hover:bg-gray-50 text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            PDF / Cetak
          </button>
        </div>
      </div>

      {/* Dangerous Wipe Database Action confirmation dialog */}
      {showClearConfirm && (
        <div className={`p-5 rounded-[20px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans transition-all duration-300 ${
          darkMode 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
            : 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm shadow-rose-100/55'
        }`}>
          <div className="space-y-1.5 flex-1 pr-4">
            <h4 className="font-extrabold text-[#EA4335] text-sm tracking-wide flex items-center gap-2">
              <span className="text-base">⚠️</span> KONFIRMASI PENGHAPUSAN: Bersihkan Seluruh Database?
            </h4>
            <p className="text-xs text-slate-400 dark:text-gray-300 leading-relaxed font-semibold">
              Tindakan ini akan menghapus semua data pegawai aktif ({employees.length} pegawai) secara permanen dari sistem. 
              Sistem akan kembali kosong (`[]` pegawai aktif) sehingga Anda dapat mem-paste atau meload data Excel yang baru bersih tanpa bentrok data lama.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={handleWipeDatabase}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#EA4335] hover:bg-[#EA4335]/95 text-white shadow-md shadow-red-650/15 cursor-pointer transition-all duration-200"
            >
              Ya, Bersihkan Semua
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all duration-200 ${
                darkMode 
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                  : 'border-gray-300 hover:bg-gray-100 text-slate-700'
              }`}
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Uploader feedback banner */}
      {importStatus.status !== 'idle' && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all duration-300 animation-slide-in ${
          importStatus.status === 'loading'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : importStatus.status === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {importStatus.status === 'loading' && (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {importStatus.status === 'success' && (
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button 
            onClick={() => setImportStatus({ status: 'idle', message: '' })}
            className="p-1 hover:bg-white/10 rounded-lg text-current"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Advanced Filter options panel */}
      <div className={`p-4 rounded-[20px] border flex flex-wrap items-center gap-3.5 transition-all duration-300 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/50'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mr-2 uppercase tracking-wide">
          <Filter className="w-4 h-4 text-[#F4B400]" />
          <span>Filter Data:</span>
        </div>

        {/* filter golongan select */}
        <div className="flex flex-col min-w-[120px]">
          <select
            id="filter-golongan"
            value={filterGolongan}
            onChange={(e) => setFilterGolongan(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Semua Golongan</option>
            {golonganOptions.map(gol => (
              <option key={gol} value={gol}>Golongan {gol}</option>
            ))}
          </select>
        </div>

        {/* filter unit kerja select */}
        <div className="flex flex-col min-w-[150px] max-w-[220px]">
          <select
            id="filter-unit"
            value={filterUnitKerja}
            onChange={(e) => setFilterUnitKerja(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer truncate ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Semua Unit Kerja</option>
            {unitKerjaOptions.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        {/* filter status select */}
        <div className="flex flex-col min-w-[125px]">
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Semua Status</option>
            {statusOptions.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* filter jenis jabatan select */}
        <div className="flex flex-col min-w-[130px]">
          <select
            id="filter-jenis-jabatan"
            value={filterJenisJabatan}
            onChange={(e) => setFilterJenisJabatan(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Semua Jenis Jabatan</option>
            <option value="Struktural">Struktural</option>
            <option value="JFT">JFT (Fungsional Tertentu)</option>
            <option value="JFU">JFU (Fungsional Umum)</option>
          </select>
        </div>

        {/* filter eselon select */}
        <div className="flex flex-col min-w-[120px]">
          <select
            id="filter-eselon"
            value={filterEselon}
            onChange={(e) => setFilterEselon(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Semua Eselon</option>
            {eselonOptions.map(es => (
              <option key={es} value={es}>Eselon {es}</option>
            ))}
          </select>
        </div>

        {/* filter masa jabatan select */}
        <div className="flex flex-col min-w-[150px]">
          <select
            id="filter-masa-jabatan"
            value={filterTenureJabatan}
            onChange={(e) => setFilterTenureJabatan(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium border outline-none cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          >
            <option value="">Masa Jabatan (Semua)</option>
            <option value="1">Masa Jabatan ≥ 1 Tahun</option>
            <option value="2">Masa Jabatan ≥ 2 Tahun</option>
            <option value="3">Masa Jabatan ≥ 3 Tahun</option>
            <option value="4">Masa Jabatan ≥ 4 Tahun</option>
            <option value="5">Masa Jabatan ≥ 5 Tahun</option>
            <option value="10">Masa Jabatan ≥ 10 Tahun</option>
          </select>
        </div>

        {/* Reset filters */}
        {(searchTerm || filterGolongan || filterUnitKerja || filterStatus || filterJenisJabatan || filterEselon || filterTenureJabatan) && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-rose-500 hover:text-rose-450 inline-flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            Reset Filter
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live dataset size indicator */}
      <div className="text-xs font-semibold flex items-center justify-between text-gray-400 font-mono">
        <span>Menampilkan {filteredDataset.length.toLocaleString()} pegawai (Dari {employees.length.toLocaleString()} database aktif)</span>
        {filteredDataset.length !== fullDataset.length && (
          <span className="text-amber-500 animate-pulse">Saring aktif</span>
        )}
      </div>

      {/* Main Responsive Table Wrapper with Sticky Header */}
      <div 
        ref={tableContainerRef}
        onScroll={handleScroll}
        className={`rounded-[20px] border shadow-sm max-h-[580px] overflow-y-auto transition-all duration-300 relative ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <table className="w-full text-left border-collapse font-sans">
          
          {/* Sticky Table Header */}
          <thead className={`sticky top-0 z-20 text-xs font-bold uppercase tracking-wider select-none ${
            darkMode ? 'bg-gray-850 border-b border-gray-850' : 'bg-gray-100/90 border-b border-gray-200'
          }`}>
            <tr>
              <th className="py-4 px-4 text-center w-12 text-gray-400">#</th>
              
              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500"
                onClick={() => handleSort('nip')}
              >
                <div className="flex items-center gap-1.5">
                  NIP / NRP
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500"
                onClick={() => handleSort('nama')}
              >
                <div className="flex items-center gap-1.5">
                  Nama Pegawai
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500 text-center"
                onClick={() => handleSort('golongan')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Pangkat / Golongan
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th className="py-4 px-4 text-center w-20 text-gray-600 dark:text-gray-300">Eselon</th>

              <th className="py-4 px-4 text-center w-16 text-gray-600 dark:text-gray-300">Jenis</th>

              <th className="py-4 px-4 text-center w-20 text-gray-600 dark:text-gray-300">Jaksa</th>

              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500"
                onClick={() => handleSort('jabatan')}
              >
                <div className="flex items-center gap-1.5">
                  Jabatan
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500"
                onClick={() => handleSort('tmtJabatan')}
              >
                <div className="flex items-center gap-1.5">
                  TMT Jabatan
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th 
                className="py-4 px-4 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-amber-500"
                onClick={() => handleSort('unitKerja')}
              >
                <div className="flex items-center gap-1.5">
                  Unit Kerja / Satker
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </th>

              <th className="py-4 px-4 text-center w-20">Status</th>
              <th className="py-4 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={`divide-y text-xs tracking-wide ${
            darkMode ? 'divide-gray-800' : 'divide-gray-150'
          }`}>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="max-w-md mx-auto py-8 px-4 flex flex-col items-center justify-center space-y-4 font-sans text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-2xl shadow-sm border border-amber-500/10">
                      📂
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-gray-200">Pangkalan Data Pegawai Kosong</h3>
                      <p className="text-xs text-slate-400 dark:text-gray-400 leading-relaxed max-w-sm">
                        Anda telah mengosongkan database personil Kejaksaan. Silakan hubungi Super Admin untuk mendaftarkan atau mengunggah file Excel baru melalui menu <strong>Pengaturan</strong>.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : renderedEmployees.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="max-w-md mx-auto py-8 px-4 flex flex-col items-center justify-center space-y-4 font-sans text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F4B400]/10 flex items-center justify-center text-[#F4B400] text-2xl shadow-sm border border-[#F4B400]/10">
                      🔍
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-gray-200">Tidak Ada Pegawai Yang Cocok</h3>
                      <p className="text-xs text-slate-400 dark:text-gray-400 leading-relaxed max-w-sm">
                        Tidak ada pegawai yang cocok dengan kriteria pencarian atau konfigurasi filter masa jabatan Anda saat ini.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#F4B400] text-slate-900 hover:bg-[#F4B400]/90 transition-all font-sans cursor-pointer whitespace-nowrap"
                      >
                        Reset / Atur Ulang Filter
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              renderedEmployees.map((e, index) => {
                const isSelected = selectedEmployee?.id === e.id;
                
                return (
                  <tr 
                    key={e.id}
                    className={`transition-colors duration-200 group ${
                      isSelected 
                        ? 'bg-amber-500/10' 
                        : darkMode 
                        ? 'hover:bg-gray-800/40 text-gray-300' 
                        : 'hover:bg-gray-50 text-slate-850'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-gray-400 font-mono font-medium">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4 select-all leading-normal">
                      {(() => {
                        const parts = (e.nip || '').split('/');
                        const nipVal = parts[0]?.trim() || '-';
                        const nrpVal = parts[1]?.trim() || '';
                        return (
                          <div className="flex flex-col gap-1 select-all font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 dark:bg-amber-500/15 px-[4px] py-[1px] rounded shrink-0 scale-90 origin-left">NIP</span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-205">{nipVal}</span>
                            </div>
                            {nrpVal && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-[4px] py-[1px] rounded shrink-0 scale-90 origin-left">NRP</span>
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{nrpVal}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                          {e.gender === 'P' ? (
                            <div className="w-full h-full bg-pink-500/10 border border-pink-500/25 text-pink-400 flex items-center justify-center rounded-xl">
                              <User className="w-4.5 h-4.5" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center rounded-xl">
                              <User className="w-4.5 h-4.5" />
                            </div>
                          )}
                        </div>
                        <div className="">
                          <p onClick={() => onSelectEmployee(e)} className="font-extrabold cursor-pointer hover:text-amber-500 hover:underline">{e.nama}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{e.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold inline-block leading-none ${
                        e.golongan.startsWith('IV') 
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                          : e.golongan.startsWith('III') 
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {e.pangkat || 'Jaksa'} / ({e.golongan})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-gray-200">
                      {e.eselon || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        getJenisJabatan(e.jabatan, e.eselon) === 'Struktural'
                          ? 'bg-red-500/15 text-red-500'
                          : getJenisJabatan(e.jabatan, e.eselon) === 'JFT'
                          ? 'bg-teal-500/15 text-teal-400'
                          : 'bg-gray-500/15 text-gray-400'
                      }`}>
                        {getJenisJabatan(e.jabatan, e.eselon)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        e.statusJaksa === 'Jaksa'
                          ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {e.statusJaksa || '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-xs leading-relaxed whitespace-normal min-w-[160px]">
                      {e.jabatan}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-850 dark:text-gray-300 font-semibold">{e.tmtJabatan}</div>
                      {e.tmtJabatan && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-sans mt-0.5 font-medium whitespace-nowrap">
                          {e.lamaMenjabat ? `(${e.lamaMenjabat})` : (() => {
                            const tmt = new Date(e.tmtJabatan);
                            if (isNaN(tmt.getTime())) return null;
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
                            if (years > 0) parts.push(`${years} thn`);
                            if (months > 0 || years === 0) parts.push(`${months} bln`);
                            return `(${parts.join(' ') || '0 bln'})`;
                          })()}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs leading-relaxed whitespace-normal min-w-[200px]" title={e.unitKerja}>
                      {e.unitKerja}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] ${
                        e.statusPegawai?.toUpperCase() === 'PNS' 
                          ? 'bg-emerald-500/20 text-emerald-500' 
                          : e.statusPegawai?.toUpperCase().includes('PPPK')
                          ? 'bg-amber-500/20 text-amber-500'
                          : e.statusPegawai?.toUpperCase().includes('CPNS')
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-indigo-505/20 text-indigo-400'
                      }`}>
                        {e.statusPegawai}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(evt) => handleCopyEmployeeData(e, evt)}
                          id={`copy-btn-${e.id}`}
                          className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                            copiedEmployeeId === e.id
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : darkMode
                              ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                              : 'bg-gray-50 border-gray-200 text-slate-500 hover:text-slate-850 hover:bg-gray-100'
                          }`}
                          title={copiedEmployeeId === e.id ? 'Data Tersalin!' : 'Salin Data Pegawai'}
                        >
                          {copiedEmployeeId === e.id ? (
                            <Check className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        {onUpdateEmployees && (
                          <button
                            onClick={(evt) => handleDeleteEmployee(e.id, evt)}
                            id={`del-btn-${e.id}`}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                            title="Hapus Pegawai Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      {/* Lazy list footer pagination summary */}
      {visibleCount < filteredDataset.length && (
        <div className="flex items-center justify-center pt-3">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400 font-sans">Menggulung layar ke bawah otomatis menampilkan data lainnya...</p>
            <button
              onClick={() => setVisibleCount(prev => Math.min(prev + 200, filteredDataset.length))}
              className={`px-4.5 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                darkMode 
                  ? 'border-gray-800 hover:bg-gray-800 text-gray-200' 
                  : 'border-gray-250 hover:bg-gray-50 text-slate-700'
              }`}
            >
              Muat 200 Baris Tambahan
            </button>
          </div>
        </div>
      )}



    </div>
  );
}
