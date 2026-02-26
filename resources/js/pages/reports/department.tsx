import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, User, Tag, FolderOpen } from 'lucide-react';
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

type Props = {
    departments: DepartmentRow[];
    byAssignee: AssigneeRow[];
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
