import { Head, Link, router, useForm } from '@inertiajs/react';
import { User, Building2, FolderOpen, Tag, Target, Lightbulb, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan per Teknisi', href: '/reports/technician' },
];

type CategoryItem = { id: number | null; name: string; count: number };
type TagItem = { id: number; name: string; count: number };
type TechnicianOption = { id: number; name: string; dep_id: string | null };

type Kpi = {
    resolution_rate_percent: number | null;
    avg_resolution_minutes: number | null;
    total_tickets: number;
    resolved_count: number;
};

type Props = {
    technician: { id: number; name: string; dep_id: string | null } | null;
    totalTickets: number;
    resolvedCount: number;
    avgResolutionMinutes: number | null;
    categories: CategoryItem[];
    tags: TagItem[];
    kpi: Kpi | null;
    insights: string[];
    recommendations: string[];
    techniciansForFilter: TechnicianOption[];
    canSelectTechnician: boolean;
    filters: { from: string; to: string; assignee_id: number | null };
};

function formatDuration(minutes: number | null): string {
    if (minutes == null || minutes === 0) return '-';
    if (minutes < 60) return `${Math.round(minutes)} menit`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} jam`;
    const days = hours / 24;
    return `${days.toFixed(1)} hari`;
}

/** Last day of month for Y-m string (e.g. "2025-03" -> 31). */
function lastDayOfMonth(ym: string): number {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0).getDate();
}

/** Build URL ke daftar tiket dengan filter assignee + periode closed. */
function ticketsUrl(assigneeId: number, fromMonth: string, toMonth: string, resolvedOnly: boolean): string {
    const closedFrom = `${fromMonth}-01`;
    const [y, m] = toMonth.split('-').map(Number);
    const lastDay = lastDayOfMonth(toMonth);
    const closedTo = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const params = new URLSearchParams();
    params.set('assignee', String(assigneeId));
    params.set('closed_from', closedFrom);
    params.set('closed_to', closedTo);
    if (resolvedOnly) params.set('resolved_only', '1');
    return `/tickets?${params.toString()}`;
}

export default function TechnicianReport({
    technician,
    totalTickets,
    resolvedCount,
    avgResolutionMinutes,
    categories,
    tags,
    kpi,
    insights,
    recommendations,
    techniciansForFilter,
    canSelectTechnician,
    filters,
}: Props) {
    const { data, setData } = useForm({
        from: filters.from,
        to: filters.to,
        assignee_id: filters.assignee_id ? String(filters.assignee_id) : '__none__',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('from', data.from);
        params.set('to', data.to);
        if (data.assignee_id && data.assignee_id !== '__none__') {
            params.set('assignee_id', data.assignee_id);
        }
        router.get(`/reports/technician?${params.toString()}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan per Teknisi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan per Teknisi
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tiket yang ditangani oleh satu teknisi dalam periode: jumlah, selesai, rata-rata lama, kategori, dan tag.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/reports">Daftar Laporan</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filter</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode berdasarkan tiket yang sudah ditutup (closed_at). Pilih teknisi (admin) atau lihat data Anda (staff).
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="from">Dari bulan</Label>
                                <Input
                                    id="from"
                                    type="month"
                                    value={data.from}
                                    onChange={(e) => setData('from', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="to">Sampai bulan</Label>
                                <Input
                                    id="to"
                                    type="month"
                                    value={data.to}
                                    onChange={(e) => setData('to', e.target.value)}
                                />
                            </div>
                            {canSelectTechnician && techniciansForFilter.length > 0 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="assignee_id">Teknisi</Label>
                                    <Select
                                        value={data.assignee_id}
                                        onValueChange={(v) => setData('assignee_id', v)}
                                    >
                                        <SelectTrigger id="assignee_id" className="w-56">
                                            <SelectValue placeholder="Pilih teknisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">-- Pilih teknisi --</SelectItem>
                                            {techniciansForFilter.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.name}
                                                    {t.dep_id ? ` (${t.dep_id})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button type="submit">Terapkan</Button>
                        </form>
                    </CardContent>
                </Card>

                {technician ? (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <User className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Teknisi</p>
                                        <p className="font-semibold">{technician.name}</p>
                                        {technician.dep_id && (
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Building2 className="size-3" />
                                                {technician.dep_id}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className={totalTickets > 0 ? 'transition-colors hover:bg-muted/50' : ''}>
                                <CardContent className="pt-6">
                                    {totalTickets > 0 ? (
                                        <Link
                                            href={ticketsUrl(technician.id, data.from, data.to, false)}
                                            className="block"
                                        >
                                            <p className="text-sm text-muted-foreground">Tiket ditangani</p>
                                            <p className="mt-1 text-2xl font-bold text-primary hover:underline">
                                                {totalTickets}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Klik untuk lihat daftar tiket
                                            </p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground">Tiket ditangani</p>
                                            <p className="mt-1 text-2xl font-bold">{totalTickets}</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className={resolvedCount > 0 ? 'transition-colors hover:bg-muted/50' : ''}>
                                <CardContent className="pt-6">
                                    {resolvedCount > 0 ? (
                                        <Link
                                            href={ticketsUrl(technician.id, data.from, data.to, true)}
                                            className="block"
                                        >
                                            <p className="text-sm text-muted-foreground">Tiket selesai (resolved)</p>
                                            <p className="mt-1 text-2xl font-bold text-primary hover:underline">
                                                {resolvedCount}
                                            </p>
                                            {totalTickets > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {Math.round((100 * resolvedCount) / totalTickets)}% dari total
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Klik untuk lihat daftar tiket
                                            </p>
                                        </Link>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground">Tiket selesai (resolved)</p>
                                            <p className="mt-1 text-2xl font-bold">{resolvedCount}</p>
                                            {totalTickets > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {Math.round((100 * resolvedCount) / totalTickets)}% dari total
                                                </p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground">Rata-rata waktu selesai</p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {formatDuration(avgResolutionMinutes)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {kpi && totalTickets > 0 && (
                            <>
                                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Target className="h-5 w-5" />
                                            KPI untuk Penilaian
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Data yang bisa dipakai untuk KPI teknisi atau penilaian kinerja dalam periode ini.
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <div className="rounded-lg border bg-card p-4">
                                                <p className="text-sm text-muted-foreground">Tingkat penyelesaian</p>
                                                <p className="mt-1 text-xl font-bold">
                                                    {kpi.resolution_rate_percent != null ? `${kpi.resolution_rate_percent}%` : '-'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">resolved / total tiket</p>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                                <p className="text-sm text-muted-foreground">Throughput</p>
                                                {technician && (
                                                    <Link
                                                        href={ticketsUrl(technician.id, data.from, data.to, false)}
                                                        className="mt-1 block text-xl font-bold text-primary hover:underline"
                                                    >
                                                        {kpi.total_tickets}
                                                    </Link>
                                                )}
                                                {!technician && (
                                                    <p className="mt-1 text-xl font-bold">{kpi.total_tickets}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">tiket ditutup — klik untuk daftar</p>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                                <p className="text-sm text-muted-foreground">Tiket selesai (resolved)</p>
                                                {technician && kpi.resolved_count > 0 ? (
                                                    <Link
                                                        href={ticketsUrl(technician.id, data.from, data.to, true)}
                                                        className="mt-1 block text-xl font-bold text-primary hover:underline"
                                                    >
                                                        {kpi.resolved_count}
                                                    </Link>
                                                ) : (
                                                    <p className="mt-1 text-xl font-bold">{kpi.resolved_count}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">siap untuk KPI — klik untuk daftar</p>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                                <p className="text-sm text-muted-foreground">Rata-rata waktu selesai</p>
                                                <p className="mt-1 text-xl font-bold">
                                                    {formatDuration(kpi.avg_resolution_minutes)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">untuk SLA / target</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {insights.length > 0 && (
                                    <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                                                Insight positif
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                                {insights.map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {recommendations.length > 0 && (
                                    <Card className="rounded-lg border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                                                <Lightbulb className="h-5 w-5 text-amber-600" />
                                                Rekomendasi
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                Saran tindak lanjut berdasarkan data periode ini.
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                                {recommendations.map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FolderOpen className="h-4 w-4" />
                                        Kategori
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {categories.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">-</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((c) => (
                                                <Badge key={c.name} variant="secondary">
                                                    {c.name} ({c.count})
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Tag className="h-4 w-4" />
                                        Tag
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {tags.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">-</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((t) => (
                                                <Badge key={t.id} variant="outline">
                                                    {t.name} ({t.count})
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {totalTickets === 0 && (
                            <Card>
                                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                    Tidak ada tiket ditutup untuk teknisi ini dalam periode {data.from} s/d {data.to}.
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            {canSelectTechnician
                                ? 'Pilih teknisi dan periode lalu klik Terapkan untuk melihat laporan.'
                                : 'Tidak ada data teknisi untuk ditampilkan.'}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
