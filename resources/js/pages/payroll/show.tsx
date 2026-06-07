import { Fragment } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Printer, Trash2, XCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    SLIP_SECTIONS,
    computeSlipTotals,
    formatIdrValue,
    parseMoney,
    resolveLineLabel,
    type SlipLineDef,
} from '@/pages/payroll/payroll-slip-structure';
import type { BreadcrumbItem } from '@/types';

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

type CsvVerificationRow = {
    csv_key: string;
    csv_label: string;
    csv_value: string | null;
    db_key: string;
    db_value: string | null;
    match: boolean;
};

type Props = {
    salary: SalaryData;
    csv_verification: CsvVerificationRow[];
};

function formatIdr(value: string | null | undefined): string {
    const n = parseMoney(value);
    if (n === null || n === 0) {
        return '-';
    }

    return formatIdrValue(n);
}

function SlipLineRow({ line, salary, indent = false }: { line: SlipLineDef; salary: SalaryData; indent?: boolean }) {
    return (
        <tr className="border-b border-slate-100">
            <td className={`py-1 ${indent ? 'pl-4 text-muted-foreground' : ''}`}>{resolveLineLabel(line, salary)}</td>
            <td className="py-1 text-right font-mono">{formatIdr(salary[line.key as keyof SalaryData] as string | null)}</td>
        </tr>
    );
}

export default function PayrollShow({ salary, csv_verification }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Payroll', href: '/payroll' },
        {
            title: salary.employee_name ?? salary.simrs_nik,
            href: `/payroll/${salary.id}`,
        },
    ];

    const totals = computeSlipTotals(salary);
    const pendapatanSections = SLIP_SECTIONS.filter((s) => s.number !== '4');
    const potonganSection = SLIP_SECTIONS.find((s) => s.number === '4');
    const mismatchCount = csv_verification.filter((row) => !row.match).length;

    const form = useForm({
        simrs_nik: salary.simrs_nik,
        employee_name: salary.employee_name ?? '',
        unit: salary.unit ?? '',
        npwp: salary.npwp ?? '',
        penerimaan: salary.penerimaan ?? '',
        pajak: salary.pajak ?? '',
        zakat: salary.zakat ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(`/payroll/${salary.id}`);
    };

    const handleDelete = () => {
        if (!confirm('Yakin ingin menghapus data gaji ini?')) {
            return;
        }

        form.delete(`/payroll/${salary.id}`, {
            onSuccess: () => router.visit('/payroll'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Gaji - ${salary.employee_name ?? salary.simrs_nik}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/payroll">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title={salary.employee_name ?? salary.simrs_nik}
                        description="Rincian gaji sesuai struktur slip resmi."
                    />
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/payroll/${salary.id}/print`} target="_blank">
                                <Printer className="mr-2 h-4 w-4" />
                                Preview Slip
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr,2fr]">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Info Karyawan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">NIK</dt>
                                    <dd className="font-mono text-xs">{salary.simrs_nik}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Unit</dt>
                                    <dd>{salary.unit ?? '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">NPWP</dt>
                                    <dd className="font-mono text-xs">{salary.npwp ?? '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Periode</dt>
                                    <dd className="text-xs">{salary.period_start ?? '-'}</dd>
                                </div>
                                {salary.masa_kerja && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Masa Kerja</dt>
                                        <dd className="text-xs">
                                            {salary.masa_kerja.years} Thn {salary.masa_kerja.months} Bln
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            <div className="mt-4 border-t pt-4">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Penerimaan</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.penerimaan}
                                            onChange={(e) => form.setData('penerimaan', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Pajak</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.pajak}
                                            onChange={(e) => form.setData('pajak', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Zakat</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.zakat}
                                            onChange={(e) => form.setData('zakat', e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" size="sm" disabled={form.processing}>
                                        Simpan
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Komponen Gaji</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border bg-green-50/50">
                                    <div className="border-b bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">
                                        PENDAPATAN
                                    </div>
                                    <div className="p-2 text-xs">
                                        <table className="w-full">
                                            <tbody>
                                                {pendapatanSections.map((section) => (
                                                    <Fragment key={section.number}>
                                                        <tr className="border-b bg-slate-50 font-medium">
                                                            <td className="py-1" colSpan={2}>
                                                                {section.number}. {section.title}
                                                            </td>
                                                        </tr>
                                                        {section.lines.map((line) => (
                                                            <SlipLineRow
                                                                key={`${section.number}-${line.key}`}
                                                                line={line}
                                                                salary={salary}
                                                                indent={section.number !== '1'}
                                                            />
                                                        ))}
                                                    </Fragment>
                                                ))}
                                                <tr className="border-b-2 border-slate-300 bg-blue-50 font-semibold">
                                                    <td className="py-1">Jumlah Tunjangan</td>
                                                    <td className="py-1 text-right font-mono">
                                                        {formatIdrValue(totals.tunjanganTotal)}
                                                    </td>
                                                </tr>
                                                <tr className="bg-green-100 font-bold">
                                                    <td className="py-1">Jumlah Gaji</td>
                                                    <td className="py-1 text-right font-mono">
                                                        {formatIdrValue(totals.totalPendapatan)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-red-50/50">
                                    <div className="border-b bg-red-100 px-3 py-2 text-xs font-semibold text-red-800">
                                        POTONGAN
                                    </div>
                                    <div className="p-2 text-xs">
                                        <table className="w-full">
                                            <tbody>
                                                {potonganSection && (
                                                    <>
                                                        <tr className="border-b bg-slate-50 font-medium">
                                                            <td className="py-1" colSpan={2}>
                                                                {potonganSection.number}. {potonganSection.title}
                                                            </td>
                                                        </tr>
                                                        {potonganSection.lines.map((line) => (
                                                            <SlipLineRow
                                                                key={line.key}
                                                                line={line}
                                                                salary={salary}
                                                                indent
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                                <tr className="border-b-2 border-slate-300 bg-red-100 font-semibold">
                                                    <td className="py-1">Jumlah Potongan</td>
                                                    <td className="py-1 text-right font-mono">
                                                        {formatIdrValue(totals.totalPotongan)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-3 text-white">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">GAJI BERSIH (DITERIMA)</span>
                                    <span className="font-mono text-lg font-bold">{formatIdrValue(totals.gajiBersih)}</span>
                                </div>
                                <p className="mt-1 text-xs italic text-slate-300">
                                    Terbilang: {salary.denominados ?? '–'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {csv_verification.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Verifikasi CSV vs Database
                                {mismatchCount > 0 ? (
                                    <span className="ml-2 text-xs font-normal text-red-600">
                                        ({mismatchCount} tidak cocok — jalankan{' '}
                                        <code className="rounded bg-muted px-1">php artisan payroll:reprocess-from-raw</code>)
                                    </span>
                                ) : (
                                    <span className="ml-2 text-xs font-normal text-green-600">(semua cocok)</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-3">Komponen</th>
                                            <th className="py-2 pr-3">Kolom CSV</th>
                                            <th className="py-2 pr-3 text-right">Nilai CSV</th>
                                            <th className="py-2 pr-3 text-right">Nilai DB</th>
                                            <th className="py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csv_verification.map((row) => (
                                            <tr key={`${row.csv_key}-${row.db_key}`} className="border-b border-slate-100">
                                                <td className="py-1.5 pr-3">{row.csv_label}</td>
                                                <td className="py-1.5 pr-3 font-mono text-[10px] text-muted-foreground">
                                                    {row.csv_key}
                                                </td>
                                                <td className="py-1.5 pr-3 text-right font-mono">
                                                    {row.csv_value ? formatIdrValue(Number(row.csv_value)) : '-'}
                                                </td>
                                                <td className="py-1.5 pr-3 text-right font-mono">
                                                    {row.db_value ? formatIdrValue(Number(row.db_value)) : '-'}
                                                </td>
                                                <td className="py-1.5 text-center">
                                                    {row.match ? (
                                                        <CheckCircle2 className="mx-auto size-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="mx-auto size-4 text-red-600" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
