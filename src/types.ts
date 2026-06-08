/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  gender: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  pangkat: string;       // e.g. Pembina
  golongan: string;      // e.g. IV/a
  jabatan: string;       // e.g. Kepala Dinas
  tmtJabatan: string;    // YYYY-MM-DD
  unitKerja: string;     // e.g. Dinas Komunikasi dan Informatika
  agama: string;
  statusPegawai: string;
  statusJaksa?: string;
  email: string;
  telepon: string;
  alamat: string;
  kgbTerakhir: string;   // YYYY-MM-DD
  kgbYAD: string;        // YYYY-MM-DD (Yang Akan Datang - Next KGB)
  pangkatTerakhir: string; // YYYY-MM-DD
  pangkatYAD: string;     // YYYY-MM-DD (Next rank upgrade)
  pensiunTMT: string;    // YYYY-MM-DD
  foto: string;          // Avatar URL or Base64
  eselon?: string;       // Optional e.g. II/a
  satker?: string;       // Optional e.g. KEJAKSAAN TINGGI LAMPUNG
  lamaMenjabat?: string; // Optional e.g. 1 thn 1 bln 19 hari
  golonganAwal?: 'II/a' | 'II/c' | 'III/a';
  tmtCpns?: string;
  kgbPertama?: string;
  statusKgb?: 'Belum Jatuh Tempo' | 'Jatuh Tempo Bulan Ini' | 'Jatuh Tempo Tahun Ini' | 'Terlambat Diproses';
  riwayatPangkat: HistoryRank[];
  riwayatJabatan: HistoryPosition[];
  riwayatKgb: HistoryKgb[];
  riwayatPendidikan: HistoryEducation[];
  dokumen: EmployeeDocument[];
}

export interface HistoryRank {
  id: string;
  golongan: string;
  pangkat: string;
  tmt: string;
  nomorSk: string;
  tanggalSk: string;
}

export interface HistoryPosition {
  id: string;
  jabatan: string;
  unitKerja: string;
  tmt: string;
  nomorSk: string;
  tanggalSk: string;
}

export interface HistoryKgb {
  id: string;
  gajiPokok: number; // in IDR
  tmt: string;
  nomorSk: string;
  tanggalSk: string;
  oleh: string;
}

export interface HistoryEducation {
  id: string;
  tingkat: string; // e.g. S1, S2
  jurusan: string;
  institusi: string;
  tahunLulus: number;
  nomorIjazah: string;
}

export interface EmployeeDocument {
  id: string;
  nama: string;      // e.g. "SK CPNS"
  fileType: 'PDF' | 'DOCX' | 'JPG';
  tanggalUpload: string;
  fileSize: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalPegawai: number;
  kgbMendatang: number;     // within 30 days
  pangkatMendatang: number;   // within 60 days
  pegawaiPensiun: number;     // retired/retiring this year
  ulangTahunBulanIni: number;
}
