import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

type SalaryData = {
    id: number;
    period_start: string | null;
    simrs_nik: string;
    employee_name: string | null;
    unit: string | null;
    npwp: string | null;
    phone: string | null;
    ref_no: number | null;
    salary_no: number | null;
    // Komponen
    gaji_pokok: string | null;
    keluarga: string | null;
    fungsional: string | null;
    struktural: string | null;
    operasional: string | null;
    jkk: string | null;
    jkm: string | null;
    jht: string | null;
    jp: string | null;
    tunj_bpjs_tk: string | null;
    bpjs_kes: string | null;
    transport_spj: string | null;
    jm_dokter: string | null;
    lembur: string | null;
    on_call: string | null;
    lain_lain: string | null;
    jkn: string | null;
    umum: string | null;
    jkn_susulan: string | null;
    jkn_susulan_l: string | null;
    // Potongan
    jkk_k: string | null;
    jkm_k: string | null;
    jht_k: string | null;
    jp_k: string | null;
    pot_bpjs_tk: string | null;
    bpjs_kes_k: string | null;
    jht_i: string | null;
    jp_i: string | null;
    bpjs_kes_i: string | null;
    bpjs_kes_tidak_ditanggung: string | null;
    matan: string | null;
    lazismu: string | null;
    obat2an: string | null;
    hutang_bpjs: string | null;
    hutang_seragam: string | null;
    ikkm: string | null;
    lain_pot: string | null;
    // Main
    pajak: string | null;
    zakat: string | null;
    penerimaan: string | null;
    pembulatan: string | null;
    // Totals
    jumlah: string | null;
    jumlah_tunjangan: string | null;
    jumlah_pot: string | null;
    // Info
    denominados: string | null;
    masa_kerja?: { years: number; months: number; days: number } | null;
};

type Props = {
    salary: SalaryData;
};

function parseMoney(value: string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '–' || trimmed === '0') return null;
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

function formatIdr(value: string | null | undefined): string {
    const n = parseMoney(value);
    if (n === null || n === 0) return 'Rp -';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function formatIdrValue(n: number): string {
    if (n === 0) return 'Rp -';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function formatPeriod(dateString: string | null): string {
    if (!dateString) return '-';
    const match = dateString.match(/^(\d{4})-(\d{2})/);
    if (match) {
        const [, year, month] = match;
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return dateString;
}

function getValue(salary: SalaryData, key: keyof SalaryData): number {
    return parseMoney(salary[key] as string | null) ?? 0;
}

export default function PayrollPrint({ salary }: Props) {
    // Get values
    const gp = getValue(salary, 'gaji_pokok');
    const keluarga = getValue(salary, 'keluarga');
    const fungsional = getValue(salary, 'fungsional');
    const struktural = getValue(salary, 'struktural');
    const operasional = getValue(salary, 'operasional');
    const bpjsTk = getValue(salary, 'tunj_bpjs_tk'); // TUNJ_BPJS_TK (JKK+JKM+JHT+JP)
    const bpjsKes = getValue(salary, 'bpjs_kes');
    const transport = getValue(salary, 'transport_spj');
    const jmDokter = getValue(salary, 'jm_dokter');
    const lainLain = getValue(salary, 'lain_lain');
    const lembur = getValue(salary, 'lembur');
    const onCall = getValue(salary, 'on_call');
    const jkn = getValue(salary, 'jkn');
    const umum = getValue(salary, 'umum');
    const jknSusulan = getValue(salary, 'jkn_susulan');
    const jknSusulanL = getValue(salary, 'jkn_susulan_l');

    // Potongan
    const pajak = getValue(salary, 'pajak');
    const zakat = getValue(salary, 'zakat');
    const potBpjsTk = getValue(salary, 'pot_bpjs_tk'); // POT_BPJS_TK
    const potBpjsKes = getValue(salary, 'bpjs_kes_k');
    const jhtI = getValue(salary, 'jht_i');
    const jpI = getValue(salary, 'jp_i');
    const bpjsKesI = getValue(salary, 'bpjs_kes_i');
    const matan = getValue(salary, 'matan');
    const lazismu = getValue(salary, 'lazismu');
    const obat2an = getValue(salary, 'obat2an');
    const hutangBpjs = getValue(salary, 'hutang_bpjs');
    const hutangSeragam = getValue(salary, 'hutang_seragam');
    const ikkm = getValue(salary, 'ikkm');
    const lainPot = getValue(salary, 'lain_pot');

    // Ambil TOTAL dari CSV langsung (lebih akurat)
    const jumlahTunjanganCsv = parseMoney(salary.jumlah_tunjangan);
    const jumlahCsv = parseMoney(salary.jumlah);
    const jumlahPotCsv = parseMoney(salary.jumlah_pot);
    const gajiBersihCsv = parseMoney(salary.pembulatan ?? salary.penerimaan);

    // Kalau dari CSV ada, pakai itu. Kalau tidak ada, hitung dari komponen
    const tunjanganLain = jumlahTunjanganCsv ?? (keluarga + fungsional + struktural + operasional + bpjsTk + bpjsKes + transport);
    const lainLainTotal = lembur + onCall + jkn + umum + jknSusulan + jknSusulanL;

    // Total Pendapatan:优先 dari CSV
    const totalPendapatan = jumlahCsv ?? (gp + tunjanganLain + lainLainTotal);

    // Total Potongan:优先 dari CSV
    const totalPotongan = jumlahPotCsv ?? (pajak + zakat + potBpjsTk + potBpjsKes + jhtI + jpI + bpjsKesI
        + matan + lazismu + obat2an + hutangBpjs + hutangSeragam + ikkm + lainPot);

    // Gaji Bersih:优先 dari CSV (pembulatan)
    const gajiBersih = gajiBersihCsv ?? (totalPendapatan - totalPotongan);

    return (
        <div className="min-h-screen bg-slate-200/80 py-4 px-2 print:bg-white print:py-0">
            <Head title={`Slip Gaji - ${salary.employee_name ?? salary.simrs_nik}`} />

            <div className="mx-auto max-w-[800px] bg-white shadow-xl print:m-0 print:max-w-full print:shadow-none">
                {/* Header */}
                <div className="flex items-start gap-3 border-b-2 border-black px-4 pb-3 mb-3">
                    <div className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white">
                        <AppLogoIcon className="size-6 text-black" />
                    </div>
                    <div className="flex-1 leading-tight">
                        <div className="text-base font-bold text-black">
                            RS Aisyiyah Siti Fatimah Tulangan
                        </div>
                        <div className="text-[10px] text-gray-600">
                            Jl. Raya Kenongo, No.14, Kec. Tulangan, Sidoarjo
                        </div>
                    </div>
                    <div className="text-right text-[10px] text-gray-600">
                        <div className="font-bold">SLIP GAJI</div>
                        <div>{formatPeriod(salary.period_start)}</div>
                        <div className="font-mono">No: {salary.ref_no ?? salary.salary_no ?? '-'}</div>
                    </div>
                </div>

                {/* Info Karyawan */}
                <div className="grid grid-cols-2 gap-4 px-4 mb-3 text-[10px]">
                    <div>
                        <div className="flex"><span className="w-20">Nama</span>: <span className="font-bold">{salary.employee_name ?? '-'}</span></div>
                        <div className="flex"><span className="w-20">NIK</span>: <span className="font-mono">{salary.simrs_nik}</span></div>
                        <div className="flex"><span className="w-20">NPWP</span>: <span className="font-mono">{salary.npwp ?? '-'}</span></div>
                        {salary.masa_kerja && (
                            <div className="flex"><span className="w-20">Masa Kerja</span>: <span>{salary.masa_kerja.years} Thn {salary.masa_kerja.months} Bln</span></div>
                        )}
                    </div>
                    <div>
                        <div className="flex"><span className="w-20">Unit</span>: <span>{salary.unit ?? '-'}</span></div>
                        <div className="flex"><span className="w-20">Telepon</span>: <span>{salary.phone ?? '-'}</span></div>
                    </div>
                </div>

                {/* Tabel Gaji */}
                <div className="border border-black text-[10px]">
                    {/* Header */}
                    <div className="bg-gray-800 text-white px-3 py-1.5 font-bold text-center">
                        PERINCIAN GAJI
                    </div>

                    {/* PENDAPATAN */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b-2 border-black">
                        <div className="px-2 py-1 font-bold bg-gray-100 border-r border-gray-300">URAIAN</div>
                        <div className="px-2 py-1 font-bold bg-gray-100 border-r border-gray-300 text-right">JUMLAH</div>
                        <div className="px-2 py-1 font-bold bg-gray-100 text-right">KET</div>
                    </div>

                    {/* 1. Gaji Pokok */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-2 py-1 font-bold">1. Gaji Pokok</div>
                        <div className="px-2 py-1 text-right font-mono">{formatIdrValue(gp)}</div>
                        <div className="px-2 py-1"></div>
                    </div>

                    {/* 2. Tunjangan */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-2 py-1 font-bold">2. Tunjangan</div>
                        <div className="px-2 py-1"></div>
                        <div className="px-2 py-1"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Keluarga</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(keluarga)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Fungsional</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(fungsional)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Struktural</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(struktural)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Operasional</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(operasional)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">BPJS Ketenagakerjaan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(bpjsTk)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">BPJS Kesehatan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(bpjsKes)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Transport/SPJ</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(transport)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Jasa Medis Dokter</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jmDokter)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Lain-lain</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(lainLain)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>

                    {/* 3. Lain-Lain */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-2 py-1 font-bold">3. Lain-Lain</div>
                        <div className="px-2 py-1"></div>
                        <div className="px-2 py-1"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Lembur</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(lembur)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">On Call / Asisten</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(onCall)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Remunerasi JKN Feb 2026</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jkn)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Remunerasi Umum Mar 2026</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(umum)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Remunerasi JKN Susulan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jknSusulan)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-0.5">Remunerasi JKN Susulan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jknSusulanL)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>

                    {/* Total Tunjangan */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b-2 border-black bg-blue-50">
                        <div className="px-2 py-1 font-bold">Jumlah Tunjangan</div>
                        <div className="px-2 py-1 text-right font-mono font-bold">{formatIdrValue(tunjanganLain)}</div>
                        <div className="px-2 py-1"></div>
                    </div>

                    {/* Total Gaji (Pendapatan) */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b-2 border-black bg-green-100">
                        <div className="px-2 py-1 font-bold">Jumlah Gaji</div>
                        <div className="px-2 py-1 text-right font-mono font-bold">{formatIdrValue(totalPendapatan)}</div>
                        <div className="px-2 py-1"></div>
                    </div>

                    {/* POTONGAN */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200 bg-red-50">
                        <div className="px-2 py-1 font-bold">4. Potongan-Potongan</div>
                        <div className="px-2 py-1"></div>
                        <div className="px-2 py-1"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Zakat</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(zakat)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Pajak</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(pajak)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">BPJS Ketenagakerjaan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(potBpjsTk)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">BPJS Kesehatan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(potBpjsKes)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Jaminan Hari Tua</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jhtI)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Jaminan Pensiun</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(jpI)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">BPJS Kesehatan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(bpjsKesI)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">BPJS Kesehatan tdk di tgg</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(getValue(salary, 'bpjs_kes_tidak_ditanggung'))}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Matan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(matan)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Lazismu</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(lazismu)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Obat/Jasmed/Tindakan</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(obat2an)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Hutang BPJS</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(hutangBpjs)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Hutang Seragam</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(hutangSeragam)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">IKKM</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(ikkm)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_100px] border-b border-gray-200">
                        <div className="px-4 py-0.5">Lain-lain</div>
                        <div className="px-2 py-0.5 text-right font-mono">{formatIdrValue(lainPot)}</div>
                        <div className="px-2 py-0.5"></div>
                    </div>

                    {/* Total Potongan */}
                    <div className="grid grid-cols-[1fr_60px_100px] border-b-2 border-black bg-red-100">
                        <div className="px-2 py-1 font-bold">Jumlah Potongan</div>
                        <div className="px-2 py-1 text-right font-mono font-bold">{formatIdrValue(totalPotongan)}</div>
                        <div className="px-2 py-1"></div>
                    </div>

                    {/* GAJI BERSIH */}
                    <div className="grid grid-cols-[1fr_60px_100px] bg-gray-900 text-white">
                        <div className="px-2 py-2 font-bold text-sm">Jumlah Gaji Bersih</div>
                        <div className="px-2 py-2 text-right font-mono font-bold text-sm">{formatIdrValue(gajiBersih)}</div>
                        <div className="px-2 py-2"></div>
                    </div>

                    {/* Terbilang */}
                    <div className="px-3 py-1.5 bg-gray-100 text-[9px] italic border-t border-black">
                        Terbilang: {salary.denominados ?? (gajiBersih.toLocaleString('id-ID') + ' rupiah')}
                    </div>
                </div>

                {/* Footer Tanda Tangan */}
                <div className="mt-4 flex justify-between px-4 text-[10px]">
                    <div className="text-center">
                        <div>Mengetahui,</div>
                        <div>Bagian Keuangan</div>
                        <div className="mt-8 font-semibold">______________________</div>
                    </div>
                    <div className="text-center">
                        <div>Sidoarjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div>Bendahara</div>
                        <div className="mt-8 font-semibold">______________________</div>
                    </div>
                </div>

                {/* Print Button */}
                <div className="mt-6 flex justify-center pb-4 print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
                    >
                        <Printer className="h-4 w-4" />
                        Print / Simpan PDF
                    </button>
                </div>
            </div>
        </div>
    );
}