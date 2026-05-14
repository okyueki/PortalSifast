import { Head, Link } from '@inertiajs/react';
import { Building2, ChevronRight, Layers, ListChecks, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Unit kerja', href: '/simmutu/unit-kerja' },
];

type UnitRow = {
    dep_id: string;
    nama: string;
    indicators_total: number;
    indicators_active: number;
    categories_total: number;
    entries_total: number;
};

type Props = {
    units: UnitRow[];
    summary: {
        units_shown: number;
        entries_total: number;
        indicators_mapped_distinct: number;
    };
    restricted?: boolean;
};

function depHref(depId: string): string {
    return `/simmutu/unit-kerja/${encodeURIComponent(depId)}`;
}

export default function SimmutuUnitKerjaIndex({ units, summary, restricted }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Unit kerja — SIMMUTU" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 pb-10">
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-sky-500/[0.05] shadow-sm">
                    <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative flex flex-col gap-3 p-6">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
                            <Sparkles className="size-3.5" />
                            Pemetaan mutu per unit (SIMRS)
                        </div>
                        <Heading
                            title="Unit kerja"
                            description="Daftar unit dari master departemen SIMRS. Klik unit untuk melihat kategori mutu yang terpetakan, lalu drill-down ke profil indikator dan status aktif."
                        />
                        {restricted && (
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Anda melihat pemantauan untuk unit kerja Anda saja. Pengelola mutu dapat melihat semua unit.
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Unit ditampilkan</p>
                                <p className="text-2xl font-semibold tabular-nums">{summary.units_shown}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10">
                                <Layers className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Indikator terpetakan (unik)</p>
                                <p className="text-2xl font-semibold tabular-nums">{summary.indicators_mapped_distinct}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                                <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Entri realisasi (unit terpilih)</p>
                                <p className="text-2xl font-semibold tabular-nums">{summary.entries_total}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {units.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {restricted
                                ? 'Akun Anda belum memiliki dep_id unit kerja, atau belum ada data pemetaan mutu.'
                                : 'Tidak ada departemen di master SIMRS, atau koneksi database SIMRS belum tersedia.'}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {units.map((u) => (
                            <Link
                                key={u.dep_id}
                                href={depHref(u.dep_id)}
                                className="group rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {u.dep_id}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold leading-snug">{u.nama}</p>
                                    </div>
                                    <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                                </div>
                                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                                        <dt className="text-xs text-muted-foreground">Kategori</dt>
                                        <dd className="font-semibold tabular-nums">{u.categories_total}</dd>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                                        <dt className="text-xs text-muted-foreground">Profil (aktif / total)</dt>
                                        <dd className="font-semibold tabular-nums">
                                            {u.indicators_active} / {u.indicators_total}
                                        </dd>
                                    </div>
                                    <div className="col-span-2 rounded-lg bg-muted/50 px-2 py-1.5">
                                        <dt className="text-xs text-muted-foreground">Entri realisasi</dt>
                                        <dd className="font-semibold tabular-nums">{u.entries_total}</dd>
                                    </div>
                                </dl>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/simmutu/recap/departments">Rekap per departemen</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/simmutu/realisations">Rekap mutu</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
