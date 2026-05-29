import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    FolderTree,
    ListChecks,
    Sparkles,
    TrendingDown,
    TrendingUp,
    User,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

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

type LowAchievementItem = {
    id: number;
    title: string;
    count: number;
    avg_achievement: number;
};

type PeriodSummary = {
    label: string;
    total_entries: number;
    avg_achievement: number | null;
};

type Props = {
    counts: { categories: number; indicators: number };
    recentRealisations: RecentRow[];
    periodSummary: {
        month: PeriodSummary;
        year: PeriodSummary;
    };
    myStats: {
        total_entries: number;
        avg_achievement: number | null;
    };
    insights: {
        unfilled_indicators: number;
        low_achievement_indicators: LowAchievementItem[];
    };
    currentMonth: string;
};

function formatPercent(value: number | null): string {
    return value !== null ? `${value.toFixed(1)}%` : '–';
}

export default function SimmutuDashboard({
    counts,
    recentRealisations,
    periodSummary,
    myStats,
    insights,
    currentMonth,
}: Props) {
    const page = usePage<SharedData>();
    const canInput = page.props.permissions?.simmutu?.can_input ?? false;

    const navigateToFiltered = (filterType: string) => {
        const params = new URLSearchParams();
        if (filterType === 'month' || filterType === 'my') {
            params.set('month', currentMonth);
        }
        router.get(`/simmutu/realisations?${params.toString()}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SIMMUTU" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Hero section */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-emerald-500/[0.06] shadow-sm">
                    <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex max-w-2xl flex-col gap-3">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
                                <Sparkles className="size-3.5" />
                                SIMMUTU · Sistem Informasi Manajemen Mutu
                            </div>
                            <Heading
                                title="Dashboard Mutu"
                                description="Pantau capaian dan entri realisasi secara real-time."
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/simmutu/realisations">Rekap Mutu</Link>
                            </Button>
                            {canInput && (
                                <Button size="sm" asChild className="shadow-md">
                                    <Link href="/simmutu/realisations/create">Input Realisasi</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick filter chips */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToFiltered('month')}
                        className="gap-2"
                    >
                        <Clock className="size-4" />
                        Bulan ini
                        <Badge variant="secondary" className="ml-1">
                            {periodSummary.month.total_entries} entri
                        </Badge>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                    >
                        <Link href={`/simmutu/realisations?month=${currentMonth}`}>
                            <ClipboardList className="size-4" />
                            Lihat semua
                        </Link>
                    </Button>
                    {canInput && (
                        <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="gap-2"
                        >
                            <Link href="/simmutu/realisations/create">
                                <Sparkles className="size-4" />
                                Input Baru
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Period stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">{periodSummary.month.label}</p>
                                <p className="text-2xl font-semibold tabular-nums">{periodSummary.month.total_entries}</p>
                                <p className="text-xs text-muted-foreground">entri bulan ini</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                (periodSummary.month.avg_achievement ?? 0) >= 80
                                    ? 'bg-emerald-500/10'
                                    : (periodSummary.month.avg_achievement ?? 0) >= 50
                                    ? 'bg-amber-500/10'
                                    : 'bg-red-500/10'
                            }`}>
                                {((periodSummary.month.avg_achievement ?? 0) >= 80) ? (
                                    <TrendingUp className={`h-5 w-5 ${
                                        (periodSummary.month.avg_achievement ?? 0) >= 80
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : (periodSummary.month.avg_achievement ?? 0) >= 50
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }`} />
                                ) : (
                                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Rata-rata Capaian</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {formatPercent(periodSummary.month.avg_achievement)}
                                </p>
                                <p className="text-xs text-muted-foreground">bulan ini</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Entri Saya</p>
                                <p className="text-2xl font-semibold tabular-nums">{myStats.total_entries}</p>
                                <p className="text-xs text-muted-foreground">bulan ini</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Akumulasi Tahun</p>
                                <p className="text-2xl font-semibold tabular-nums">{periodSummary.year.total_entries}</p>
                                <p className="text-xs text-muted-foreground">{periodSummary.year.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Insight cards row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Unfilled indicators warning */}
                    <Card className={`border-border/80 shadow-sm ${
                        insights.unfilled_indicators > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'
                    }`}>
                        <CardContent className="flex items-start gap-3 p-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                insights.unfilled_indicators > 0
                                    ? 'bg-amber-500/10'
                                    : 'bg-emerald-500/10'
                            }`}>
                                {insights.unfilled_indicators > 0 ? (
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Indikator Belum Terisi</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {insights.unfilled_indicators}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {insights.unfilled_indicators > 0
                                        ? `${insights.unfilled_indicators} indikator belum ada data bulan ini`
                                        : 'Semua indikator sudah terisi bulan ini'
                                    }
                                </p>
                                {insights.unfilled_indicators > 0 && canInput && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        asChild
                                        className="mt-2 h-auto p-0 text-amber-600 dark:text-amber-400"
                                    >
                                        <Link href="/simmutu/realisations/create">
                                            Input sekarang <ChevronRight className="size-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories & Indicators quick stats */}
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-start gap-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <FolderTree className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Struktur Indikator</p>
                                <div className="mt-2 flex gap-4">
                                    <div>
                                        <p className="text-xl font-semibold tabular-nums">{counts.categories}</p>
                                        <p className="text-xs text-muted-foreground">Kategori</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold tabular-nums">{counts.indicators}</p>
                                        <p className="text-xs text-muted-foreground">Indikator</p>
                                    </div>
                                </div>
                                <Button variant="link" size="sm" asChild className="mt-2 h-auto p-0 text-primary">
                                    <Link href="/simmutu/indicators">
                                        Kelola indikator <ChevronRight className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low achievement alerts */}
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="flex items-start gap-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Peringatan Capaian</p>
                                {insights.low_achievement_indicators.length === 0 ? (
                                    <div className="mt-2">
                                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="mr-1 size-3" />
                                            Semua on track
                                        </Badge>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Tidak ada indikator dengan capaian &lt;80%
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {insights.low_achievement_indicators.length} indikator butuh perhatian
                                        </p>
                                        <div className="mt-2 space-y-1.5">
                                            {insights.low_achievement_indicators.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-xs">
                                                    <span className="truncate text-muted-foreground">{item.title}</span>
                                                    <Badge variant="destructive" className="shrink-0 ml-2">
                                                        {item.avg_achievement}%
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            asChild
                                            className="mt-2 h-auto p-0 text-red-600 dark:text-red-400"
                                        >
                                            <Link href={`/simmutu/realisations?month=${currentMonth}`}>
                                                Lihat detail <ChevronRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent entries table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">Entri terbaru</h2>
                            <p className="text-xs text-muted-foreground">
                                Cuplikan entri realization terbaru Anda.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/simmutu/realisations">
                                Lihat semua <ChevronRight className="ml-1 size-4" />
                            </Link>
                        </Button>
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
                                            Belum ada realization.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRealisations.slice(0, 10).map((r) => (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-2 font-mono text-xs">{r.period_anchor}</td>
                                            <td className="px-4 py-2">
                                                <Link
                                                    href={`/simmutu/realisations/${r.id}`}
                                                    className="font-medium hover:text-primary hover:underline"
                                                >
                                                    {r.indicator_title ?? '–'}
                                                </Link>
                                                {r.category_name && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {r.category_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs">{r.dep_id}</td>
                                            <td className="px-4 py-2">
                                                {r.achievement_percent !== null ? (
                                                    <Badge
                                                        variant={
                                                            r.achievement_percent >= 80 ? 'default' :
                                                            r.achievement_percent >= 50 ? 'secondary' : 'destructive'
                                                        }
                                                    >
                                                        {r.achievement_percent.toFixed(1)}%
                                                    </Badge>
                                                ) : '–'}
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