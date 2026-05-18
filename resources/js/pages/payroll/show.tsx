import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Printer,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
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
    // Komponen
    gaji_pokok: string | null;
    keluarga: string | null;
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
    umum: string | null;
    jkn_susulan: string | null;
    jkn_susulan_l: string | null;
    // Potongan
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
    // Totals from CSV
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
    if (n === null || n === 0) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);
}

function getValue(salary: SalaryData, key: keyof SalaryData): number {
    return parseMoney(salary[key] as string | null) ?? 0;
}

export default function PayrollShow({ salary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Payroll', href: '/payroll' },
        {
            title: salary.employee_name ?? salary.simrs_nik,
            href: `/payroll/${salary.id}`,
        },
    ];

    // Get values
    const gp = getValue(salary, 'gaji_pokok');
    const keluarga = getValue(salary, 'keluarga');
    const fungsional = getValue(salary, 'fungsional');
    const struktural = getValue(salary, 'struktural');
    const operasional = getValue(salary, 'operasional');
    const bpjsTk = getValue(salary, 'tunj_bpjs_tk');
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
    const potBpjsTk = getValue(salary, 'pot_bpjs_tk');
    const potBpjsKes = getValue(salary, 'bpjs_kes_k');
    const jhtI = getValue(salary, 'jht_i');
    const jpI = getValue(salary, 'jp_i');
    const bpjsKesI = getValue(salary, 'bpjs_kes_i');
    const bpjsTdak = getValue(salary, 'bpjs_kes_tidak_ditanggung');
    const matan = getValue(salary, 'matan');
    const lazismu = getValue(salary, 'lazismu');
    const obat2an = getValue(salary, 'obat2an');
    const hutangBpjs = getValue(salary, 'hutang_bpjs');
    const hutangSeragam = getValue(salary, 'hutang_seragam');
    const ikkm = getValue(salary, 'ikkm');
    const lainPot = getValue(salary, 'lain_pot');
    // BPJS TK Perusahaan (tunjangan)
    const jkk = getValue(salary, 'jkk');
    const jkm = getValue(salary, 'jkm');
    const jht = getValue(salary, 'jht');
    const jp = getValue(salary, 'jp');

    // Ambil TOTAL dari CSV langsung
    const jumlahCsv = salary.jumlah ? parseMoney(salary.jumlah) : null;
    const jumlahPotCsv = (salary as any).jumlah_pot ? parseMoney((salary as any).jumlah_pot) : null;
    const gajiBersihCsv = salary.pembulatan ? parseMoney(salary.pembulatan) : (salary.penerimaan ? parseMoney(salary.penerimaan) : null);

    // Total dari CSV langsung (lebih akurat)
    const totalPendapatan = jumlahCsv ?? 0;
    const totalPotongan = jumlahPotCsv ?? 0;
    const gajiBersih = gajiBersihCsv ?? (totalPendapatan - totalPotongan);

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
        if (!confirm('Yakin ingin menghapus data gaji ini?')) return;
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
                        description="Rincian gaji sesuai file impor."
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
                    {/* Info Karyawan */}
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
                                        <dd className="text-xs">{salary.masa_kerja.years} Thn {salary.masa_kerja.months} Bln</dd>
                                    </div>
                                )}
                            </dl>

                            <div className="mt-4 border-t pt-4">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Penerimaan</label>
                                        <input type="number" min={0} className="w-full rounded-md border bg-background px-2 py-1 text-right" value={form.data.penerimaan} onChange={(e) => form.setData('penerimaan', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Pajak</label>
                                        <input type="number" min={0} className="w-full rounded-md border bg-background px-2 py-1 text-right" value={form.data.pajak} onChange={(e) => form.setData('pajak', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Zakat</label>
                                        <input type="number" min={0} className="w-full rounded-md border bg-background px-2 py-1 text-right" value={form.data.zakat} onChange={(e) => form.setData('zakat', e.target.value)} />
                                    </div>
                                    <Button type="submit" size="sm" disabled={form.processing}>Simpan</Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Komponen Gaji */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Komponen Gaji</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {/* PENDAPATAN */}
                                <div className="rounded-lg border bg-green-50/50">
                                    <div className="border-b bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">PENDAPATAN</div>
                                    <div className="p-2 text-xs">
                                        <table className="w-full">
                                            <tbody>
                                                <tr className="border-b bg-slate-100 font-medium">
                                                    <td className="py-1">1. Gaji Pokok</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.gaji_pokok)}</td>
                                                </tr>
                                                <tr className="border-b font-medium bg-slate-50">
                                                    <td className="py-1 pl-2" colSpan={2}>2. Tunjangan</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Keluarga</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.keluarga)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Fungsional</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.fungsional)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Struktural</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.struktural)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Operasional</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.operasional)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">BPJS Ketenagakerjaan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.tunj_bpjs_tk)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">BPJS Kesehatan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.bpjs_kes)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Transport/SPJ</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.transport_spj)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Jasa Medis Dokter</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jm_dokter)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Lain-lain</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.lain_lain)}</td>
                                                </tr>
                                                <tr className="border-b font-medium bg-slate-50">
                                                    <td className="py-1 pl-2" colSpan={2}>3. Lain-Lain</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Lembur</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.lembur)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">On Call</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.on_call)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Remunerasi JKN Feb 2026</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jkn)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Remunerasi Umum Mar 2026</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.umum)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Remunerasi JKN Susulan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jkn_susulan)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-4 text-muted-foreground">Remunerasi JKN Susulan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jkn_susulan_l)}</td>
                                                </tr>
                                                <tr className="border-b-2 border-slate-300 bg-blue-50 font-semibold">
                                                    <td className="py-1">Jumlah Tunjangan</td>
                                                    <td className="py-1 text-right font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tunjanganLain)}</td>
                                                </tr>
                                                <tr className="bg-green-100 font-bold">
                                                    <td className="py-1">Jumlah Gaji</td>
                                                    <td className="py-1 text-right font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPendapatan)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* POTONGAN */}
                                <div className="rounded-lg border bg-red-50/50">
                                    <div className="border-b bg-red-100 px-3 py-2 text-xs font-semibold text-red-800">POTONGAN</div>
                                    <div className="p-2 text-xs">
                                        <table className="w-full">
                                            <tbody>
                                                <tr className="border-b font-medium bg-slate-50">
                                                    <td className="py-1" colSpan={2}>4. Potongan-Potongan</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Zakat</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.zakat)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Pajak</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.pajak)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">BPJS Ketenagakerjaan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.pot_bpjs_tk)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">BPJS Kesehatan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.bpjs_kes_k)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Jaminan Hari Tua</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jht_i)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Jaminan Pensiun</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.jp_i)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">BPJS Kesehatan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.bpjs_kes_i)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">BPJS Kes tdk di tgg</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.bpjs_kes_tidak_ditanggung)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Matan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.matan)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Lazismu</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.lazismu)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Obat/Jasmed/Tindakan</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.obat2an)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Hutang BPJS</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.hutang_bpjs)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Hutang Seragam</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.hutang_seragam)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">IKKM</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.ikkm)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-1 pl-2 text-muted-foreground">Lain-lain</td>
                                                    <td className="py-1 text-right font-mono">{formatIdr(salary.lain_pot)}</td>
                                                </tr>
                                                <tr className="border-b-2 border-slate-300 bg-red-100 font-semibold">
                                                    <td className="py-1">Jumlah Potongan</td>
                                                    <td className="py-1 text-right font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPotongan)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Gaji Bersih */}
                            <div className="mt-4 rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-3 text-white">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">GAJI BERSIH (DITERIMA)</span>
                                    <span className="font-mono text-lg font-bold">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            maximumFractionDigits: 0,
                                        }).format(gajiBersih)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs italic text-slate-300">
                                    Terbilang: {salary.denominados ?? '–'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}