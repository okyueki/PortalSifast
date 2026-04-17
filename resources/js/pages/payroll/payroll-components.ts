export type PayrollComponent = {
    key: string;
    label: string;
    section: 'pendapatan' | 'potongan';
};

export const PAYROLL_COMPONENTS: PayrollComponent[] = [
    // ==================== PENDAPATAN ====================
    { section: 'pendapatan', key: 'gaji_pokok', label: 'Gaji Pokok' },
    { section: 'pendapatan', key: 'keluarga', label: 'Tunj. Keluarga' },
    { section: 'pendapatan', key: 'fungsional', label: 'Tunj. Fungsional' },
    { section: 'pendapatan', key: 'struktural', label: 'Tunj. Struktural' },
    { section: 'pendapatan', key: 'operasional', label: 'Operasional' },
    { section: 'pendapatan', key: 'transport_spj', label: 'Transport / SPJ' },
    { section: 'pendapatan', key: 'jm_dokter', label: 'Jasa Medik / JM Dokter' },
    { section: 'pendapatan', key: 'lain_lain', label: 'Lain-lain' },
    { section: 'pendapatan', key: 'lembur', label: 'Lembur' },
    { section: 'pendapatan', key: 'on_call', label: 'On Call' },
    { section: 'pendapatan', key: 'jkn_desember_2025', label: 'JKN Desember 2025' },
    { section: 'pendapatan', key: 'umum_januari_2025', label: 'Umum Januari 2025' },
    { section: 'pendapatan', key: 'jkn_susulan_1', label: 'JKN Susulan 1' },
    { section: 'pendapatan', key: 'jkn_susulan_2', label: 'JKN Susulan 2' },

    // ==================== POTONGAN ====================
    { section: 'potongan', key: 'zakat', label: 'Zakat' },
    { section: 'potongan', key: 'pajak', label: 'Pajak' },
    { section: 'potongan', key: 'jkk_pot', label: 'JKK' },
    { section: 'potongan', key: 'jkm_pot', label: 'JKM' },
    { section: 'potongan', key: 'jht_pot', label: 'JHT' },
    { section: 'potongan', key: 'jp_pot', label: 'JP' },
    { section: 'potongan', key: 'bpjs_kes_pot_1', label: 'BPJS Kesehatan' },
    { section: 'potongan', key: 'bpjs_kes_pot_2', label: 'BPJS Kesehatan (2)' },
    { section: 'potongan', key: 'bpjs_kes_tdk_dtg', label: 'BPJS Kes (tdk ditanggung)' },
    { section: 'potongan', key: 'matan', label: 'Matan' },
    { section: 'potongan', key: 'lazismu', label: 'Lazismu' },
    { section: 'potongan', key: 'obat2an_pot', label: 'Obat/Jasmed/Tindakan' },
    { section: 'potongan', key: 'hutang_bpjs', label: 'Hutang BRI' },
    { section: 'potongan', key: 'hutang_seragam', label: 'Hutang Seragam' },
    { section: 'potongan', key: 'ikkm', label: 'IKKM' },
    { section: 'potongan', key: 'lain_lain', label: 'Lain-lain' },
];

export function getComponentsBySection(section: PayrollComponent['section']): PayrollComponent[] {
    return PAYROLL_COMPONENTS.filter((c) => c.section === section);
}

