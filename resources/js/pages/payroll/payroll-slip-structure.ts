export type SalaryFieldKey =
    | 'gaji_pokok'
    | 'keluarga'
    | 'tunj_masa_kerja'
    | 'tunj_kehadiran'
    | 'tunj_makan'
    | 'fungsional'
    | 'struktural'
    | 'operasional'
    | 'tunj_bpjs_tk'
    | 'bpjs_kes'
    | 'transport_spj'
    | 'jm_dokter'
    | 'lain_lain'
    | 'lembur'
    | 'on_call'
    | 'jkn'
    | 'umum'
    | 'jkn_susulan'
    | 'jkn_susulan_l'
    | 'zakat'
    | 'pajak'
    | 'pot_bpjs_tk'
    | 'bpjs_kes_k'
    | 'jht_i'
    | 'jp_i'
    | 'bpjs_kes_i'
    | 'bpjs_kes_tidak_ditanggung'
    | 'matan'
    | 'lazismu'
    | 'obat2an'
    | 'hutang_bpjs'
    | 'hutang_seragam'
    | 'ikkm'
    | 'lain_pot';

export type SlipLineDef = {
    key: SalaryFieldKey;
    label: string;
    dynamicLabelKey?: 'jkn_label' | 'umum_label';
};

export type SlipSectionDef = {
    number: string;
    title: string;
    lines: SlipLineDef[];
};

export const SLIP_SECTIONS: SlipSectionDef[] = [
    {
        number: '1',
        title: 'Kehadiran',
        lines: [{ key: 'gaji_pokok', label: 'Kehadiran' }],
    },
    {
        number: '2',
        title: 'Tunjangan',
        lines: [
            { key: 'keluarga', label: 'Keluarga' },
            { key: 'tunj_masa_kerja', label: 'Masa Kerja' },
            { key: 'tunj_kehadiran', label: 'Kehadiran' },
            { key: 'tunj_makan', label: 'Makan' },
            { key: 'fungsional', label: 'Fungsional' },
            { key: 'struktural', label: 'Struktural' },
            { key: 'operasional', label: 'Operasional' },
            { key: 'tunj_bpjs_tk', label: 'BPJS Ketenagakerjaan' },
            { key: 'bpjs_kes', label: 'BPJS Kesehatan' },
            { key: 'transport_spj', label: 'Transport/SPJ' },
            { key: 'jm_dokter', label: 'Jasa Medis Dokter' },
            { key: 'lain_lain', label: 'Lain-lain' },
        ],
    },
    {
        number: '3',
        title: 'Lain-Lain',
        lines: [
            { key: 'lembur', label: 'Lembur' },
            { key: 'on_call', label: 'On Call / Asisten' },
            { key: 'jkn', label: 'Remunerasi JKN', dynamicLabelKey: 'jkn_label' },
            { key: 'umum', label: 'Remunerasi Umum', dynamicLabelKey: 'umum_label' },
            { key: 'jkn_susulan', label: 'Remunerasi JKN Susulan' },
            { key: 'jkn_susulan_l', label: 'Remunerasi JKN Susulan' },
        ],
    },
    {
        number: '4',
        title: 'Potongan-Potongan',
        lines: [
            { key: 'zakat', label: 'Zakat' },
            { key: 'pajak', label: 'Pajak' },
            { key: 'pot_bpjs_tk', label: 'BPJS Ketenagakerjaan' },
            { key: 'bpjs_kes_k', label: 'BPJS Kesehatan' },
            { key: 'jht_i', label: 'Jaminan Hari Tua' },
            { key: 'jp_i', label: 'Jaminan Pensiun' },
            { key: 'bpjs_kes_i', label: 'BPJS Kesehatan' },
            { key: 'bpjs_kes_tidak_ditanggung', label: 'BPJS Kesehatan tdk di tgg' },
            { key: 'matan', label: 'Matan' },
            { key: 'lazismu', label: 'Lazismu' },
            { key: 'obat2an', label: 'Obat/Jasmed/Tindakan' },
            { key: 'hutang_bpjs', label: 'Hutang BPJS' },
            { key: 'hutang_seragam', label: 'Hutang Seragam' },
            { key: 'ikkm', label: 'IKKM' },
            { key: 'lain_pot', label: 'Lain-lain' },
        ],
    },
];

export const TUNJANGAN_KEYS: SalaryFieldKey[] = SLIP_SECTIONS[1].lines.map((l) => l.key);

export const LAIN_LAIN_KEYS: SalaryFieldKey[] = SLIP_SECTIONS[2].lines.map((l) => l.key);

export const POTONGAN_KEYS: SalaryFieldKey[] = SLIP_SECTIONS[3].lines.map((l) => l.key);

export function parseMoney(value: string | null | undefined): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const trimmed = value.toString().trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '–' || trimmed === '0') {
        return null;
    }

    const noRp = trimmed.replace(/rp/gi, '').replace(/\s+/g, '');
    if (/^\-?\d{1,3}(\.\d{3})+$/.test(noRp)) {
        const n = Number(noRp.replace(/\./g, ''));

        return Number.isFinite(n) ? n : null;
    }

    const cleaned = noRp.replace(/[^0-9,.\-]/g, '');
    const normalized = cleaned.replace(/,/g, '.');
    const n = Number(normalized);

    return Number.isFinite(n) ? n : null;
}

export function getMoneyValue(record: Record<string, string | null | undefined>, key: string): number {
    return parseMoney(record[key]) ?? 0;
}

export function resolveLineLabel(
    line: SlipLineDef,
    record: Record<string, string | null | undefined>,
): string {
    if (line.dynamicLabelKey && record[line.dynamicLabelKey]) {
        return record[line.dynamicLabelKey] as string;
    }

    return line.label;
}

export function sumKeys(record: Record<string, string | null | undefined>, keys: string[]): number {
    return keys.reduce((sum, key) => sum + getMoneyValue(record, key), 0);
}

export function formatIdrValue(n: number, empty = '-'): string {
    if (n === 0) {
        return empty;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);
}

export function formatIdrPrint(n: number): string {
    if (n === 0) {
        return 'Rp -';
    }

    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

export function computeSlipTotals(record: Record<string, string | null | undefined>) {
    const kehadiran = getMoneyValue(record, 'gaji_pokok');
    const jumlahTunjanganCsv = parseMoney(record.jumlah_tunjangan);
    const jumlahCsv = parseMoney(record.jumlah);
    const jumlahPotCsv = parseMoney(record.jumlah_pot);
    const gajiBersihCsv = parseMoney(record.pembulatan ?? record.penerimaan);

    // Jumlah Tunjangan = section 2 (Tunjangan) + section 3 (Lain-Lain), sesuai slip RS
    const tunjanganSection = sumKeys(record, TUNJANGAN_KEYS);
    const lainLainTotal = sumKeys(record, LAIN_LAIN_KEYS);
    const tunjanganTotal = jumlahTunjanganCsv ?? tunjanganSection + lainLainTotal;
    const totalPendapatan = jumlahCsv ?? kehadiran + tunjanganTotal;
    const totalPotongan = jumlahPotCsv ?? sumKeys(record, POTONGAN_KEYS);
    const gajiBersih = gajiBersihCsv ?? totalPendapatan - totalPotongan;

    return {
        kehadiran,
        tunjanganTotal,
        lainLainTotal,
        totalPendapatan,
        totalPotongan,
        gajiBersih,
    };
}
