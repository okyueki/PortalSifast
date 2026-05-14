import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, ClipboardList, Layers, Plus, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Rekap Mutu', href: '/simmutu/realisations' },
];

type Row = {
    id: number;
    period_anchor: string;
    dep_id: string;
    numerator_value: string;
    denominator_value: string;
    achievement_percent: string | null;
    indicator: { title: string; mutu_category: { name: string } | null } | null;
    input_user: { name: string } | null;
    created_at: string | null;
};

type Paginated = {
    data: Row[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type FilterIndicator = { id: number; title: string };

type RecapStats = {
    total_entries: number;
    avg_achievement_percent: number | null;
    unique_indicator_count: number;
};

type Props = {
    realisations: Paginated;
    indicatorOptions: FilterIndicator[];
    depOptions: string[];
    recapStats: RecapStats;
    filters: {
        mutu_indicator_id?: string | number;
        dep_id?: string;
        month?: string;
        period_anchor?: string;
    };
};

function formatPlain(value: string | number): string {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return numeric.toFixed(4).replace(/\.?0+$/, '');
}

export default function MutuRealisationsIndex({
    realisations,
    indicatorOptions,
    depOptions,
    recapStats,
    filters,
}: Props) {
    const page = usePage<SharedData>();
    const canInput = page.props.permissions?.simmutu?.can_input ?? false;

    const [filterIndicator, setFilterIndicator] = useState(
        filters.mutu_indicator_id ? String(filters.mutu_indicator_id) : '__all__',
    );
    const [filterDep, setFilterDep] = useState(filters.dep_id || '__all__');
    const [filterMonth, setFilterMonth] = useState(filters.month || '');
    const [filterPeriod, setFilterPeriod] = useState(filters.period_anchor || '');

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/simmutu/realisations',
            {
                mutu_indicator_id: filterIndicator === '__all__' ? undefined : filterIndicator,
                dep_id: filterDep === '__all__' ? undefined : filterDep,
                month: filterMonth || undefined,
                period_anchor: filterPeriod || undefined,
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekap Mutu — SIMMUTU" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 pb-10">
                {/* Hero / branding */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-emerald-500/[0.06] shadow-sm">
                    <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex max-w-2xl flex-col gap-3">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
                                <Sparkles className="size-3.5" />
                                SIMMUTU · Sistem Informasi Manajemen Mutu
                            </div>
                            <Heading
                                title="Rekap Mutu"
                                description="Ringkasan entri capaian per indikator, unit, dan periode. Gunakan filter untuk menelusuri data yang sudah diinput."
                            />
                        </div>
                        {canInput && (
                            <Button asChild className="shrink-0 shadow-md">
                                <Link href="/simmutu/realisations/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Input realisasi harian
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Ringkasan angka */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total entri (filter aktif)</p>
                                <p className="text-2xl font-semibold tabular-nums">{recapStats.total_entries}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Rata-rata capaian (%)</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {recapStats.avg_achievement_percent !== null
                                        ? `${formatPlain(recapStats.avg_achievement_percent)}%`
                                        : '–'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                                <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Indikator unik terwakili</p>
                                <p className="text-2xl font-semibold tabular-nums">{recapStats.unique_indicator_count}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <form
                    onSubmit={applyFilters}
                    className="grid gap-4 rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur-sm md:grid-cols-2 lg:grid-cols-6"
                >
                    <div className="grid gap-1.5 lg:col-span-2">
                        <Label className="text-xs font-medium">Indikator</Label>
                        <Select value={filterIndicator} onValueChange={setFilterIndicator}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih indikator" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Semua indikator</SelectItem>
                                {indicatorOptions.map((i) => (
                                    <SelectItem key={i.id} value={String(i.id)}>
                                        {i.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Unit</Label>
                        <Select value={filterDep} onValueChange={setFilterDep}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Semua unit</SelectItem>
                                {depOptions.map((dep) => (
                                    <SelectItem key={dep} value={dep}>
                                        {dep}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Bulan</Label>
                        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5 lg:col-span-2">
                        <Label className="text-xs font-medium">Kode periode (lanjutan)</Label>
                        <Input
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            placeholder="mis. M:2026-04 atau D:2026-04-01"
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-6">
                        <Button type="submit">Terapkan filter</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFilterIndicator('__all__');
                                setFilterDep('__all__');
                                setFilterMonth('');
                                setFilterPeriod('');
                                router.get('/simmutu/realisations');
                            }}
                        >
                            Reset
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                            <Link href="/simmutu/recap/departments" className="inline-flex items-center gap-1.5">
                                <Target className="size-4" />
                                Rekap per departemen
                            </Link>
                        </Button>
                    </div>
                </form>

                <div>
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Tabel rekap entri</h2>
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {realisations.data.length} baris pada halaman ini (maks. {realisations.per_page}{' '}
                                per halaman).
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Periode
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Indikator
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Unit
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Num / Den
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Capaian
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Penginput
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realisations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center">
                                                <p className="font-medium text-muted-foreground">Belum ada data pada filter ini.</p>
                                                {canInput && (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        Mulai dengan{' '}
                                                        <Link
                                                            href="/simmutu/realisations/create"
                                                            className="font-medium text-primary underline-offset-4 hover:underline"
                                                        >
                                                            input realisasi harian
                                                        </Link>
                                                        .
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        realisations.data.map((r) => (
                                            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.period_anchor}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-foreground">{r.indicator?.title ?? '–'}</span>
                                                    {r.indicator?.mutu_category && (
                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                            {r.indicator.mutu_category.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">{r.dep_id}</td>
                                                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                                    {formatPlain(r.numerator_value)} / {formatPlain(r.denominator_value)}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums">
                                                    {r.achievement_percent !== null ? (
                                                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                                                            {formatPlain(r.achievement_percent)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">–</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{r.input_user?.name ?? '–'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {realisations.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-3">
                                {realisations.links.map((link, i) => (
                                    <span key={i}>
                                        {link.url ? (
                                            <Button size="sm" variant={link.active ? 'default' : 'outline'} asChild>
                                                <Link href={link.url} preserveState>
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <span
                                                className="inline-flex size-8 items-center justify-center text-muted-foreground"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
