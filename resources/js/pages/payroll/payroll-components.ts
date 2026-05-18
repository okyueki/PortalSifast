export type PayrollComponent = {
    key: string;
    label: string;
    section: 'pendapatan' | 'potongan' | 'total';
};

export const PAYROLL_COMPONENTS: PayrollComponent[] = [
    // ==================== PENDAPATAN ====================
    // Gaji Pokok
    { section: 'pendapatan', key: 'gaji_pokok', label: 'Gaji Pokok' },
    // Tunjangan
    { section: 'pendapatan', key: 'keluarga', label: 'Tunj. Keluarga' },
    { section: 'pendapatan', key: 'fungsional', label: 'Tunj. Fungsional' },
    { section: 'pendapatan', key: 'struktural', label: 'Tunj. Struktural' },
    { section: 'pendapatan', key: 'operasional', label: 'Tunj. Operasional' },
    // BPJS TK Perusahaan
    { section: 'pendapatan', key: 'jkk', label: 'JKK (Perusahaan)' },
    { section: 'pendapatan', key: 'jkm', label: 'JKM (Perusahaan)' },
    { section: 'pendapatan', key: 'jht', label: 'JHT (Perusahaan)' },
    { section: 'pendapatan', key: 'jp', label: 'JP (Perusahaan)' },
    { section: 'pendapatan', key: 'bpjs_kes', label: 'BPJS Kesehatan (Perusahaan)' },
    // Lainnya
    { section: 'pendapatan', key: 'transport_spj', label: 'Transport / SPJ' },
    { section: 'pendapatan', key: 'jm_dokter', label: 'Jasa Medik Dokter' },
    { section: 'pendapatan', key: 'lembur', label: 'Lembur' },
    { section: 'pendapatan', key: 'on_call', label: 'On Call' },
    { section: 'pendapatan', key: 'lain_lain', label: 'Lain-lain' },
    // JKN & Umum
    { section: 'pendapatan', key: 'jkn', label: 'JKN' },
    { section: 'pendapatan', key: 'umum', label: 'Umum' },
    { section: 'pendapatan', key: 'jkn_susulan', label: 'JKN Susulan' },
    { section: 'pendapatan', key: 'jkn_susulan_l', label: 'JKN Susulan L' },
    // Total dari CSV
    { section: 'total', key: 'jumlah', label: 'Jumlah' },
    { section: 'total', key: 'jumlah_tunjangan', label: 'Jumlah Tunjangan' },

    // ==================== POTONGAN ====================
    // BPJS TK Karyawan
    { section: 'potongan', key: 'jkk_k', label: 'JKK (Karyawan)' },
    { section: 'potongan', key: 'jkm_k', label: 'JKM (Karyawan)' },
    { section: 'potongan', key: 'jht_k', label: 'JHT (Karyawan)' },
    { section: 'potongan', key: 'jp_k', label: 'JP (Karyawan)' },
    { section: 'potongan', key: 'bpjs_kes_k', label: 'BPJS Kesehatan (Karyawan)' },
    // Iuran
    { section: 'potongan', key: 'jht_i', label: 'JHT Iuran' },
    { section: 'potongan', key: 'jp_i', label: 'JP Iuran' },
    { section: 'potongan', key: 'bpjs_kes_i', label: 'BPJS Kesehatan Iuran' },
    { section: 'potongan', key: 'bpjs_kes_tidak_ditanggung', label: 'BPJS Kes Tdk Ditanggung' },
    // Potongan Lain
    { section: 'potongan', key: 'matan', label: 'Matan' },
    { section: 'potongan', key: 'lazismu', label: 'Lazismu' },
    { section: 'potongan', key: 'obat2an', label: 'Obat/Jasmed/Tindakan' },
    { section: 'potongan', key: 'hutang_bpjs', label: 'Hutang BPJS' },
    { section: 'potongan', key: 'hutang_seragam', label: 'Hutang Seragam' },
    { section: 'potongan', key: 'ikkm', label: 'IKKM' },
    { section: 'potongan', key: 'lain_pot', label: 'Lain-lain' },
    // Zakat & Pajak
    { section: 'potongan', key: 'zakat', label: 'Zakat' },
    { section: 'potongan', key: 'pajak', label: 'Pajak (PPh 21)' },
    // Total dari CSV
    { section: 'total', key: 'jumlah_pot', label: 'Jumlah Potongan' },
];

export function getComponentsBySection(section: PayrollComponent['section']): PayrollComponent[] {
    return PAYROLL_COMPONENTS.filter((c) => c.section === section);
}

export function getAllComponentKeys(): string[] {
    return PAYROLL_COMPONENTS.filter((c) => c.section !== 'total').map((c) => c.key);
}