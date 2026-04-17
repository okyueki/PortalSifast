import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { getComponentsBySection } from './payroll-components';

type RawRow = Record<string, string | null>;

type Props = {
    salary: {
        id: number;
        period_start: string | null;
        simrs_nik: string;
        employee_name: string | null;
        unit: string | null;
        npwp: string | null;
        penerimaan: string | null;
        pembulatan?: string | null;
        pajak: string | null;
        zakat: string | null;
        terbilang: string | null;
        masa_kerja?: { years: number; months: number; days: number } | null;
        raw_row: RawRow;
    };
};

function parseMoney(value: string | null): number | null {
    if (!value) return null;
    const trimmed = value.toString().trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '–') return null;
    const noRp = trimmed.replace(/rp/gi, '').replace(/\s+/g, '');

    // 1.234.567 -> 1234567
    if (/^\-?\d{1,3}(\.\d{3})+$/.test(noRp)) {
        const n = Number(noRp.replace(/\./g, ''));
        return Number.isFinite(n) ? n : null;
    }

    // Fallback: keep digits, dot, comma, minus
    const cleaned = noRp.replace(/[^0-9,.\-]/g, '');
    const normalized = cleaned.replace(/,/g, '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
}

function formatIdr(value: string | null): string {
    const n = parseMoney(value);
    if (n === null) return '–';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);
}

function formatPeriod(dateString: string | null): string {
    if (!dateString) return '-';

    // Handle ISO format like "2026-02-01T00:00:00.000000Z"
    // or simple format like "2026-02-01"
    const match = dateString.match(/^(\d{4})-(\d{2})/);
    if (match) {
        const [, year, month] = match;
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    // Fallback: try direct parsing
    const d = new Date(dateString);
    if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    return dateString;
}

function val(raw: RawRow, key: string): string | null {
    return raw[key] ?? null;
}

export default function PayrollPrint({ salary }: Props) {
    const raw = salary.raw_row ?? {};

    const pendapatan = getComponentsBySection('pendapatan');
    const potongan = getComponentsBySection('potongan');

    const sumKeys = (keys: readonly { key: string }[]) =>
        keys.reduce((acc, it) => acc + (parseMoney(val(raw, it.key)) ?? 0), 0);
    const totalPendapatan = sumKeys(pendapatan);
    const totalPotongan = sumKeys(potongan);
    const bersih = parseMoney(salary.pembulatan ?? salary.penerimaan) ?? (totalPendapatan - totalPotongan);

    return (
        <div className="min-h-screen bg-slate-200/80 py-6 print:bg-white print:py-0">
            <Head title={`Slip Gaji - ${salary.employee_name ?? salary.simrs_nik}`} />

            <div className="mx-auto max-w-[820px] rounded-xl bg-white p-8 shadow-xl print:m-0 print:max-w-full print:rounded-none print:p-6 print:shadow-none">
                {/* Header ala slip */}
                <div className="flex items-start gap-4 border-b-2 border-slate-900 pb-3">
                    <div className="flex size-12 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
                        <AppLogoIcon className="size-7 text-slate-900" />
                    </div>
                    <div className="flex-1 leading-tight">
                        <div className="text-lg font-semibold tracking-wide text-slate-900">
                            RS Aisyiyah Siti Fatimah Tulangan
                        </div>
                        <div className="text-[11px] text-slate-700">
                            Jl. Raya Kenongo, No.14, Kec. Tulangan, Sidoarjo
                        </div>
                        <div className="text-[11px] text-slate-700">
                            Telp: 031 8851840 &nbsp; Email: admin@rsasitifatimah.com
                        </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-700">
                        <div className="font-semibold">Slip Gaji</div>
                        <div className="uppercase tracking-wide">
                            {formatPeriod(salary.period_start)}
                        </div>
                    </div>
                </div>

                {/* Identitas */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                        <div className="flex">
                            <span className="w-28 text-slate-600">Nama</span>
                            <span className="font-semibold text-slate-900">
                                {salary.employee_name ?? '-'}
                            </span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-600">Instalasi/Unit</span>
                            <span className="text-slate-900">{salary.unit ?? '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-600">TMK</span>
                            <span className="text-slate-900">{val(raw, 'tmk') ?? '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-600">Masa Kerja Riil</span>
                            <span className="text-slate-900">
                                {salary.masa_kerja
                                    ? `${salary.masa_kerja.years} Thn ${salary.masa_kerja.months} Bln ${salary.masa_kerja.days} Hari`
                                    : '-'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex">
                            <span className="w-28 text-slate-600">Golongan</span>
                            <span className="text-slate-900">
                                {val(raw, 'gol') ?? '-'} {val(raw, 'gol_abc') ? `(${val(raw, 'gol_abc')})` : ''}
                            </span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-600">NIK</span>
                            <span className="font-mono text-[10px] text-slate-900">
                                {salary.simrs_nik}
                            </span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-600">NPWP</span>
                            <span className="font-mono text-[10px] text-slate-900">
                                {salary.npwp ?? '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Perincian gaji: 2 kolom */}
                <div className="mt-3 border border-slate-900">
                    <div className="bg-slate-200 px-3 py-1 text-center text-[11px] font-semibold tracking-wide text-slate-900">
                        PERINCIAN GAJI
                    </div>
                    <div className="grid grid-cols-2">
                        {/* Pendapatan */}
                        <div className="border-r border-slate-900">
                            <div className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-900">
                                Pendapatan
                            </div>
                            <table className="w-full border-collapse text-[11px]">
                                <tbody>
                                    {pendapatan.map((it) => (
                                        <tr key={it.key} className="border-t border-slate-200">
                                            <td className="px-3 py-1 text-slate-800">
                                                {it.label}
                                            </td>
                                            <td className="px-3 py-1 text-right font-mono text-[10px] text-slate-900">
                                                {formatIdr(val(raw, it.key))}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-900 bg-slate-50">
                                        <td className="px-3 py-1 font-semibold text-slate-900">
                                            Jumlah Pendapatan
                                        </td>
                                        <td className="px-3 py-1 text-right font-mono text-[10px] font-semibold text-slate-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPendapatan)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Potongan */}
                        <div>
                            <div className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-900">
                                Potongan-potongan
                            </div>
                            <table className="w-full border-collapse text-[11px]">
                                <tbody>
                                    {potongan.map((it) => (
                                        <tr key={it.key} className="border-t border-slate-200">
                                            <td className="px-3 py-1 text-slate-800">
                                                {it.label}
                                            </td>
                                            <td className="px-3 py-1 text-right font-mono text-[10px] text-slate-900">
                                                {formatIdr(val(raw, it.key))}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-slate-900 bg-slate-50">
                                        <td className="px-3 py-1 font-semibold text-slate-900">
                                            Jumlah Potongan
                                        </td>
                                        <td className="px-3 py-1 text-right font-mono text-[10px] font-semibold text-slate-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPotongan)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total bersih */}
                    <div className="border-t-2 border-slate-900 bg-slate-100 px-3 py-2 text-[11px]">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                                Jumlah Gaji Bersih
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-slate-900">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(bersih)}
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] italic text-slate-700">
                            Terbilang: {salary.terbilang ?? '-'}
                        </div>
                    </div>
                </div>

                {/* Footer tanda tangan */}
                <div className="mt-6 flex justify-between text-[11px] text-slate-700">
                    <div className="text-center">
                        <div>Mengetahui,</div>
                        <div>Bagian Keuangan</div>
                        <div className="mt-10 font-semibold">
                            ______________________
                        </div>
                    </div>
                    <div className="text-center">
                        <div>Sidoarjo, {new Date().toLocaleDateString('id-ID')}</div>
                        <div>Bendahara</div>
                        <div>&nbsp;</div>
                        <div className="mt-10 font-semibold">
                            ______________________
                        </div>
                    </div>
                </div>

                {/* Tombol print (hanya di layar) */}
                <div className="mt-6 flex justify-end print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                    >
                        <Printer className="h-4 w-4" />
                        Print / Simpan sebagai PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

