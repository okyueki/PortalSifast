import { Head, Link } from '@inertiajs/react';
import { ChevronRight, FolderTree, ListChecks } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Dep = { dep_id: string; nama: string };

type CategoryRow = {
    id: number;
    name: string;
    short_name: string | null;
    is_active: boolean;
    indicators_mapped: number;
    indicators_active_mapped: number;
};

type Props = {
    dep: Dep;
    categories: CategoryRow[];
    summary: {
        categories_count: number;
        entries_total: number;
    };
};

function depHref(depId: string): string {
    return `/simmutu/unit-kerja/${encodeURIComponent(depId)}`;
}

function categoryHref(depId: string, categoryId: number): string {
    return `/simmutu/unit-kerja/${encodeURIComponent(depId)}/kategori/${categoryId}`;
}

export default function SimmutuUnitKerjaShow({ dep, categories, summary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'SIMMUTU', href: '/simmutu' },
        { title: 'Unit kerja', href: '/simmutu/unit-kerja' },
        { title: dep.nama, href: depHref(dep.dep_id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${dep.nama} — Unit kerja`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 pb-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="font-mono text-xs text-muted-foreground">{dep.dep_id}</p>
                        <Heading
                            title={dep.nama}
                            description="Kategori mutu yang memiliki minimal satu profil indikator terpetakan ke unit ini. Kategori untuk membuka daftar profil."
                        />
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/simmutu/unit-kerja">Kembali ke daftar unit</Link>
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FolderTree className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Kategori terpetakan</p>
                                <p className="text-xl font-semibold tabular-nums">{summary.categories_count}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total entri realisasi (unit)</p>
                                <p className="text-xl font-semibold tabular-nums">{summary.entries_total}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {categories.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Belum ada kategori mutu dengan indikator terpetakan ke unit ini.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">Kategori mutu</h2>
                        <div className="divide-y overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                            {categories.map((c) => (
                                <Link
                                    key={c.id}
                                    href={categoryHref(dep.dep_id, c.id)}
                                    className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-muted/40"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium">{c.name}</span>
                                            <Badge variant={c.is_active ? 'default' : 'secondary'}>
                                                Kategori {c.is_active ? 'aktif' : 'nonaktif'}
                                            </Badge>
                                        </div>
                                        {c.short_name && (
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.short_name}</p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Profil terpetakan:{' '}
                                            <span className="font-mono font-medium text-foreground">
                                                {c.indicators_active_mapped} aktif
                                            </span>{' '}
                                            /{' '}
                                            <span className="font-mono font-medium text-foreground">{c.indicators_mapped}</span>{' '}
                                            total
                                        </p>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
