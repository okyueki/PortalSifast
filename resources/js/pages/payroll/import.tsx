import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle, History, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
    { title: 'Impor Gaji (CSV)', href: '/payroll/import' },
];

type Warning = {
    nik: string;
    nama: string | null;
    issues: string[];
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
        warnings?: Warning[];
    };
};

export default function PayrollImport() {
    const { flash } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        period: '',
        file: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/payroll/import', {
            forceFormData: true,
        });
    };

    const warnings = flash?.warnings ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Impor Gaji (CSV)" />

            <div className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/payroll" aria-label="Kembali ke payroll">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Impor Gaji (CSV)</h1>
                        <p className="text-sm text-muted-foreground">
                            Upload file CSV gaji untuk disimpan ke database. Periode wajib format YYYY-MM.
                        </p>
                    </div>
                </div>

                {flash?.success && (
                    <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 dark:text-emerald-200">Berhasil</AlertTitle>
                        <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {warnings.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 dark:text-amber-200">
                            {warnings.length} Data Perlu Perhatian
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {warnings.map((w, i) => (
                                    <div
                                        key={i}
                                        className="rounded border border-amber-200 bg-white p-2 text-sm dark:border-amber-700 dark:bg-amber-900/50"
                                    >
                                        <p className="font-medium text-amber-900 dark:text-amber-100">
                                            {w.nama ?? 'Tanpa Nama'}{' '}
                                            <span className="font-mono text-xs text-amber-600">({w.nik})</span>
                                        </p>
                                        <ul className="mt-1 list-inside list-disc text-amber-700 dark:text-amber-300">
                                            {w.issues.map((issue, j) => (
                                                <li key={j}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                Data tetap tersimpan. Silakan periksa dan perbaiki jika diperlukan.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="rounded-xl border bg-card p-6 space-y-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="period">
                                Periode (YYYY-MM)
                            </label>
                            <Input
                                id="period"
                                type="month"
                                value={data.period}
                                onChange={(e) => setData('period', e.target.value)}
                            />
                            {errors.period && <p className="text-sm text-destructive">{errors.period}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="file">
                                File CSV
                            </label>
                            <Input
                                id="file"
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                className="cursor-pointer"
                            />
                            {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing || !data.file || !data.period}>
                                <Upload className="mr-2 h-4 w-4" />
                                {processing ? 'Mengimpor...' : 'Impor'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/payroll">Lihat Data</Link>
                            </Button>
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/payroll/import-history">
                                    <History className="mr-2 h-4 w-4" />
                                    Riwayat
                                </Link>
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                    <h3 className="font-medium mb-2">Validasi Otomatis</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Saat import, sistem akan mendeteksi anomali:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Nama pegawai kosong</li>
                        <li>Penerimaan = 0</li>
                        <li>Penerimaan jauh di bawah rata-rata (&lt;30%)</li>
                        <li>Penerimaan jauh di atas rata-rata (&gt;250%)</li>
                        <li>Pajak &gt; 50% dari penerimaan</li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
