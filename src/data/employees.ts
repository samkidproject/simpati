/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, HistoryRank, HistoryPosition, HistoryKgb, HistoryEducation, EmployeeDocument } from '../types';

// Standard Indonesian PNS/ASN Ranks & Golongan
export const GOLONGAN_LIST = [
  { golongan: 'I/a', pangkat: 'Juru Muda' },
  { golongan: 'I/b', pangkat: 'Juru Muda Tingkat I' },
  { golongan: 'I/c', pangkat: 'Juru' },
  { golongan: 'I/d', pangkat: 'Juru Tingkat I' },
  { golongan: 'II/a', pangkat: 'Pengatur Muda' },
  { golongan: 'II/b', pangkat: 'Pengatur Muda Tingkat I' },
  { golongan: 'II/c', pangkat: 'Pengatur' },
  { golongan: 'II/d', pangkat: 'Pengatur Tingkat I' },
  { golongan: 'III/a', pangkat: 'Penata Muda' },
  { golongan: 'III/b', pangkat: 'Penata Muda Tingkat I' },
  { golongan: 'III/c', pangkat: 'Penata' },
  { golongan: 'III/d', pangkat: 'Penata Tingkat I' },
  { golongan: 'IV/a', pangkat: 'Pembina' },
  { golongan: 'IV/b', pangkat: 'Pembina Tingkat I' },
  { golongan: 'IV/c', pangkat: 'Pembina Utama Muda' },
  { golongan: 'IV/d', pangkat: 'Pembina Utama Madya' },
  { golongan: 'IV/e', pangkat: 'Pembina Utama' }
];

export const JABATAN_LIST = [
  'Kepala Dinas',
  'Sekretaris Dinas',
  'Kepala Bidang Layanan E-Government',
  'Kepala Bidang Humas dan Informasi',
  'Kepala Seksi Keamanan Informasi',
  'Pranata Komputer Ahli Muda',
  'Pranata Komputer Ahli Pertama',
  'Analis Kepegawaian Ahli Madya',
  'Analis Kebijakan Ahli Muda',
  'Pranata Hubungan Masyarakat Ahli Pertama',
  'Arsiparis Ahli Pertama',
  'Pengelola Pengadaan Barang/Jasa',
  'Verifikator Keuangan',
  'Analis Perencana',
  'Admin Jaringan Komputer'
];

export const UNIT_KERJA_LIST = [
  'Dinas Komunikasi, Informatika, dan Statistik',
  'Badan Kepegawaian Daerah (BKD)',
  'Dinas Pendidikan dan Kebudayaan',
  'Dunas Kesehatan',
  'Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD)',
  'Badan Perencanaan Pembangunan Daerah (BAPPEDA)',
  'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
  'Dinas Perhubungan',
  'Dinas Lingkungan Hidup',
  'Sekretariat Daerah (SETDA)'
];

const INDONESIAN_NAMES_MALE = [
  'Ahmad Fauzi', 'Budi Santoso', 'Dedi Prasetyo', 'Hendra Wijaya', 'Irfan Hakim',
  'Joko Susilo', 'Kartiko Wibowo', 'Lukman Hakim', 'Mulyono', 'Nugroho',
  'Oki Setiawan', 'Prabowo Subianto', 'Rian Hidayat', 'Slamet Riyadi', 'Taufik Hidayat',
  'Umar Syarif', 'Wawan Hermawan', 'Yusuf Mansur', 'Zulkifli Hasan', 'Andi Wijaya',
  'Bambang Pamungkas', 'Chandra Kirana', 'Doni Monardo', 'Eko Putro', 'Fajar Nugraha',
  'Giri Suprapriyatno', 'Hadi Tjahjanto', 'Indra Herlambang', 'Jerry Yan', 'Kusuma Wardana'
];

const INDONESIAN_NAMES_FEMALE = [
  'Sri Wahyuni', 'Siti Aminah', 'Rina Astuti', 'Dewi Lestari', 'Eka Kartika',
  'Fitriani', 'Gita Gutawa', 'Hesti Purwadinata', 'Ika Pertiwi', 'Julia Perez',
  'Kartini', 'Larasati', 'Megawati', 'Novianti', 'Olivia Zalianty',
  'Puspita Sari', 'Rini Soemarno', 'Susi Pudjiastuti', 'Tri Rismaharini', 'Utami',
  'Vina Panduwinata', 'Wulan Guritno', 'Yuni Shara', 'Zaskia Adya Mecca', 'Ade Irma',
  'Bella Saphira', 'Cut Nyak Dien', 'Dian Sastrowardoyo', 'Elvy Sukaesih', 'Farida Pasha'
];

const PLACES = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Medan', 'Makassar', 'Yogyakarta', 'Palembang', 'Denpasar', 'Ambon', 'Bandar Lampung'];

// Helper to generate a realistic NIP
export function generateNIP(birthDateStr: string, joinYear: number, joinMonth: number, genderInt: number, seq: number): string {
  // birthdate: YYYYMMDD
  const birthPart = birthDateStr.replace(/-/g, '');
  const joinPart = `${joinYear}${joinMonth.toString().padStart(2, '0')}`;
  const genderPart = genderInt.toString();
  const seqPart = seq.toString().padStart(3, '0');
  return `${birthPart}${joinPart}${genderPart}${seqPart}`;
}

// Full set of high fidelity primary profiles
export const PRIMARY_EMPLOYEES: Employee[] = [
  {
    id: 'emp-excel-1',
    nip: '197612092001121002',
    nama: 'DANANG SURYOWIDODO, S.H., LL.M.',
    gender: 'L',
    tempatLahir: 'Bandar Lampung',
    tanggalLahir: '1976-12-09',
    pangkat: 'Jaksa Utama Madya',
    golongan: 'IV/d',
    jabatan: 'Kepala Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-04-15',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'danang.suryowidodo@kejaksaan.go.id',
    telepon: '081234567001',
    alamat: 'Jl. Hasanuddin No. 1, Bandar Lampung',
    kgbTerakhir: '2024-12-09',
    kgbYAD: '2026-12-09',
    pangkatTerakhir: '2021-12-01',
    pangkatYAD: '2025-12-01',
    pensiunTMT: '2036-12-09',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    eselon: 'II/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '1 thn 1 bln 19 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-2',
    nip: '197809111998031005',
    nama: 'TEUKU RAHMATSYAH, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Medan',
    tanggalLahir: '1978-09-11',
    pangkat: 'Jaksa Utama Muda',
    golongan: 'IV/c',
    jabatan: 'Wakil Kepala Kejaksaan Tinggi Lampung',
    tmtJabatan: '2026-04-15',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'teuku.rahmatsyah@kejaksaan.go.id',
    telepon: '081234567002',
    alamat: 'Jl. Raden Intan No. 2, Bandar Lampung',
    kgbTerakhir: '2024-09-11',
    kgbYAD: '2026-09-11',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2038-09-11',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    eselon: 'II/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 1 bln 20 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-3',
    nip: '196808051998031001',
    nama: 'AGUS WIDODO, S.H.',
    gender: 'L',
    tempatLahir: 'Semarang',
    tanggalLahir: '1968-08-05',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Bidang Pengawasan pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2024-06-07',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'agus.widodo@kejaksaan.go.id',
    telepon: '081234567003',
    alamat: 'Jl. Ahmad Yani No. 5, Bandar Lampung',
    kgbTerakhir: '2024-08-05',
    kgbYAD: '2026-08-05',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2028-08-05',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '1 thn 11 bln 28 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-4',
    nip: '196903151998031002',
    nama: 'IMAM SUTOPO, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Surabaya',
    tanggalLahir: '1969-03-15',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Pemulihan Aset pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-10-15',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'imam.sutopo@kejaksaan.go.id',
    telepon: '081234567004',
    alamat: 'Jl. Sudirman No. 12, Bandar Lampung',
    kgbTerakhir: '2024-03-15',
    kgbYAD: '2026-03-15',
    pangkatTerakhir: '2021-10-01',
    pangkatYAD: '2025-10-01',
    pensiunTMT: '2029-03-15',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 7 bln 20 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-5',
    nip: '197808152003122002',
    nama: 'VIRGINIA HARIZTAVIANNE, S.H., B.Pas., M.H., M.H.',
    gender: 'P',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1978-08-15',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Pembinaan pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-07-10',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Kristen Protestan',
    statusPegawai: 'PNS',
    email: 'virginia.hariztavianne@kejaksaan.go.id',
    telepon: '081234567005',
    alamat: 'Komp. Kejaksaan Indah No. 15, Bandar Lampung',
    kgbTerakhir: '2024-08-15',
    kgbYAD: '2026-08-15',
    pangkatTerakhir: '2023-04-01',
    pangkatYAD: '2027-04-01',
    pensiunTMT: '2038-08-15',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 10 bln 25 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-6',
    nip: '197012011998031002',
    nama: 'DAHARUDDIN M, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Bandar Lampung',
    tanggalLahir: '1970-12-01',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Kepala Kejaksaan Negeri Bandar Lampung',
    tmtJabatan: '2025-07-10',
    unitKerja: 'KEJAKSAAN NEGERI BANDAR LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'daharuddin.m@kejaksaan.go.id',
    telepon: '081234567006',
    alamat: 'Jl. ZA Pagar Alam No. 12, Bandar Lampung',
    kgbTerakhir: '2024-12-01',
    kgbYAD: '2026-12-01',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2030-12-01',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN NEGERI BANDAR LAMPUNG',
    lamaMenjabat: '0 thn 10 bln 25 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-7',
    nip: '197207052000031007',
    nama: 'BUDI NUGRAHA, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Bandung',
    tanggalLahir: '1972-07-05',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Tindak Pidana Khusus pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-12-01',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'budi.nugraha@kejaksaan.go.id',
    telepon: '081234567007',
    alamat: 'Jl. Sukarno Hatta No. 80, Bandar Lampung',
    kgbTerakhir: '2024-07-05',
    kgbYAD: '2026-07-05',
    pangkatTerakhir: '2023-04-01',
    pangkatYAD: '2027-04-01',
    pensiunTMT: '2032-07-05',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 5 bln 3 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-8',
    nip: '197307211999032001',
    nama: 'ERAWATI, S.H., M.H.',
    gender: 'P',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1973-07-21',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Perdata dan Tata Usaha Negara pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-10-07',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'erawati@kejaksaan.go.id',
    telepon: '081234567008',
    alamat: 'Jl. Dr. Susilo No. 19, Bandar Lampung',
    kgbTerakhir: '2024-07-21',
    kgbYAD: '2026-07-21',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2033-07-21',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 7 bln 28 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-9',
    nip: '197510272005011005',
    nama: 'Dr. ANDY SASONGKO, S.H., M.Hum.',
    gender: 'L',
    tempatLahir: 'Palembang',
    tanggalLahir: '1975-10-27',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Asisten Intelijen pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-11-14',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'andy.sasongko@kejaksaan.go.id',
    telepon: '081234567009',
    alamat: 'Jl. RA Kartini No. 4, Bandar Lampung',
    kgbTerakhir: '2024-10-27',
    kgbYAD: '2026-10-27',
    pangkatTerakhir: '2023-04-01',
    pangkatYAD: '2027-04-01',
    pensiunTMT: '2035-10-27',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 4 bln 21 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-10',
    nip: '197512262005011005',
    nama: 'Dr. ANTON RUDIYANT0, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Solo',
    tanggalLahir: '1975-12-26',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/a',
    jabatan: 'Asisten Tindak Pidana Umum pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2026-03-07',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'anton.rudiyanto@kejaksaan.go.id',
    telepon: '081234567010',
    alamat: 'Jl. Teuku Umar No. 22, Bandar Lampung',
    kgbTerakhir: '2024-12-26',
    kgbYAD: '2026-12-26',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2035-12-26',
    foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 2 bln 28 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-11',
    nip: '197908212005121007',
    nama: 'RODY ARFAN, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Metro',
    tanggalLahir: '1979-08-21',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'SEKRETARIS PADA INSPEKTORAT KABUPATEN PESISIR BARAT PADA PEMERINTAH KABUPATEN PESISIR BARAT',
    tmtJabatan: '2024-06-19',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'rody.arfan@kejaksaan.go.id',
    telepon: '081234567011',
    alamat: 'Komp. Pemda Pesisir Barat No. 8, Krui',
    kgbTerakhir: '2024-08-21',
    kgbYAD: '2026-08-21',
    pangkatTerakhir: '2021-04-01',
    pangkatYAD: '2025-04-01',
    pensiunTMT: '2039-08-21',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    eselon: 'III/a',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '1 thn 11 bln 15 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-12',
    nip: '198005242005121001',
    nama: 'RULLY HASRULLOH, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Bandar Lampung',
    tanggalLahir: '1980-05-24',
    pangkat: 'Jaksa Madya',
    golongan: 'III/d',
    jabatan: 'KEPALA BAGIAN HUKUM PADA PEMERINTAH KABUPATEN PESISIR BARAT',
    tmtJabatan: '2025-12-10',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'rully.hasrulloh@kejaksaan.go.id',
    telepon: '081234567012',
    alamat: 'Jl. Kartini No. 45, Krui',
    kgbTerakhir: '2024-05-24',
    kgbYAD: '2026-05-24',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2040-05-24',
    foto: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 5 bln 25 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-13',
    nip: '196905051996031003',
    nama: 'DIDIK SUDARMADI, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Menggala',
    tanggalLahir: '1969-05-05',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'Kepala Kejaksaan Negeri Tulang Bawang Barat',
    tmtJabatan: '2025-12-13',
    unitKerja: 'KEJAKSAAN NEGERI TULANG BAWANG BARAT',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'didik.sudarmadi@kejaksaan.go.id',
    telepon: '081234567013',
    alamat: 'Jl. Raya Panaragan Jaya, Tulang Bawang Barat',
    kgbTerakhir: '2024-05-05',
    kgbYAD: '2026-05-05',
    pangkatTerakhir: '2021-04-01',
    pangkatYAD: '2025-04-01',
    pensiunTMT: '2029-05-05',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN NEGERI TULANG BAWANG BARAT',
    lamaMenjabat: '0 thn 5 bln 22 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-14',
    nip: '196910221994031001',
    nama: 'SAPTONO, S.H.',
    gender: 'L',
    tempatLahir: 'Lampung Timur',
    tanggalLahir: '1969-10-22',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'Kepala Kejaksaan Negeri Lampung Timur',
    tmtJabatan: '2026-04-05',
    unitKerja: 'KEJAKSAAN NEGERI LAMPUNG TIMUR',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'saptono@kejaksaan.go.id',
    telepon: '081234567014',
    alamat: 'Jl. Ki Hajar Dewantara, Sukadana, Lampung Timur',
    kgbTerakhir: '2024-10-22',
    kgbYAD: '2026-10-22',
    pangkatTerakhir: '2021-10-01',
    pangkatYAD: '2025-10-01',
    pensiunTMT: '2029-10-22',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN NEGERI LAMPUNG TIMUR',
    lamaMenjabat: '0 thn 1 bln 28 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-15',
    nip: '197005111995031001',
    nama: 'MAHMUDIN, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Blambangan Umpu',
    tanggalLahir: '1970-05-11',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'Kepala Kejaksaan Negeri Way Kanan',
    tmtJabatan: '2025-07-15',
    unitKerja: 'KEJAKSAAN NEGERI WAY KANAN',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'mahmudin@kejaksaan.go.id',
    telepon: '081234567015',
    alamat: 'Jl. Jenderal Sudirman, Blambangan Umpu, Way Kanan',
    kgbTerakhir: '2024-05-11',
    kgbYAD: '2026-05-11',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2030-05-11',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN NEGERI WAY KANAN',
    lamaMenjabat: '0 thn 10 bln 20 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-16',
    nip: '197512051998031002',
    nama: 'SUHADI KURNIAWAN, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Kota Agung',
    tanggalLahir: '1975-12-05',
    pangkat: 'Jaksa Utama Pratama',
    golongan: 'IV/b',
    jabatan: 'Kepala Kejaksaan Negeri Tanggamus',
    tmtJabatan: '2025-10-07',
    unitKerja: 'KEJAKSAAN NEGERI TANGGAMUS',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'suhadi.k@kejaksaan.go.id',
    telepon: '081234567016',
    alamat: 'Jl. Jenderal Ahmad Yani, Kota Agung, Tanggamus',
    kgbTerakhir: '2024-12-05',
    kgbYAD: '2026-12-05',
    pangkatTerakhir: '2023-04-01',
    pangkatYAD: '2027-04-01',
    pensiunTMT: '2035-12-05',
    foto: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN NEGERI TANGGAMUS',
    lamaMenjabat: '0 thn 7 bln 28 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-17',
    nip: '197405311999031002',
    nama: 'HARTAWAN, S.H.',
    gender: 'L',
    tempatLahir: 'Lampung',
    tanggalLahir: '1974-05-31',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'Koordinator pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-09-08',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'hartawan@kejaksaan.go.id',
    telepon: '081234567017',
    alamat: 'Jl. WR Supratman, Bandar Lampung',
    kgbTerakhir: '2024-05-31',
    kgbYAD: '2026-05-31',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2034-05-31',
    foto: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 8 bln 27 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-excel-18',
    nip: '197501141999031001',
    nama: 'ASEP SUHARSA, S.H., M.H.',
    gender: 'L',
    tempatLahir: 'Bandung',
    tanggalLahir: '1975-01-14',
    pangkat: 'Jaksa Madya',
    golongan: 'IV/a',
    jabatan: 'Koordinator pada Kejaksaan Tinggi Lampung',
    tmtJabatan: '2025-07-10',
    unitKerja: 'KEJAKSAAN TINGGI LAMPUNG',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'asep.suharsa@kejaksaan.go.id',
    telepon: '081234567018',
    alamat: 'Jl. Sultan Agung, Bandar Lampung',
    kgbTerakhir: '2024-01-14',
    kgbYAD: '2026-01-14',
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01',
    pensiunTMT: '2035-01-14',
    foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    eselon: 'III/b',
    satker: 'KEJAKSAAN TINGGI LAMPUNG',
    lamaMenjabat: '0 thn 10 bln 25 hari',
    riwayatPangkat: [],
    riwayatJabatan: [],
    riwayatKgb: [],
    riwayatPendidikan: [],
    dokumen: []
  },
  {
    id: 'emp-1',
    nip: '197508122001031002',
    nama: 'Drs. Ahmad Fauzi, M.Si.',
    gender: 'L',
    tempatLahir: 'Bandung',
    tanggalLahir: '1975-08-12',
    pangkat: 'Pembina Tingkat I',
    golongan: 'IV/b',
    jabatan: 'Kepala Dinas',
    tmtJabatan: '2021-02-15',
    unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'ahmad.fauzi@pns.go.id',
    telepon: '081234567890',
    alamat: 'Jl. Merdeka No. 45, Bandung',
    kgbTerakhir: '2024-05-10',
    kgbYAD: '2026-05-10', // KGB coming up in ~11 months (from June 2026, actually the prompt current localized date is 2026-06-04, so this is coming up in about 23 months or let's place some exactly in the 30-day window to trigger notifications)
    pangkatTerakhir: '2022-04-01',
    pangkatYAD: '2026-04-01', // Already passed or upcoming. Let's make an upcoming pangkat update within 60 days of 2026-06-04, like 2026-07-15!
    pensiunTMT: '2033-08-01',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    riwayatPangkat: [
      { id: 'rp-1', golongan: 'III/a', pangkat: 'Penata Muda', tmt: '2001-03-01', nomorSk: '821.2/025/2001', tanggalSk: '2001-02-20' },
      { id: 'rp-2', golongan: 'III/b', pangkat: 'Penata Muda Tingkat I', tmt: '2005-04-01', nomorSk: '821.2/142/2005', tanggalSk: '2005-03-15' },
      { id: 'rp-3', golongan: 'III/c', pangkat: 'Penata', tmt: '2009-04-01', nomorSk: '821.2/210/2009', tanggalSk: '2009-03-22' },
      { id: 'rp-4', golongan: 'III/d', pangkat: 'Penata Tingkat I', tmt: '2013-04-01', nomorSk: '821.2/088/2013', tanggalSk: '2013-03-10' },
      { id: 'rp-5', golongan: 'IV/a', pangkat: 'Pembina', tmt: '2017-04-01', nomorSk: '821.2/155/2017', tanggalSk: '2017-03-18' },
      { id: 'rp-6', golongan: 'IV/b', pangkat: 'Pembina Tingkat I', tmt: '2022-04-01', nomorSk: '821.2/312/2022', tanggalSk: '2022-03-24' }
    ],
    riwayatJabatan: [
      { id: 'rj-1', jabatan: 'Staf Humas', unitKerja: 'Dinas Penerangan', tmt: '2001-04-01', nomorSk: '821.3/009/2001', tanggalSk: '2001-03-25' },
      { id: 'rj-2', jabatan: 'Kepala Seksi Publikasi', unitKerja: 'Dinas Komunikasi', tmt: '2009-10-01', nomorSk: '821.3/218/2009', tanggalSk: '2009-09-15' },
      { id: 'rj-3', jabatan: 'Kepala Bidang Humas', unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik', tmt: '2016-01-10', nomorSk: '821.3/011/2016', tanggalSk: '2016-01-02' },
      { id: 'rj-4', jabatan: 'Kepala Dinas', unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik', tmt: '2021-02-15', nomorSk: '821.3/102/2021', tanggalSk: '2021-02-10' }
    ],
    riwayatKgb: [
      { id: 'rk-1', gajiPokok: 4200000, tmt: '2020-05-10', nomorSk: '900/PND-782/2020', tanggalSk: '2020-04-28', oleh: 'Kepala BKD' },
      { id: 'rk-2', gajiPokok: 4500000, tmt: '2022-05-10', nomorSk: '900/PND-241/2022', tanggalSk: '2022-04-20', oleh: 'Kepala BKD' },
      { id: 'rk-3', gajiPokok: 4900000, tmt: '2024-05-10', nomorSk: '900/PND-105/2024', tanggalSk: '2024-04-15', oleh: 'Kepala BKD' }
    ],
    riwayatPendidikan: [
      { id: 'rpd-1', tingkat: 'S1', jurusan: 'Ilmu Komunikasi', institusi: 'Universitas Padjadjaran', tahunLulus: 1998, nomorIjazah: 'UNPAD-1998-20412' },
      { id: 'rpd-2', tingkat: 'S2', jurusan: 'Administrasi Publik', institusi: 'Universitas Indonesia', tahunLulus: 2007, nomorIjazah: 'UI-2007-00921' }
    ],
    dokumen: [
      { id: 'doc-1-1', nama: 'SK CPNS Ahmad Fauzi', fileType: 'PDF', tanggalUpload: '2021-05-10', fileSize: '1.2 MB' },
      { id: 'doc-1-2', nama: 'SK Kenaikan Pangkat IV/b', fileType: 'PDF', tanggalUpload: '2022-04-10', fileSize: '980 KB' },
      { id: 'doc-1-3', nama: 'Ijazah S2 UI', fileType: 'JPG', tanggalUpload: '2021-05-12', fileSize: '2.4 MB' },
      { id: 'doc-1-4', nama: 'SK Pelantikan Kepala Dinas', fileType: 'PDF', tanggalUpload: '2021-02-20', fileSize: '1.5 MB' }
    ]
  },
  {
    id: 'emp-2',
    nip: '198204152008012011',
    nama: 'Sri Wahyuni, S.Kom., M.T.',
    gender: 'P',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1982-04-15',
    pangkat: 'Penata',
    golongan: 'III/c',
    jabatan: 'Pranata Komputer Ahli Muda',
    tmtJabatan: '2020-08-01',
    unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'sri.wahyuni@pns.go.id',
    telepon: '081298765432',
    alamat: 'Komp. Kepegawaian Blok B/12, Bandung',
    kgbTerakhir: '2024-06-15', // Let's trigger a KGB within 30 days! Current is 2026-06-04, so KGB YAD on 2026-06-15 is ~11 days away!
    kgbYAD: '2026-06-15',   // 11 days away! PERFECT matching "KGB atas nama Sri Wahyuni akan jatuh tempo dalam 11 hari"
    pangkatTerakhir: '2022-10-01',
    pangkatYAD: '2026-10-01',
    pensiunTMT: '2040-04-15',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    riwayatPangkat: [
      { id: 'rp-21', golongan: 'III/a', pangkat: 'Penata Muda', tmt: '2008-01-01', nomorSk: '821.2/011/2008', tanggalSk: '2007-12-10' },
      { id: 'rp-22', golongan: 'III/b', pangkat: 'Penata Muda Tingkat I', tmt: '2012-10-01', nomorSk: '821.2/189/2012', tanggalSk: '2012-09-05' },
      { id: 'rp-23', golongan: 'III/c', pangkat: 'Penata', tmt: '2018-10-01', nomorSk: '821.2/245/2018', tanggalSk: '2018-09-12' }
    ],
    riwayatJabatan: [
      { id: 'rj-21', jabatan: 'Staf Jaringan', unitKerja: 'Badan Pengelola IT', tmt: '2008-02-10', nomorSk: 'SK-12/IT/2008', tanggalSk: '2008-02-01' },
      { id: 'rj-22', jabatan: 'Pranata Komputer Ahli Pertama', unitKerja: 'Dinas Komunikasi', tmt: '2014-05-12', nomorSk: 'SK-44/INF/2014', tanggalSk: '2014-04-20' },
      { id: 'rj-23', jabatan: 'Pranata Komputer Ahli Muda', unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik', tmt: '2020-08-01', nomorSk: '821.3/515/2020', tanggalSk: '2020-07-25' }
    ],
    riwayatKgb: [
      { id: 'rk-21', gajiPokok: 3500000, tmt: '2020-06-15', nomorSk: '900/PND-340/2020', tanggalSk: '2020-06-02', oleh: 'Kepala BKD' },
      { id: 'rk-22', gajiPokok: 3800000, tmt: '2022-06-15', nomorSk: '900/PND-112/2022', tanggalSk: '2022-05-25', oleh: 'Kepala BKD' },
      { id: 'rk-23', gajiPokok: 4100000, tmt: '2024-06-15', nomorSk: '900/PND-781/2024', tanggalSk: '2024-05-28', oleh: 'Kepala BKD' }
    ],
    riwayatPendidikan: [
      { id: 'rpd-21', tingkat: 'S1', jurusan: 'Teknik Informatika', institusi: 'Institut Teknologi Bandung', tahunLulus: 2004, nomorIjazah: 'ITB-2004-9981' },
      { id: 'rpd-22', tingkat: 'S2', jurusan: 'Sistem Informasi', institusi: 'Institut Teknologi Sepuluh Nopember', tahunLulus: 2012, nomorIjazah: 'ITS-2012-0012' }
    ],
    dokumen: [
      { id: 'doc-2-1', nama: 'SK PNS Sri Wahyuni', fileType: 'PDF', tanggalUpload: '2010-02-15', fileSize: '1.4 MB' },
      { id: 'doc-2-2', nama: 'SK KP III/c', fileType: 'PDF', tanggalUpload: '2018-10-15', fileSize: '1.1 MB' },
      { id: 'doc-2-3', nama: 'Ijazah S2 ITS', fileType: 'JPG', tanggalUpload: '2013-05-12', fileSize: '2.8 MB' }
    ]
  },
  {
    id: 'emp-3',
    nip: '196809051994031001',
    nama: 'Ir. Budi Santoso, M.M.',
    gender: 'L',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1968-09-05',
    pangkat: 'Pembina Utama Muda',
    golongan: 'IV/c',
    jabatan: 'Pranata Komputer Ahli Madya',
    tmtJabatan: '2018-01-10',
    unitKerja: 'Badan Kepegawaian Daerah (BKD)',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'budi.santoso@pns.go.id',
    telepon: '081344556677',
    alamat: 'Perum Gamping Mas No. 56, Yogyakarta',
    kgbTerakhir: '2025-02-01',
    kgbYAD: '2027-02-01',
    pangkatTerakhir: '2022-07-15',
    pangkatYAD: '2026-07-15', // 41 days away! PERFECT for Kenaikan Pangkat within 60 days notification!
    pensiunTMT: '2026-09-30', // Retires this year! DOB 1968-09-05 + 58 years = Sep 2026. Perfect matching Pensiun/Retirement!
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    riwayatPangkat: [
      { id: 'rp-31', golongan: 'III/a', pangkat: 'Penata Muda', tmt: '1994-03-01', nomorSk: '821.2/015/1994', tanggalSk: '1994-02-12' },
      { id: 'rp-32', golongan: 'IV/a', pangkat: 'Pembina', tmt: '2010-04-01', nomorSk: '821.2/115/2010', tanggalSk: '2010-03-22' },
      { id: 'rp-33', golongan: 'IV/c', pangkat: 'Pembina Utama Muda', tmt: '2022-07-15', nomorSk: '821.2/099/2022', tanggalSk: '2022-06-30' }
    ],
    riwayatJabatan: [
      { id: 'rj-31', jabatan: 'Staff BKD', unitKerja: 'Badan Kepegawaian Daerah (BKD)', tmt: '1994-04-01', nomorSk: 'SK-120/BKD/1994', tanggalSk: '1994-03-15' },
      { id: 'rj-32', jabatan: 'Kepala Bidang Mutasi', unitKerja: 'Badan Kepegawaian Daerah (BKD)', tmt: '2012-05-10', nomorSk: '821.3/214/2012', tanggalSk: '2012-05-01' }
    ],
    riwayatKgb: [
      { id: 'rk-31', gajiPokok: 4800000, tmt: '2023-02-01', nomorSk: '900/BKD-092/2023', tanggalSk: '2023-01-15', oleh: 'Gubernur' },
      { id: 'rk-32', gajiPokok: 5200000, tmt: '2025-02-01', nomorSk: '900/BKD-102/2025', tanggalSk: '2025-01-12', oleh: 'Gubernur' }
    ],
    riwayatPendidikan: [
      { id: 'rpd-31', tingkat: 'S1', jurusan: 'Teknik Elektro', institusi: 'Universitas Gadjah Mada', tahunLulus: 1992, nomorIjazah: 'UGM-92-0921' },
      { id: 'rpd-32', tingkat: 'S2', jurusan: 'Magister Manajemen', institusi: 'Universitas Gadjah Mada', tahunLulus: 2002, nomorIjazah: 'UGM-02-1241' }
    ],
    dokumen: [
      { id: 'doc-3-1', nama: 'SK CPNS Budi Santoso', fileType: 'PDF', tanggalUpload: '2011-01-01', fileSize: '1.7 MB' },
      { id: 'doc-3-2', nama: 'SK Kenaikan Pangkat IV/c', fileType: 'PDF', tanggalUpload: '2022-08-01', fileSize: '1.2 MB' }
    ]
  },
  {
    id: 'emp-4',
    nip: '197911242009032001',
    nama: 'Rina Astuti, S.E., M.Ak.',
    gender: 'P',
    tempatLahir: 'Surabaya',
    tanggalLahir: '1979-11-24',
    pangkat: 'Penata Tingkat I',
    golongan: 'III/d',
    jabatan: 'Verifikator Keuangan',
    tmtJabatan: '2019-11-01',
    unitKerja: 'Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD)',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'rina.astuti@pns.go.id',
    telepon: '081223344556',
    alamat: 'Komp. BPKAD Indah C/3, Bandung',
    kgbTerakhir: '2024-07-10', // KGB coming on 2026-07-10 is ~36 days away (not quite within 30 days, but upcoming!)
    kgbYAD: '2026-07-10',
    pangkatTerakhir: '2021-10-01',
    pangkatYAD: '2026-10-01',
    pensiunTMT: '2037-11-24',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    riwayatPangkat: [
      { id: 'rp-41', golongan: 'III/a', pangkat: 'Penata Muda', tmt: '2009-03-01', nomorSk: '821.2/021/2009', tanggalSk: '2009-02-25' },
      { id: 'rp-42', golongan: 'III/d', pangkat: 'Penata Tingkat I', tmt: '2021-10-01', nomorSk: '821.2/100/2021', tanggalSk: '2021-09-15' }
    ],
    riwayatJabatan: [
      { id: 'rj-41', jabatan: 'Staf Keuangan', unitKerja: 'Dinas Kehutanan', tmt: '2009-04-01', nomorSk: 'SK-24/KF/2009', tanggalSk: '2009-03-25' },
      { id: 'rj-42', jabatan: 'Verifikator Keuangan', unitKerja: 'Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD)', tmt: '2019-11-01', nomorSk: '821.3/901/2019', tanggalSk: '2019-10-24' }
    ],
    riwayatKgb: [
      { id: 'rk-41', gajiPokok: 3900000, tmt: '2022-07-10', nomorSk: '900/PND-142/2022', tanggalSk: '2022-06-25', oleh: 'Kepala BKD' },
      { id: 'rk-42', gajiPokok: 4200000, tmt: '2024-07-10', nomorSk: '900/PND-732/2024', tanggalSk: '2024-06-28', oleh: 'Kepala BKD' }
    ],
    riwayatPendidikan: [
      { id: 'rpd-41', tingkat: 'S1', jurusan: 'Akuntansi', institusi: 'Universitas Airlangga', tahunLulus: 2001, nomorIjazah: 'UNAIR-01-3412' },
      { id: 'rpd-42', tingkat: 'S2', jurusan: 'Magister Akuntansi', institusi: 'Universitas Padjadjaran', tahunLulus: 2011, nomorIjazah: 'UNPAD-11-0912' }
    ],
    dokumen: [
      { id: 'doc-4-1', nama: 'SK CPNS Rina Astuti', fileType: 'PDF', tanggalUpload: '2012-05-10', fileSize: '1.1 MB' }
    ]
  },
  {
    id: 'emp-5',
    nip: '200106152024031001',
    nama: 'Rian Hidayat, S.Tr.Kom.',
    gender: 'L',
    tempatLahir: 'Surabaya',
    tanggalLahir: '2001-06-15', // Birthday is June 15th! Current localized is June 4th, so birthday coming up in this month! PERFECT!
    pangkat: 'Penata Muda',
    golongan: 'III/a',
    jabatan: 'Pranata Komputer Ahli Pertama',
    tmtJabatan: '2024-03-01',
    unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik',
    agama: 'Islam',
    statusPegawai: 'PNS',
    email: 'rian.hidayat@pns.go.id',
    telepon: '081255667788',
    alamat: 'Jl. Surya No. 88, Surabaya',
    kgbTerakhir: '2024-03-01',
    kgbYAD: '2026-03-01', // Already path, next after next
    pangkatTerakhir: '2024-03-01',
    pangkatYAD: '2028-03-01',
    pensiunTMT: '2059-06-15',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    riwayatPangkat: [
      { id: 'rp-51', golongan: 'III/a', pangkat: 'Penata Muda', tmt: '2024-03-01', nomorSk: '821.2/022/2024', tanggalSk: '2024-02-15' }
    ],
    riwayatJabatan: [
      { id: 'rj-51', jabatan: 'Pranata Komputer Ahli Pertama', unitKerja: 'Dinas Komunikasi, Informatika, dan Statistik', tmt: '2024-03-01', nomorSk: '821.3/120/2024', tanggalSk: '2024-02-28' }
    ],
    riwayatKgb: [
      { id: 'rk-51', gajiPokok: 2900000, tmt: '2024-03-01', nomorSk: '900/PND-100/2024', tanggalSk: '2024-02-15', oleh: 'Kepala BKD' }
    ],
    riwayatPendidikan: [
      { id: 'rpd-51', tingkat: 'D4', jurusan: 'Teknologi Informasi', institusi: 'Politeknik Negeri Surabaya', tahunLulus: 2023, nomorIjazah: 'PENS-2023-0125' }
    ],
    dokumen: [
      { id: 'doc-5-1', nama: 'SK CPNS Rian Hidayat', fileType: 'PDF', tanggalUpload: '2024-03-05', fileSize: '1.0 MB' }
    ]
  }
];

// Dynamically generate additional structured realistic profiles of up to 120 so that we have a wide range of real entities.
export function generateRichEmployees(): Employee[] {
  const employees = [...PRIMARY_EMPLOYEES];
  const countToGenerate = 115; // To get a solid rich 120 list

  for (let i = 0; i < countToGenerate; i++) {
    const isMale = i % 2 === 0;
    const nameList = isMale ? INDONESIAN_NAMES_MALE : INDONESIAN_NAMES_FEMALE;
    const firstName = nameList[i % nameList.length];
    const lastName = nameList[(i + 3) % nameList.length].split(' ')[1] || 'Prasetya';
    const rawName = `${firstName} ${lastName}`;
    
    // Add degree
    const degrees = [', S.Kom.', ', S.E.', ', S.S.', ', S.H.', ', S.AP.', ', S.Tr.Kom.', ', M.T.', ', M.Si.', ', M.M.', ''];
    const degree = degrees[i % degrees.length];
    const nama = `${rawName}${degree}`;

    // Date of birth: between 1968 and 2002
    const yearsOfAge = 24 + (i % 34); // Ages 24 to 58
    const birthYear = 2026 - yearsOfAge;
    const birthMonth = 1 + (i % 12);
    const birthDay = 1 + (i % 28);
    const birthDateStr = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

    // Join Service details
    const joinAge = 22 + (i % 6); // Joined between age 22 and 27
    const joinYear = birthYear + joinAge;
    const joinMonth = 3;

    const genderVal = isMale ? 1 : 2;
    const nip = generateNIP(birthDateStr, joinYear, joinMonth, genderVal, i + 10);

    // Rank & Golongan selection
    // Higher age corresponds to higher rank
    let golIndex = 0;
    if (yearsOfAge >= 50) {
      golIndex = 12 + (i % 5); // Gol IV/a to IV/e
    } else if (yearsOfAge >= 40) {
      golIndex = 8 + (i % 4);  // Gol III/a to III/d
    } else if (yearsOfAge >= 30) {
      golIndex = 4 + (i % 4);  // Gol II/a to II/d
    } else {
      golIndex = 0 + (i % 4);  // Gol I/a to I/d
    }
    const rankInfo = GOLONGAN_LIST[Math.min(golIndex, GOLONGAN_LIST.length - 1)];

    // Jabatan
    const jabatan = JABATAN_LIST[i % JABATAN_LIST.length];
    const unitKerja = UNIT_KERJA_LIST[i % UNIT_KERJA_LIST.length];
    const placesOfBirth = PLACES[i % PLACES.length];

    // KGB dates
    // Calculate according to the spreadsheet formula style: cpnsYear + (is_IV ? 1 : 0)
    const isIV = rankInfo.golongan.trim().toUpperCase().startsWith('4') || rankInfo.golongan.trim().toUpperCase().startsWith('IV');
    const cpnsYear = joinYear;
    const cpnsMonth = joinMonth; // 3 (Maret)
    const baseYear = cpnsYear + (isIV ? 1 : 0);
    
    // Increment by 2 years to find active dates near 2026
    let currentKgbYear = baseYear;
    while (currentKgbYear < 2026) {
      currentKgbYear += 2;
    }
    
    let kgbYADStr = '';
    let kgbTerakhirStr = '';
    
    // To trigger within 30 days upcoming KGB alert for demonstration in Dashboard with the 2026-06-04 current date:
    if (i % 6 === 0) {
      kgbYADStr = `2026-06-${Math.min(28, 10 + (i % 15)).toString().padStart(2, '0')}`;
      kgbTerakhirStr = `2024-06-${Math.min(28, 10 + (i % 15)).toString().padStart(2, '0')}`;
    } else {
      const kgbYADYear = currentKgbYear;
      const kgbTerakhirYear = kgbYADYear - 2;
      const mm = cpnsMonth.toString().padStart(2, '0');
      kgbYADStr = `${kgbYADYear}-${mm}-01`;
      kgbTerakhirStr = `${kgbTerakhirYear}-${mm}-01`;
    }

    // Kenaikan Pangkat
    let kpMonth = 1 + (i % 12);
    let kpYear = 2026;
    let kpDay = 1;
    if (i % 10 === 0) {
      // Force KP in near future (within 60 days, e.g. July 2026)
      kpMonth = 7;
      kpDay = 1 + (i % 20);
    }
    const pangkatYADStr = `${kpYear}-${kpMonth.toString().padStart(2, '0')}-${kpDay.toString().padStart(2, '0')}`;
    const pangkatTerakhirStr = `${kpYear - 4}-${kpMonth.toString().padStart(2, '0')}-${kpDay.toString().padStart(2, '0')}`;

    // Retirement (pensiun) - typically age 58 for general, let's say 58
    const retiredLimit = 58;
    const pensiunYear = birthYear + retiredLimit;
    const pensiunYADStr = `${pensiunYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

    const religions = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'];
    const religion = religions[i % religions.length];

    const genderChar = isMale ? 'L' : 'P';
    const statusPegawai = (i % 10 === 9) ? 'PPPK' : 'PNS';

    const cleanBaseName = rawName.toLowerCase().replace(/\s+/g, '.');
    const email = `${cleanBaseName}@pns.go.id`;
    const telepon = `081${Math.floor(10000000 + Math.random() * 90000000)}`;
    const alamat = `Jl. Kembang Setaman No. ${i + 1}, ${placesOfBirth}`;

    const salary = 2500000 + (golIndex * 200000);

    const riwayatPangkat: HistoryRank[] = [
      {
        id: `rp-gen-${i}-1`,
        golongan: GOLONGAN_LIST[Math.max(0, golIndex - 1)].golongan,
        pangkat: GOLONGAN_LIST[Math.max(0, golIndex - 1)].pangkat,
        tmt: `${joinYear}-04-01`,
        nomorSk: `821.2/0${i + 10}/SK`,
        tanggalSk: `${joinYear}-03-15`
      },
      {
        id: `rp-gen-${i}-2`,
        golongan: rankInfo.golongan,
        pangkat: rankInfo.pangkat,
        tmt: pangkatTerakhirStr,
        nomorSk: `821.2/1${i + 15}/SK`,
        tanggalSk: `${kpYear - 4}-09-12`
      }
    ];

    const riwayatJabatan: HistoryPosition[] = [
      {
        id: `rj-gen-${i}-1`,
        jabatan: 'Staf Administrasi',
        unitKerja,
        tmt: `${joinYear}-04-01`,
        nomorSk: `821.3/0${i + 10}/SK-J`,
        tanggalSk: `${joinYear}-03-25`
      },
      {
        id: `rj-gen-${i}-2`,
        jabatan,
        unitKerja,
        tmt: pangkatTerakhirStr,
        nomorSk: `821.3/2${i + 15}/SK-J`,
        tanggalSk: `${kpYear - 4}-09-20`
      }
    ];

    const riwayatKgb: HistoryKgb[] = [
      {
        id: `rk-gen-${i}-1`,
        gajiPokok: salary,
        tmt: kgbTerakhirStr,
        nomorSk: `900/PND-0${i}/2024`,
        tanggalSk: `${kpYear - 2}-05-15`,
        oleh: 'Kepala BKD'
      }
    ];

    const riwayatPendidikan: HistoryEducation[] = [
      {
        id: `rpd-gen-${i}-1`,
        tingkat: 'S1',
        jurusan: i % 2 === 0 ? 'Teknik Informatika' : 'Manajemen',
        institusi: i % 2 === 0 ? 'Institut Teknologi Bandung' : 'Universitas Gadjah Mada',
        tahunLulus: joinYear - 1,
        nomorIjazah: `IJZ-000-${i}-GEN`
      }
    ];

    const dokumen: EmployeeDocument[] = [
      { id: `doc-gen-${i}-1`, nama: `SK CPNS ${firstName}`, fileType: 'PDF', tanggalUpload: `${joinYear}-12-10`, fileSize: '1.2 MB' },
      { id: `doc-gen-${i}-2`, nama: `Ijazah S1 ${firstName}`, fileType: 'PDF', tanggalUpload: `${joinYear}-12-11`, fileSize: '2.1 MB' }
    ];

    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    ];
    const foto = avatars[i % avatars.length];

    employees.push({
      id: `emp-gen-${i}`,
      nip,
      nama,
      gender: genderChar,
      tempatLahir: placesOfBirth,
      tanggalLahir: birthDateStr,
      pangkat: rankInfo.pangkat,
      golongan: rankInfo.golongan,
      jabatan,
      tmtJabatan: pangkatTerakhirStr,
      unitKerja,
      agama: religion,
      statusPegawai,
      email,
      telepon,
      alamat,
      kgbTerakhir: kgbTerakhirStr,
      kgbYAD: kgbYADStr,
      pangkatTerakhir: pangkatTerakhirStr,
      pangkatYAD: pangkatYADStr,
      pensiunTMT: pensiunYADStr,
      foto,
      riwayatPangkat,
      riwayatJabatan,
      riwayatKgb,
      riwayatPendidikan,
      dokumen
    });
  }

  return employees;
}

// Generate the fully massive list (10,500 records) dynamically memory efficient.
// This supports virtualized scrolling with minimal text items.
export function generate10kEmployees(baseEmployees: Employee[]): any[] {
  const dataset: any[] = [...baseEmployees];
  const targetCount = 10500;
  const currentCount = baseEmployees.length;

  for (let i = currentCount; i < targetCount; i++) {
    const isMale = i % 2 === 0;
    const nameList = isMale ? INDONESIAN_NAMES_MALE : INDONESIAN_NAMES_FEMALE;
    const first = nameList[i % nameList.length];
    const last = nameList[(i + 7) % nameList.length].split(' ')[1] || 'Saputra';
    const rawName = `${first} ${last}`;
    const degrees = [', S.Kom.', ', S.E.', ', S.S.', ', M.T.', ''];
    const nama = `${rawName}${degrees[i % degrees.length]}`;

    const age = 22 + (i % 38);
    const birthYear = 2026 - age;
    const birthStr = `${birthYear}-05-12`;
    const nip = generateNIP(birthStr, birthYear + 24, 3, isMale ? 1 : 2, i);

    const rankInfo = GOLONGAN_LIST[i % GOLONGAN_LIST.length];
    const jabatan = JABATAN_LIST[i % JABATAN_LIST.length];
    const unitKerja = UNIT_KERJA_LIST[i % UNIT_KERJA_LIST.length];

    dataset.push({
      id: `emp-10k-${i}`,
      nip,
      nama,
      gender: isMale ? 'L' : 'P',
      pangkat: rankInfo.pangkat,
      golongan: rankInfo.golongan,
      jabatan,
      unitKerja,
      email: `${rawName.toLowerCase().replace(/\s+/g, '.')}@pns.go.id`,
      statusPegawai: i % 12 === 0 ? 'PPPK' : 'PNS',
      kgbYAD: `2026-${((i % 12) + 1).toString().padStart(2, '0')}-15`,
      pangkatYAD: `2027-${((i % 12) + 1).toString().padStart(2, '0')}-01`,
      pensiunTMT: `${birthYear + 58}-05-12`
    });
  }

  return dataset;
}
