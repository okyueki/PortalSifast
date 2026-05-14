import { Head, Link, usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

type Dep = { dep_id: string; nama: string };

type Category = {
    id: number;
    name: string;
    short_name: string | null;
    is_active: boolean;
};

type IndicatorRow = {
    id: number;
    title: string;
    is_active: boolean;
    collection_frequency: string;
    collection_frequency_label: string;
    target_value: number | null;
    has_mutu_benchmarking: boolean;
    entries_count: number;
    last_entry_at: string | null;
};

type Props = {
    dep: Dep;
    category: Category;
    indicators: IndicatorRow[];
    summary: {
        indicators_count: number;
        active_count: number;
        inactive_count: number;
        entries_total: number;
    };
};

function depHref(depId: string): string {
    return `/simmutu/unit-kerja/${encodeURIComponent(depId)}`;
}

function formatPlain(value: number): string {
    return value.toFixed(4).replace(/\.?0+$/, '');
}

export default function SimmutuUnitKerjaCategory({ dep, category, indicators, summary }: Props) {
    const page = usePage<SharedData>();
    const canManage = page.props.permissions?.simmutu?.can_manage ?? false;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'SIMMUTU', href: '/simmutu' },
        { title: 'Unit kerja', href: '/simmutu/unit-kerja' },
        { title: dep.nama, href: depHref(dep.dep_id) },
        { title: category.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${category.name} — ${dep.nama}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 pb-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            <Link href={depHref(dep.dep_id)} className="hover:underline">
                                {dep.nama}
                            </Link>{' '}
                            · {dep.dep_id}
                        </p>
                        <Heading title={category.name} description="Profil indikator mutu yang terpetakan ke unit ini beserta status aktif dan ringkasan entri realisasi." />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                Kategori {category.is_active ? 'aktif' : 'nonaktif'}
                            </Badge>
                            {category.short_name && (
                                <Badge variant="outline" className="font-normal">
                                    {category.short_name}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={depHref(dep.dep_id)}>Kembali ke kategori</Link>
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Profil terpetakan</p>
                            <p className="text-2xl font-semibold tabular-nums">{summary.indicators_count}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Aktif</p>
                            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {summary.active_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Nonaktif</p>
                            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{summary.inactive_count}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Entri realisasi (kategori · unit)</p>
                            <p className="text-2xl font-semibold tabular-nums">{summary.entries_total}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Profil indikator
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Frekuensi
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Target
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Benchmark
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Entri
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Terakhir
                                    </th>
                                    {canManage && (
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {indicators.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 8 : 7} className="px-4 py-10 text-center text-muted-foreground">
                                            Tidak ada profil untuk kombinasi unit dan kategori ini.
                                        </td>
                                    </tr>
                                ) : (
                                    indicators.map((row) => (
                                        <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{row.title}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={row.is_active ? 'default' : 'secondary'}>
                                                    {row.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{row.collection_frequency_label}</td>
                                            <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                                                {row.target_value !== null ? `${formatPlain(row.target_value)}` : '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.has_mutu_benchmarking ? (
                                                    <Badge variant="outline">Ya</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">–</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums">{row.entries_count}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {row.last_entry_at
                                                    ? new Date(row.last_entry_at).toLocaleString('id-ID', {
                                                          dateStyle: 'short',
                                                          timeStyle: 'short',
                                                      })
                                                    : '–'}
                                            </td>
                                            {canManage && (
                                                <td className="px-4 py-3">
                                                    <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                                                        <Link href={`/simmutu/indicators/${row.id}/edit`}>
                                                            <Pencil className="size-4" />
                                                            <span className="sr-only">Edit profil</span>
                                                        </Link>
                                                    </Button>
                                                </td>
                                            )}
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
