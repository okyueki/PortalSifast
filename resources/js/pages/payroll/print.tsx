import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    SLIP_SECTIONS,
    computeSlipTotals,
    formatIdrPrint,
    getMoneyValue,
    resolveLineLabel,
    type SlipLineDef,
} from '@/pages/payroll/payroll-slip-structure';

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
    gaji_pokok: string | null;
    keluarga: string | null;
    tunj_masa_kerja: string | null;
    tunj_kehadiran: string | null;
    tunj_makan: string | null;
    fungsional: string | null;
    struktural: string | null;
    operasional: string | null;
    tunj_bpjs_tk: string | null;
    bpjs_kes: string | null;
    transport_spj: string | null;
    jm_dokter: string | null;
    lain_lain: string | null;
    lembur: string | null;
    on_call: string | null;
    jkn: string | null;
    jkn_label: string | null;
    umum: string | null;
    umum_label: string | null;
    jkn_susulan: string | null;
    jkn_susulan_l: string | null;
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
    pajak: string | null;
    zakat: string | null;
    penerimaan: string | null;
    pembulatan: string | null;
    jumlah: string | null;
    jumlah_tunjangan: string | null;
    jumlah_pot: string | null;
    denominados: string | null;
    masa_kerja?: { years: number; months: number; days: number } | null;
};

type Props = {
    salary: SalaryData;
};

function formatPeriod(dateString: string | null): string {
    if (!dateString) {
        return '-';
    }

    const match = dateString.match(/^(\d{4})-(\d{2})/);
    if (match) {
        const [, year, month] = match;
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);

        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    return dateString;
}

function SlipRow({ line, salary, indent = false }: { line: SlipLineDef; salary: SalaryData; indent?: boolean }) {
    const amount = getMoneyValue(salary, line.key);

    return (
        <tr className="border-b border-slate-200">
            <td className={`py-1 ${indent ? 'pl-6' : 'pl-3'}`}>{resolveLineLabel(line, salary)}</td>
            <td className="py-1 pr-3 text-right font-mono tabular-nums">{formatIdrPrint(amount)}</td>
        </tr>
    );
}

export default function PayrollPrint({ salary }: Props) {
    const totals = computeSlipTotals(salary);
    const pendapatanSections = SLIP_SECTIONS.filter((s) => s.number !== '4');
    const potonganSection = SLIP_SECTIONS.find((s) => s.number === '4');

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
            <Head title={`Slip Gaji - ${salary.employee_name ?? salary.simrs_nik}`} />

            <div className="mx-auto max-w-[720px] bg-white shadow-lg print:mx-0 print:max-w-none print:shadow-none">
                <div className="border-b-2 border-slate-900 px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-900">
                                <AppLogoIcon className="size-7 text-slate-900" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold leading-tight text-slate-900">
                                    RS Aisyiyah Siti Fatimah Tulangan
                                </h1>
                                <p className="mt-0.5 text-[10px] text-slate-600">
                                    Jl. Raya Kenongo No. 14, Kec. Tulangan, Sidoarjo
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold tracking-wide text-slate-900">SLIP GAJI</p>
                            <p className="mt-1 text-[11px] text-slate-700">{formatPeriod(salary.period_start)}</p>
                            <p className="text-[10px] font-mono text-slate-500">
                                No. {salary.ref_no ?? salary.salary_no ?? '-'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1 border-b border-slate-200 px-6 py-3 text-[11px]">
                    <div className="space-y-1">
                        <InfoRow label="Nama" value={salary.employee_name ?? '-'} bold />
                        <InfoRow label="NIK" value={salary.simrs_nik} mono />
                        <InfoRow label="NPWP" value={salary.npwp ?? '-'} mono />
                        {salary.masa_kerja && (
                            <InfoRow
                                label="Masa Kerja"
                                value={`${salary.masa_kerja.years} Thn ${salary.masa_kerja.months} Bln`}
                            />
                        )}
                    </div>
                    <div className="space-y-1">
                        <InfoRow label="Unit" value={salary.unit ?? '-'} />
                        <InfoRow label="Telepon" value={salary.phone ?? '-'} />
                    </div>
                </div>

                <div className="px-6 py-4">
                    <table className="w-full border-collapse text-[11px] text-slate-900">
                        <thead>
                            <tr className="border-b-2 border-slate-900 bg-slate-800 text-white">
                                <th className="px-3 py-2 text-left font-semibold">Uraian</th>
                                <th className="w-36 px-3 py-2 text-right font-semibold">Jumlah (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendapatanSections.map((section) => (
                                <SectionBlock key={section.number} number={section.number} title={section.title} lines={section.lines} salary={salary} />
                            ))}

                            <tr className="border-y-2 border-slate-800 bg-blue-50 font-bold">
                                <td className="px-3 py-2">Jumlah Tunjangan</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">{formatIdrPrint(totals.tunjanganTotal)}</td>
                            </tr>
                            <tr className="border-b-2 border-slate-800 bg-green-50 font-bold">
                                <td className="px-3 py-2">Jumlah Gaji</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">{formatIdrPrint(totals.totalPendapatan)}</td>
                            </tr>

                            {potonganSection && (
                                <SectionBlock
                                    number={potonganSection.number}
                                    title={potonganSection.title}
                                    lines={potonganSection.lines}
                                    salary={salary}
                                />
                            )}

                            <tr className="border-y-2 border-slate-800 bg-red-50 font-bold">
                                <td className="px-3 py-2">Jumlah Potongan</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">{formatIdrPrint(totals.totalPotongan)}</td>
                            </tr>
                            <tr className="bg-slate-900 font-bold text-white">
                                <td className="px-3 py-2 text-[12px]">Jumlah Gaji Bersih</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-[12px]">{formatIdrPrint(totals.gajiBersih)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] italic text-slate-700">
                        Terbilang: {salary.denominados ?? `${totals.gajiBersih.toLocaleString('id-ID')} rupiah`}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-slate-200 px-6 py-6 text-[11px]">
                    <div className="text-center">
                        <p>Mengetahui,</p>
                        <p className="font-medium">Bagian Keuangan</p>
                        <div className="mt-12 border-t border-slate-400 pt-1">&nbsp;</div>
                    </div>
                    <div className="text-center">
                        <p>
                            Sidoarjo,{' '}
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="font-medium">Bendahara</p>
                        <div className="mt-12 border-t border-slate-400 pt-1">&nbsp;</div>
                    </div>
                </div>

                <div className="flex justify-center pb-6 print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                        <Printer className="size-4" />
                        Print / Simpan PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

function SectionBlock({
    number,
    title,
    lines,
    salary,
}: {
    number: string;
    title: string;
    lines: SlipLineDef[];
    salary: SalaryData;
}) {
    return (
        <>
            <tr className="border-b border-slate-300 bg-slate-100">
                <td colSpan={2} className="px-3 py-1.5 text-[11px] font-bold">
                    {number}. {title}
                </td>
            </tr>
            {lines.map((line) => (
                <SlipRow key={`${number}-${line.key}`} line={line} salary={salary} indent={number !== '1'} />
            ))}
        </>
    );
}

function InfoRow({
    label,
    value,
    bold = false,
    mono = false,
}: {
    label: string;
    value: string;
    bold?: boolean;
    mono?: boolean;
}) {
    return (
        <div className="flex gap-2">
            <span className="w-20 shrink-0 text-slate-500">{label}</span>
            <span className="text-slate-400">:</span>
            <span className={`min-w-0 flex-1 ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono text-[10px]' : ''}`}>
                {value}
            </span>
        </div>
    );
}
