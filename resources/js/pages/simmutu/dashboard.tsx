import { Head, Link } from '@inertiajs/react';
import { BarChart3, FolderTree, ListChecks } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
];

type RecentRow = {
    id: number;
    period_anchor: string;
    achievement_percent: number | null;
    dep_id: string;
    indicator_title: string | null;
    category_name: string | null;
    input_by_name: string | null;
    created_at: string | null;
};

type Props = {
    counts: { categories: number; indicators: number };
    recentRealisations: RecentRow[];
};

export default function SimmutuDashboard({ counts, recentRealisations }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SIMMUTU" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="SIMMUTU"
                        description="Ringkasan kategori, indikator, dan realisasi mutu terbaru."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/simmutu/realisations">Rekap Mutu</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/simmutu/realisations/create">Input realisasi</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/simmutu/unit-kerja">Unit kerja</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FolderTree className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Kategori aktif</p>
                                <p className="text-2xl font-semibold">{counts.categories}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Indikator aktif</p>
                                <p className="text-2xl font-semibold">{counts.indicators}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <ListChecks className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Rekap (cuplikan)</p>
                                <p className="text-2xl font-semibold">{recentRealisations.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Entri rekap terbaru</h2>
                        <p className="text-xs text-muted-foreground">
                            Menyesuaikan departemen Anda jika Anda bukan pengelola mutu.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-2 font-medium">Periode</th>
                                    <th className="px-4 py-2 font-medium">Indikator</th>
                                    <th className="px-4 py-2 font-medium">Dep</th>
                                    <th className="px-4 py-2 font-medium">Capaian %</th>
                                    <th className="px-4 py-2 font-medium">Input oleh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRealisations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Belum ada realisasi.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRealisations.map((r) => (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-2 font-mono text-xs">{r.period_anchor}</td>
                                            <td className="px-4 py-2">
                                                <span className="font-medium">{r.indicator_title ?? '–'}</span>
                                                {r.category_name && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {r.category_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs">{r.dep_id}</td>
                                            <td className="px-4 py-2">
                                                {r.achievement_percent !== null
                                                    ? `${r.achievement_percent.toFixed(2)}%`
                                                    : '–'}
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {r.input_by_name ?? '–'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
