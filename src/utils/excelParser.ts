/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Employee } from '../types';
import { enrichEmployeeKgb } from './kgbUtils';

/**
 * Parses the "Lama Menjabat (TMT)" cell. If it is a tenure duration string
 * (e.g., "1 thn 1 bln 19 hari"), it calculates a reverse TMT Jabatan date so that
 * filtering and rendering work perfectly relative to the dynamic upload reference date.
 */
export function parseTmtJabatanDate(cellVal: any): string {
  if (!cellVal) return '2025-01-01';

  const str = String(cellVal).trim();

  // Try to match duration pattern like "X thn Y bln Z hari"
  const yearsMatch = str.match(/(\d+)\s*(?:thn|tahun|year|years)/i);
  const monthsMatch = str.match(/(\d+)\s*(?:bln|bulan|month|months)/i);
  const daysMatch = str.match(/(\d+)\s*(?:hari|day|days)/i);

  if (yearsMatch || monthsMatch || daysMatch) {
    let years = 0;
    let months = 0;
    let days = 0;

    if (yearsMatch) years = parseInt(yearsMatch[1], 10);
    if (monthsMatch) months = parseInt(monthsMatch[1], 10);
    if (daysMatch) days = parseInt(daysMatch[1], 10);

    // Subtract from the actual dynamic upload date (today), keeping standard 2026 reference context
    const refDate = new Date();
    // Fallback safeguard if container system clock doesn't match standard 2026/06 application baseline
    if (refDate.getFullYear() < 2026) {
      refDate.setFullYear(2026);
      refDate.setMonth(5); // June (0-indexed 5)
      refDate.setDate(5); // 5th of June
    }

    refDate.setFullYear(refDate.getFullYear() - years);
    refDate.setMonth(refDate.getMonth() - months);
    refDate.setDate(refDate.getDate() - days);

    const y = refDate.getFullYear();
    const m = String(refDate.getMonth() + 1).padStart(2, '0');
    
    // For PNS/ASN administration, if no days are specified (e.g. "1 thn 5 bln"), 
    // the effective TMT is standardly on the 1st day of the month.
    let d = String(refDate.getDate()).padStart(2, '0');
    if (!daysMatch) {
      d = '01';
    }

    return `${y}-${m}-${d}`;
  }

  // Otherwise fallback to parseExcelDate
  return parseExcelDate(cellVal);
}

/**
 * Splits and cleans a raw Gol/Pangkat string. E.g.:
 * "Jaksa Utama Madya / (IV/d)" -> { golongan: "IV/d", pangkat: "Jaksa Utama Madya" }
 */
export function parseGolonganAndPangkat(rawGolPangkat: string): { golongan: string; pangkat: string } {
  if (!rawGolPangkat) {
    return { golongan: 'III/a', pangkat: 'Jaksa' };
  }

  // Identify Roman numeral golongan format e.g. IV/d, III/a, etc.
  const golonganRegex = /\b(I|II|III|IV)\s*\/([a-e])\b/i;
  const match = rawGolPangkat.match(golonganRegex);

  let golongan = 'III/a';
  let pangkat = 'Jaksa';

  if (match) {
    golongan = `${match[1].toUpperCase()}/${match[2].toLowerCase()}`;

    // Remove the matched golongan from the string
    let cleanPangkat = rawGolPangkat.replace(match[0], '');

    // Eliminate brackets, slashes, and excessive spaces
    cleanPangkat = cleanPangkat
      .replace(/[\(\)\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanPangkat) {
      pangkat = cleanPangkat;
    }
  } else {
    pangkat = rawGolPangkat.trim();
  }

  return { golongan, pangkat };
}

/**
 * Robustly parse an Excel cell value into normalized YYYY-MM-DD date format.
 * Supports JS Date objects, Excel serial numbers, and common Indonesian date strings.
 */
export function parseExcelDate(cellVal: any): string {
  if (!cellVal) return '2025-01-01';

  if (cellVal instanceof Date) {
    const y = cellVal.getFullYear();
    const m = String(cellVal.getMonth() + 1).padStart(2, '0');
    const d = String(cellVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle number (Excel serial date)
  if (typeof cellVal === 'number') {
    // Excel serial dates: days since Jan 1, 1900.
    // 25569 is Jan 1, 1970
    const rawMs = (cellVal - 25569) * 86400 * 1000;
    const date = new Date(rawMs);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      if (y > 1900 && y < 2100) {
        return `${y}-${m}-${d}`;
      }
    }
  }

  const str = String(cellVal).trim();
  if (!str || str.toLowerCase() === 'null' || str === '-') {
    return '2025-01-01';
  }

  // Indonesian month mapping for parsing textured dates like "12 Mei 2024"
  const monthsMap: { [key: string]: string } = {
    januari: '01', jan: '01',
    februari: '02', pebruari: '02', feb: '02', peb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agt: '08', agst: '08',
    september: '09', sep: '09', sept: '09',
    oktober: '10', okt: '10',
    november: '11', nopember: '11', nov: '11', nop: '11',
    desember: '12', des: '12'
  };

  const lowStr = str.toLowerCase();
  for (const [mName, mNum] of Object.entries(monthsMap)) {
    if (lowStr.includes(mName)) {
      // Find the day and year around the month name, e.g. "12 Mei 2024" or "12-Mei-24" or "12/Mei/2019"
      const rx = new RegExp(`(\\d{1,2})\\s*[-/\\s]\\s*${mName}\\s*[-/\\s]\\s*(\\d{2,4})`);
      const match = lowStr.match(rx);
      if (match) {
        const d = match[1].padStart(2, '0');
        let y = match[2];
        if (y.length === 2) {
          y = '20' + y;
        }
        return `${y}-${mNum}-${d}`;
      }
      
      // Try space-separated patterns such as "12 Mei 2024"
      const rxSpaced = new RegExp(`(\\d{1,2})\\s+${mName}\\s+(\\d{2,4})`);
      const matchSpaced = lowStr.match(rxSpaced);
      if (matchSpaced) {
        const d = matchSpaced[1].padStart(2, '0');
        let y = matchSpaced[2];
        if (y.length === 2) {
          y = '20' + y;
        }
        return `${y}-${mNum}-${d}`;
      }

      // Format "Mei 2024"
      const rxYearOnly = new RegExp(`${mName}\\s*[-/\\s]\\s*(\\d{2,4})`);
      const matchYear = lowStr.match(rxYearOnly);
      if (matchYear) {
        let y = matchYear[1];
        if (y.length === 2) {
          y = '20' + y;
        }
        return `${y}-${mNum}-01`;
      }
    }
  }

  // Try to clean/parse string
  // If it's a 5-digit number string, it's also probably an Excel serial key
  if (/^\d{5}$/.test(str)) {
    const num = parseInt(str, 10);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      if (y > 1900 && y < 2100) {
        return `${y}-${m}-${d}`;
      }
    }
  }

  // If in DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
  const dMatch = str.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (dMatch) {
    const part1 = dMatch[1];
    const part2 = dMatch[2].padStart(2, '0');
    const part3 = dMatch[3];

    // If part1 is year (e.g. 2024-12-05)
    if (part1.length === 4) {
      return `${part1}-${part2}-${part3.padStart(2, '0')}`;
    }
    // If part3 is year (e.g. 05/12/2024)
    if (part3.length === 4) {
      return `${part3}-${part2}-${part1.padStart(2, '0')}`;
    }
    // If part3 is length 2, e.g. "24" for 2024
    if (part3.length === 2) {
      const yStr = '20' + part3;
      return `${yStr}-${part2}-${part1.padStart(2, '0')}`;
    }
  }

  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }

  return '2025-01-01';
}

export function calculateKgbDates(nip: string, golongan: string): { kgbTerakhir: string, kgbYAD: string } {
  const mainNip = (nip || '').split('/')[0].trim();
  const cleanNip = mainNip.replace(/\D/g, '');
  if (cleanNip.length < 14) {
    return {
      kgbTerakhir: '2024-01-01',
      kgbYAD: '2026-01-01'
    };
  }
  
  const yearStr = cleanNip.substring(8, 12);
  const monthStr = cleanNip.substring(12, 14);
  
  let cpnsYear = parseInt(yearStr, 10);
  let cpnsMonth = parseInt(monthStr, 10);
  
  if (isNaN(cpnsYear) || isNaN(cpnsMonth) || cpnsMonth < 1 || cpnsMonth > 12) {
    return {
      kgbTerakhir: '2024-01-01',
      kgbYAD: '2026-01-01'
    };
  }
  
  // check if K (golongan) starts with '4' or 'IV' (case-insensitive)
  const g = (golongan || '').trim().toUpperCase();
  const isIV = g.startsWith('4') || g.startsWith('IV');
  
  const baseYear = cpnsYear + (isIV ? 1 : 0);
  
  // Increment by 2 years until we find the next KGB relative to June 2026
  let currentKgbYear = baseYear;
  const targetYear = 2026;
  
  while (currentKgbYear < targetYear) {
    currentKgbYear += 2;
  }
  
  const kgbYADYear = currentKgbYear;
  const kgbTerakhirYear = kgbYADYear - 2;
  
  const mm = monthStr.padStart(2, '0');
  
  return {
    kgbTerakhir: `${kgbTerakhirYear}-${mm}-01`,
    kgbYAD: `${kgbYADYear}-${mm}-01`
  };
}

export function parseExcelToEmployees(arrayBuffer: ArrayBuffer): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to 2D array coordinates
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      if (rows.length === 0) {
        resolve([]);
        return;
      }

      // Step 2: Detect header map
      let headerRowIndex = -1;
      let headerMap: { [key: string]: number } = {};

      // Look for a row that contains keyword Nama, NIP or Jabatan
      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r];
        if (Array.isArray(row)) {
          const hasNama = row.some(cell => String(cell).toLowerCase().includes('nama'));
          const hasNip = row.some(cell => String(cell).toLowerCase().includes('nip') || String(cell).toLowerCase().includes('nrp'));
          const hasJabatan = row.some(cell => String(cell).toLowerCase().includes('jabatan'));
          if (hasNama || hasNip || hasJabatan) {
            headerRowIndex = r;
            row.forEach((cell, idx) => {
              const cleaned = String(cell).toLowerCase().trim();
              if (cleaned === 'nama' || cleaned.includes('nama lengkap') || cleaned.includes('nama pegawai')) {
                headerMap['nama'] = idx;
              } else if ((cleaned.includes('jabatan') || cleaned === 'pekerjaan' || cleaned.includes('jab_')) && 
                         !cleaned.includes('tmt') && !cleaned.includes('lama') && !cleaned.includes('masa') && !cleaned.includes('mulai')) {
                headerMap['jabatan'] = idx;
              } else if (cleaned.includes('gol') || cleaned.includes('pangkat') || cleaned === 'gol/pangkat' || cleaned === 'golongan') {
                headerMap['gol_pangkat'] = idx;
              } else if (cleaned.includes('nip') || cleaned.includes('nrp') || cleaned === 'nip/nrp') {
                headerMap['nip_nrp'] = idx;
              } else if (cleaned.includes('eselon')) {
                headerMap['eselon'] = idx;
              } else if (cleaned.includes('satker') || cleaned.includes('satuan kerja') || cleaned.includes('satuan_kerja') || cleaned.includes('unit kerja') || cleaned.includes('unit_kerja')) {
                headerMap['satker'] = idx;
              } else if (cleaned === 'status' || (cleaned.includes('status') && !cleaned.includes('pegawai'))) {
                headerMap['status'] = idx;
              }
            });

            // Second pass specific for TMT Jabatan to avoid matching other TMT columns erroneously
            let bestTmtIdx = -1;
            row.forEach((cell, idx) => {
              const cleaned = String(cell).toLowerCase().trim();
              if (cleaned.includes('tmt jabatan') || cleaned.includes('tmt_jabatan') || cleaned.includes('tmt_jab') || cleaned.includes('tmt dlm jabatan') || cleaned.includes('tmt_jabatan')) {
                bestTmtIdx = idx;
              } else if (bestTmtIdx === -1 && (cleaned.includes('lama menjabat') || cleaned.includes('masa jabatan') || cleaned.includes('lama_menjabat') || cleaned.includes('lamanya menjabat'))) {
                bestTmtIdx = idx;
              } else if (bestTmtIdx === -1 && cleaned === 'tmt') {
                bestTmtIdx = idx;
              } else if (bestTmtIdx === -1 && cleaned.includes('tmt') && !cleaned.includes('cpns') && !cleaned.includes('pns') && !cleaned.includes('pangkat') && !cleaned.includes('golongan')) {
                bestTmtIdx = idx;
              }
            });

            if (bestTmtIdx !== -1) {
              headerMap['lama_menjabat'] = bestTmtIdx;
            } else {
              // Guess index 7 (Column H) if nothing was matched, but let's check if there is an index matching 'tmt'
              const anyTmt = row.findIndex(cell => String(cell).toLowerCase().includes('tmt'));
              headerMap['lama_menjabat'] = anyTmt !== -1 ? anyTmt : 7;
            }
            break;
          }
        }
      }

      // Default mappings if headers cannot be resolved
      if (headerRowIndex === -1) {
        // Fallback to standard columns based on standard Kejaksaan spreadsheet design (0: No, 1: Nama, 2: Jabatan, 3: Gol/Pangkat, 4: NIP/NRP, 5: Eselon, 6: Satker, 7: Lama Menjabat, 8: Status)
        headerRowIndex = 0; // Guessing row 0 is header
        headerMap = {
          nama: 1,
          gol_pangkat: 2,
          jabatan: 3,
          eselon: 4,
          satker: 5,
          lama_menjabat: 7, // Column H (index 7)
          status: 8
        };
      }

      // If headers are partially resolved, map unassigned keys to indices
      if (headerMap['nama'] === undefined) headerMap['nama'] = 1;
      if (headerMap['gol_pangkat'] === undefined) headerMap['gol_pangkat'] = 2; // Column C index 2
      if (headerMap['jabatan'] === undefined) headerMap['jabatan'] = 3;     // Column D index 3
      if (headerMap['nip_nrp'] === undefined) headerMap['nip_nrp'] = 4;
      if (headerMap['eselon'] === undefined) headerMap['eselon'] = 4;
      if (headerMap['satker'] === undefined) headerMap['satker'] = 5;
      if (headerMap['lama_menjabat'] === undefined) headerMap['lama_menjabat'] = 7; // Column H (index 7)
      if (headerMap['status'] === undefined) headerMap['status'] = 8;

      const parsedEmployees: Employee[] = [];

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        // Extract key pieces
        const rawNama = row[headerMap['nama']] ? String(row[headerMap['nama']]).trim() : '';
        // Skip header lines or instruction notes that lack a proper Name
        if (!rawNama || rawNama.toLowerCase() === 'null' || rawNama === '-' || rawNama.toLowerCase() === 'nama') continue;

        const rawJabatan = row[headerMap['jabatan']] ? String(row[headerMap['jabatan']]).trim() : '';
        const rawGolPangkat = row[headerMap['gol_pangkat']] ? String(row[headerMap['gol_pangkat']]).trim() : '';
        let rawNipNrp = row[headerMap['nip_nrp']] ? String(row[headerMap['nip_nrp']]).trim() : '';
        
        // Clean NIP from leading quote
        if (rawNipNrp.startsWith("'")) {
          rawNipNrp = rawNipNrp.substring(1);
        }

        const rawEselon = row[headerMap['eselon']] ? String(row[headerMap['eselon']]).trim() : '-';
        const rawSatker = row[headerMap['satker']] ? String(row[headerMap['satker']]).trim() : 'KEJAKSAAN TINGGI LAMPUNG';
        const rawLamaMenjabatCell = row[headerMap['lama_menjabat']];
        const rawLamaMenjabat = rawLamaMenjabatCell ? String(rawLamaMenjabatCell).trim() : '';
        const rawStatus = row[headerMap['status']] ? String(row[headerMap['status']]).trim() : 'Aktif';

        // Split pangkat & golongan using refined regex matcher
        const { golongan, pangkat } = parseGolonganAndPangkat(rawGolPangkat);

        // Keep raw status pegawai to match Excel Column I
        const statusPegawaiVal = rawStatus || 'PNS';

        // Column D is index 3 (0-indexed: 0=A, 1=B, 2=C, 3=D)
        const rawColD = row[3] !== undefined ? String(row[3]).trim() : '';
        const isJaksa = rawColD.toLowerCase().includes('jaksa');
        const statusJaksa = isJaksa ? 'Jaksa' : '-';

        // Extract birth info from NIP if possible
        let tanggalLahir = '1980-01-01';
        let gender: 'L' | 'P' = 'L';
        const mainNipForBirth = rawNipNrp.split('/')[0].trim();
        const nipDigits = mainNipForBirth.replace(/\D/g, '');
        if (nipDigits.length >= 15) {
          const birthStr = nipDigits.substring(0, 8); // YYYYMMDD
          const year = birthStr.substring(0, 4);
          const month = birthStr.substring(4, 6);
          const day = birthStr.substring(6, 8);
          
          const yNum = Number(year);
          const mNum = Number(month);
          const dNum = Number(day);
          if (yNum > 1940 && yNum < 2015 && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
            tanggalLahir = `${year}-${month}-${day}`;
          }

          // 15th digit represents gender (1 = Male, 2 = Female in standard civil service NIP)
          const genderDigit = nipDigits.charAt(14);
          if (genderDigit === '2') {
            gender = 'P';
          }
        } else {
          // Alternative gender guess from female Indonesian names keywords
          const femaleKeywords = ['sri', 'siti', 'ayu', 'dewi', 'ika', 'erawati', 'virginia', 'putri', 'rara', 'fitria', 'indri', 'p'];
          const lowName = rawNama.toLowerCase();
          if (femaleKeywords.some(kw => lowName.includes(kw))) {
            gender = 'P';
          }
        }

        const cleanEmail = rawNama.split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '.') + '@kejaksaan.go.id';

        // Parse/clean TMT Jabatan using robust parser
        const parsedTmtJabatan = parseTmtJabatanDate(rawLamaMenjabatCell);

        const newEmp: Employee = {
          id: `uploaded-emp-${r}-${Date.now()}`,
          nip: rawNipNrp,
          nama: rawNama,
          gender,
          tempatLahir: 'Bandar Lampung',
          tanggalLahir,
          pangkat,
          golongan,
          jabatan: rawJabatan,
          tmtJabatan: parsedTmtJabatan,
          unitKerja: rawSatker,
          agama: 'Islam',
          statusPegawai: statusPegawaiVal,
          statusJaksa,
          email: cleanEmail,
          telepon: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
          alamat: `Jl. Kejaksaan, ${rawSatker.toLowerCase()}`,
          kgbTerakhir: '',
          kgbYAD: '',
          pangkatTerakhir: '2021-04-01',
          pangkatYAD: '2025-04-01',
          pensiunTMT: '2035-12-31',
          foto: gender === 'L' 
            ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' 
            : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          eselon: rawEselon,
          satker: rawSatker,
          lamaMenjabat: rawLamaMenjabat,
          riwayatPangkat: [],
          riwayatJabatan: [],
          riwayatKgb: [],
          riwayatPendidikan: [],
          dokumen: []
        };

        const enrichedEmp = enrichEmployeeKgb(newEmp);
        enrichedEmp.riwayatKgb = [
          {
            id: `rk-up-${r}-1`,
            gajiPokok: 0, // Gaji pokok is 0 now as it's not visible
            tmt: enrichedEmp.kgbTerakhir,
            nomorSk: 'DITETAPKAN-SISTEM-KGB',
            tanggalSk: enrichedEmp.kgbTerakhir,
            oleh: 'Kepala Satuan Kerja'
          }
        ];

        parsedEmployees.push(enrichedEmp);
      }

      resolve(parsedEmployees);
    } catch (err) {
      reject(err);
    }
  });
}
