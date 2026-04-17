import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarIcon,
    FileSpreadsheet,
    Printer,
    Trash2,
    User2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
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

function formatCurrency(value: string | null): string {
    if (!value) return '–';
    const num = Number(value);
    if (Number.isNaN(num)) return value;

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
}

function parseMoney(value: string | null): number | null {
    if (!value) return null;
    const trimmed = value.toString().trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '–') return null;
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

function formatIdr(value: string | null): string {
    const n = parseMoney(value);
    if (n === null) return '–';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);
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

    const entries = Object.entries(salary.raw_row ?? {});
    const [showRaw, setShowRaw] = useState(false);

    const raw = salary.raw_row ?? {};
    const pendapatan = useMemo(
        () => getComponentsBySection('pendapatan'),
        []
    );
    const potongan = useMemo(
        () => getComponentsBySection('potongan'),
        []
    );

    const sumComponents = (items: { key: string }[]) =>
        items.reduce((acc, it) => acc + (parseMoney(raw[it.key] ?? null) ?? 0), 0);

    const totalPendapatan = sumComponents(pendapatan);
    const totalPotongan = sumComponents(potongan);
    const bersih =
        parseMoney(salary.pembulatan ?? salary.penerimaan) ??
        (totalPendapatan - totalPotongan);

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
            onSuccess: () => {
                router.visit('/payroll');
            },
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
                        description="Rincian gaji sesuai file impor (apa adanya dari CSV)."
                    />
                    <div className="ml-auto flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            asChild
                        >
                            <Link href={`/payroll/${salary.id}/print`} target="_blank">
                                <Printer className="mr-2 h-4 w-4" />
                                Preview Slip
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            type="button"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ringkasan & Edit
                            </CardTitle>
                            <User2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        NIK
                                    </label>
                                    <input
                                        className="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs"
                                        value={form.data.simrs_nik}
                                        onChange={(e) =>
                                            form.setData('simrs_nik', e.target.value)
                                        }
                                    />
                                    {form.errors.simrs_nik && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.simrs_nik}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Nama
                                    </label>
                                    <input
                                        className="w-full rounded-md border bg-background px-2 py-1"
                                        value={form.data.employee_name}
                                        onChange={(e) =>
                                            form.setData('employee_name', e.target.value)
                                        }
                                    />
                                    {form.errors.employee_name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.employee_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Unit
                                    </label>
                                    <input
                                        className="w-full rounded-md border bg-background px-2 py-1"
                                        value={form.data.unit}
                                        onChange={(e) =>
                                            form.setData('unit', e.target.value)
                                        }
                                    />
                                    {form.errors.unit && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.unit}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        NPWP
                                    </label>
                                    <input
                                        className="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs"
                                        value={form.data.npwp}
                                        onChange={(e) =>
                                            form.setData('npwp', e.target.value)
                                        }
                                    />
                                    {form.errors.npwp && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.npwp}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Periode
                                    </label>
                                    <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                                        <CalendarIcon className="h-3 w-3" />
                                        <span>{salary.period_start ?? '–'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Masa Kerja Riil
                                    </label>
                                    <p className="rounded-md bg-muted/40 px-2 py-1 text-xs text-slate-700">
                                        {salary.masa_kerja
                                            ? `${salary.masa_kerja.years} Thn ${salary.masa_kerja.months} Bln ${salary.masa_kerja.days} Hari`
                                            : '–'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Terbilang
                                    </label>
                                    <p className="rounded-md bg-muted/40 px-2 py-1 text-xs italic text-slate-700">
                                        {salary.terbilang ?? '–'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Penerimaan
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.penerimaan}
                                            onChange={(e) =>
                                                form.setData('penerimaan', e.target.value)
                                            }
                                        />
                                        {form.errors.penerimaan && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.penerimaan}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Pajak
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.pajak}
                                            onChange={(e) =>
                                                form.setData('pajak', e.target.value)
                                            }
                                        />
                                        {form.errors.pajak && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.pajak}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Zakat
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-md border bg-background px-2 py-1 text-right"
                                            value={form.data.zakat}
                                            onChange={(e) =>
                                                form.setData('zakat', e.target.value)
                                            }
                                        />
                                        {form.errors.zakat && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.zakat}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button type="submit" size="sm" disabled={form.processing}>
                                        Simpan Perubahan
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Komponen Gaji
                            </CardTitle>
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border bg-muted/20">
                                    <div className="border-b bg-muted/30 px-3 py-2 text-xs font-semibold">
                                        Pendapatan
                                    </div>
                                    <div className="p-2">
                                        <table className="w-full text-xs">
                                            <tbody>
                                                {pendapatan.map((it) => (
                                                    <tr key={it.key} className="border-b last:border-0">
                                                        <td className="py-1 pr-2 text-muted-foreground">
                                                            {it.label}
                                                        </td>
                                                        <td className="py-1 text-right font-mono text-[11px]">
                                                            {formatIdr(raw[it.key] ?? null)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs font-semibold">
                                        <span>Jumlah Pendapatan</span>
                                        <span className="font-mono text-[11px]">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                maximumFractionDigits: 0,
                                            }).format(totalPendapatan)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20">
                                    <div className="border-b bg-muted/30 px-3 py-2 text-xs font-semibold">
                                        Potongan
                                    </div>
                                    <div className="p-2">
                                        <table className="w-full text-xs">
                                            <tbody>
                                                {potongan.map((it) => (
                                                    <tr key={it.key} className="border-b last:border-0">
                                                        <td className="py-1 pr-2 text-muted-foreground">
                                                            {it.label}
                                                        </td>
                                                        <td className="py-1 text-right font-mono text-[11px]">
                                                            {formatIdr(raw[it.key] ?? null)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs font-semibold">
                                        <span>Jumlah Potongan</span>
                                        <span className="font-mono text-[11px]">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                maximumFractionDigits: 0,
                                            }).format(totalPotongan)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-lg border bg-muted/10 px-3 py-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Gaji Bersih</span>
                                    <span className="font-mono text-[12px] font-semibold">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            maximumFractionDigits: 0,
                                        }).format(bersih)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                    Terbilang: {salary.terbilang ?? '–'}
                                </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRaw((v) => !v)}
                                >
                                    {showRaw ? 'Sembunyikan raw' : 'Lihat semua kolom (raw)'}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Raw cocok untuk audit ketika ada perbedaan angka.
                                </span>
                            </div>

                            {showRaw && (
                                <div className="mt-3">
                                    {entries.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Tidak ada data rincian (raw_row kosong).
                                        </p>
                                    ) : (
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                                            {entries.map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="rounded-md border bg-muted/40 px-3 py-2"
                                                >
                                                    <dt className="text-xs font-medium text-muted-foreground">
                                                        {key}
                                                    </dt>
                                                    <dd className="mt-1 break-words">
                                                        {value === null || value === ''
                                                            ? '–'
                                                            : value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

