import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Building2, User, Tag, FolderOpen, AlertTriangle, BarChart3, FileText, Target, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

// Warna eksplisit agar grafik tampil konsisten (CSS --chart-* pakai oklch, bukan hsl)
const CHART_COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EF4444', // red
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan per Departemen', href: '/reports/department' },
];

type CategoryItem = { id: number | null; name: string; count: number };
type TagItem = { id: number; name: string; count: number };

type DepartmentRow = {
    dep_id: string;
    total_tickets: number;
    resolved_count: number;
    avg_resolution_minutes: number | null;
    categories: CategoryItem[];
    tags: TagItem[];
};

type AssigneeRow = DepartmentRow & {
    assignee_id: number;
    assignee_name: string;
};

type UnitKerusakanItem = { dep_id: string; total_tickets: number };
type InsightItem = { name: string; count: number };

type Props = {
    departments: DepartmentRow[];
    byAssignee: AssigneeRow[];
    insightsUnitKerusakan: UnitKerusakanItem[];
    insightsTopCategories: InsightItem[];
    insightsTopTags: InsightItem[];
    filters: { from: string; to: string; dep_id: string | null; per_petugas: boolean };
    departmentsForFilter: string[];
};

function formatDuration(minutes: number | null): string {
    if (minutes == null || minutes === 0) return '-';
    if (minutes < 60) return `${Math.round(minutes)} menit`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} jam`;
    const days = hours / 24;
    return `${days.toFixed(1)} hari`;
}

export default function DepartmentReport({
    departments,
    byAssignee,
    insightsUnitKerusakan,
    insightsTopCategories,
    insightsTopTags,
    filters,
    departmentsForFilter,
}: Props) {
    const { data, setData } = useForm({
        from: filters.from,
        to: filters.to,
        dep_id: filters.dep_id || '__all__',
        per_petugas: filters.per_petugas,
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('from', data.from);
        params.set('to', data.to);
        if (data.dep_id && data.dep_id !== '__all__') params.set('dep_id', data.dep_id);
        params.set('per_petugas', data.per_petugas ? '1' : '0');
        router.get(`/reports/department?${params.toString()}`);
    };

    // Ringkasan untuk laporan ke direksi
    const totalTickets = departments.reduce((s, d) => s + d.total_tickets, 0);
    const totalResolved = departments.reduce((s, d) => s + d.resolved_count, 0);
    const resolutionWeightedSum = departments.reduce(
        (s, d) => s + (d.avg_resolution_minutes ?? 0) * d.total_tickets,
        0,
    );
    const avgResolutionMinutes =
        totalTickets > 0 ? resolutionWeightedSum / totalTickets : null;
    const topUnit = insightsUnitKerusakan[0];
    const topCategory = insightsTopCategories[0];
    const topTag = insightsTopTags[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan per Departemen" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan per Departemen
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tiket yang ditangani per departemen: jumlah, lama penyelesaian, kategori, dan tag. Bisa di-breakdown per petugas.
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
                            Periode berdasarkan tiket yang sudah ditutup (closed_at).
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
                            {departmentsForFilter.length > 1 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="dep_id">Departemen</Label>
                                    <Select
                                        value={data.dep_id}
                                        onValueChange={(v) => setData('dep_id', v)}
                                    >
                                        <SelectTrigger id="dep_id" className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Semua</SelectItem>
                                            {departmentsForFilter.map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="per_petugas"
                                    checked={data.per_petugas}
                                    onCheckedChange={(c) => setData('per_petugas', c === true)}
                                />
                                <Label htmlFor="per_petugas" className="text-sm font-normal">
                                    Breakdown per petugas
                                </Label>
                            </div>
                            <Button type="submit">Terapkan</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Ringkasan untuk Direksi */}
                {departments.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5" />
                                Ringkasan untuk Direksi
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                KPI dan rekomendasi singkat untuk bahan rapat manajemen. Periode: {data.from} s/d {data.to}.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Target className="h-4 w-4" />
                                        Total tiket ditangani
                                    </div>
                                    <p className="mt-1 text-2xl font-bold">{totalTickets}</p>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Building2 className="h-4 w-4" />
                                        Tiket selesai (resolved)
                                    </div>
                                    <p className="mt-1 text-2xl font-bold">{totalResolved}</p>
                                    {totalTickets > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {Math.round((100 * totalResolved) / totalTickets)}% dari total
                                        </p>
                                    )}
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        Rata-rata waktu selesai
                                    </div>
                                    <p className="mt-1 text-2xl font-bold">
                                        {formatDuration(avgResolutionMinutes)}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Unit dengan tiket terbanyak
                                    </div>
                                    <p className="mt-1 text-xl font-bold">
                                        {topUnit ? `${topUnit.dep_id} (${topUnit.total_tickets})` : '-'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Lightbulb className="h-4 w-4 text-amber-600" />
                                    Rekomendasi (berdasarkan data periode ini)
                                </h4>
                                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                    {topUnit && (
                                        <li>
                                            <strong>Unit prioritas:</strong> {topUnit.dep_id} memiliki tiket terbanyak ({topUnit.total_tickets}). Pertimbangkan pengecekan aset, pelatihan pengguna, atau penambahan dukungan IT.
                                        </li>
                                    )}
                                    {topCategory && (
                                        <li>
                                            <strong>Kategori prioritas:</strong> &quot;{topCategory.name}&quot; paling sering ({topCategory.count} tiket). Evaluasi penyebab berulang dan tindakan preventif atau dokumentasi.
                                        </li>
                                    )}
                                    {topTag && (
                                        <li>
                                            <strong>Tag terbanyak:</strong> &quot;{topTag.name}&quot; ({topTag.count}). Bisa dijadikan fokus perbaikan atau pengadaan.
                                        </li>
                                    )}
                                    {departments.length > 0 && (
                                        <li>
                                            Rata-rata penyelesaian {formatDuration(avgResolutionMinutes)} — pantau SLA dan beban tim untuk periode berikutnya.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Insight & Grafik */}
                {(insightsUnitKerusakan.length > 0 ||
                    insightsTopCategories.length > 0 ||
                    insightsTopTags.length > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" />
                                Insight & Grafik
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Unit dengan tiket terbanyak, kategori dan tag yang paling sering muncul dalam periode ini.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {insightsUnitKerusakan.length > 0 && (
                                <div>
                                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Unit / departemen dengan tiket kerusakan terbanyak
                                    </h4>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={insightsUnitKerusakan.map((u) => ({
                                                    name: u.dep_id,
                                                    jumlah: u.total_tickets,
                                                }))}
                                                layout="vertical"
                                                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis type="number" className="text-xs" />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={100}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    formatter={(value: number | undefined) => [`${value ?? 0} tiket`, 'Jumlah']}
                                                    labelFormatter={(label) => `Unit: ${label}`}
                                                />
                                                <Bar dataKey="jumlah" name="Tiket" radius={[0, 4, 4, 0]} fill={CHART_COLORS[0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {insightsTopCategories.length > 0 && (
                                <div>
                                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <FolderOpen className="h-4 w-4" />
                                        Kategori tiket terbanyak
                                    </h4>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={insightsTopCategories.map((c) => ({
                                                    name: c.name.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
                                                    fullName: c.name,
                                                    jumlah: c.count,
                                                }))}
                                                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                                                <YAxis className="text-xs" />
                                                <Tooltip
                                                    formatter={(value: number | undefined) => [`${value ?? 0} tiket`, 'Jumlah']}
                                                    labelFormatter={(_, payload) =>
                                                        payload?.[0]?.payload?.fullName ?? ''
                                                    }
                                                />
                                                <Bar dataKey="jumlah" name="Tiket" radius={[4, 4, 0, 0]}>
                                                    {insightsTopCategories.map((_, i) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {insightsTopTags.length > 0 && (
                                <div>
                                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Tag className="h-4 w-4" />
                                        Tag terbanyak
                                    </h4>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={insightsTopTags.map((t) => ({
                                                    name: t.name.length > 15 ? t.name.slice(0, 13) + '…' : t.name,
                                                    fullName: t.name,
                                                    jumlah: t.count,
                                                }))}
                                                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                                                <YAxis className="text-xs" />
                                                <Tooltip
                                                    formatter={(value: number | undefined) => [`${value ?? 0} tiket`, 'Jumlah']}
                                                    labelFormatter={(_, payload) =>
                                                        payload?.[0]?.payload?.fullName ?? ''
                                                    }
                                                />
                                                <Bar dataKey="jumlah" name="Tiket" radius={[4, 4, 0, 0]}>
                                                    {insightsTopTags.map((_, i) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {departments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            Tidak ada data tiket ditutup dalam periode ini (atau tidak ada tiket yang ditugaskan).
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {departments.map((dep) => (
                            <Card key={dep.dep_id}>
                                <CardHeader className="border-b">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Building2 className="h-5 w-5" />
                                        {dep.dep_id}
                                    </CardTitle>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                        <span>
                                            <strong>{dep.total_tickets}</strong> tiket ditangani
                                        </span>
                                        <span>
                                            <strong>{dep.resolved_count}</strong> selesai (resolved)
                                        </span>
                                        <span className="text-muted-foreground">
                                            Rata-rata lama: {formatDuration(dep.avg_resolution_minutes)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                            <FolderOpen className="h-4 w-4" />
                                            Kategori
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {dep.categories.length === 0 ? (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            ) : (
                                                dep.categories.map((c) => (
                                                    <Badge key={c.id ?? 'null'} variant="secondary">
                                                        {c.name} ({c.count})
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                            <Tag className="h-4 w-4" />
                                            Tag
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {dep.tags.length === 0 ? (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            ) : (
                                                dep.tags.map((t) => (
                                                    <Badge key={t.id} variant="outline">
                                                        {t.name} ({t.count})
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {filters.per_petugas && (
                                        <div className="mt-6 border-t pt-4">
                                            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                                                <User className="h-4 w-4" />
                                                Per petugas
                                            </h4>
                                            <div className="space-y-4">
                                                {byAssignee
                                                    .filter((a) => a.dep_id === dep.dep_id)
                                                    .map((a) => (
                                                        <div
                                                            key={a.assignee_id}
                                                            className="rounded-lg border bg-muted/30 p-4"
                                                        >
                                                            <div className="mb-2 font-medium">
                                                                {a.assignee_name}
                                                            </div>
                                                            <div className="mb-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                                <span>{a.total_tickets} tiket</span>
                                                                <span>{a.resolved_count} selesai</span>
                                                                <span>Rata-rata: {formatDuration(a.avg_resolution_minutes)}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {a.categories.map((c) => (
                                                                    <Badge key={c.id ?? 'n'} variant="secondary" className="text-xs">
                                                                        {c.name} ({c.count})
                                                                    </Badge>
                                                                ))}
                                                                {a.tags.map((t) => (
                                                                    <Badge key={t.id} variant="outline" className="text-xs">
                                                                        {t.name} ({t.count})
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
