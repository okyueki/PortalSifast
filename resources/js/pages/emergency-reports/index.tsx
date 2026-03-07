import { Head, Link, router } from '@inertiajs/react';
import { Search, Plus, Filter, AlertCircle, Eye } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    { title: 'Laporan Darurat', href: '/emergency-reports' },
];

type ReportItem = {
    report_id: string;
    status: string;
    category: string;
    address: string;
    sender_name: string | null;
    sender_phone: string | null;
    created_at: string;
    responded_at: string | null;
    assigned_operator: string | null;
};

type PaginatedReports = {
    data: ReportItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    reports: PaginatedReports;
    filters: {
        status?: string;
        category?: string;
        date_from?: string;
        date_to?: string;
        q?: string;
    };
    categories: Record<string, string>;
    statuses: Record<string, string>;
};

function formatDate(dateString: string | null): string {
    if (!dateString) return '–';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusBadgeVariant(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-700 border-amber-500/50 dark:text-amber-300',
        responded: 'bg-blue-500/20 text-blue-700 border-blue-500/50 dark:text-blue-300',
        in_progress: 'bg-orange-500/20 text-orange-700 border-orange-500/50 dark:text-orange-300',
        resolved: 'bg-green-500/20 text-green-700 border-green-500/50 dark:text-green-300',
        cancelled: 'bg-slate-500/20 text-slate-600 border-slate-500/50 dark:text-slate-400',
    };
    return map[status] ?? 'bg-slate-500/20';
}

export default function EmergencyReportsIndex({
    reports,
    filters,
    categories,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const applyFilters = () => {
        router.get('/emergency-reports', {
            q: search || undefined,
            status: status || undefined,
            category: category || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setCategory('');
        setDateFrom('');
        setDateTo('');
        router.get('/emergency-reports', {}, { preserveState: true });
    };

    const hasFilters = !!(filters.status || filters.category || filters.date_from || filters.date_to || filters.q);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Darurat" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Laporan Darurat"
                        description="Daftar laporan panic button / emergency untuk pengujian dan laporan internal"
                    />
                    <Button asChild>
                        <Link href="/emergency-reports/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Input Laporan (Admin)
                        </Link>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari report ID, alamat, nama..."
                                className="pl-9"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statuses).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categories).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="Dari"
                            className="w-[140px]"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="Sampai"
                            className="w-[140px]"
                        />
                        <Button type="button" onClick={applyFilters}>
                            <Filter className="mr-2 h-4 w-4" />
                            Terapkan
                        </Button>
                        {hasFilters && (
                            <Button type="button" variant="outline" onClick={clearFilters}>
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                                    <th className="px-4 py-3 font-medium">Report ID</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Kategori</th>
                                    <th className="px-4 py-3 font-medium">Alamat</th>
                                    <th className="px-4 py-3 font-medium">Pelapor</th>
                                    <th className="px-4 py-3 font-medium">Dibuat</th>
                                    <th className="px-4 py-3 font-medium w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-0">
                                            <EmptyState
                                                title={hasFilters ? 'Tidak ada hasil' : 'Belum ada laporan darurat'}
                                                description={hasFilters ? 'Coba ubah filter.' : 'Laporan bisa dari API (panic button) atau input manual oleh admin.'}
                                                icon={<AlertCircle className="size-7" />}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    reports.data.map((r) => (
                                        <tr key={r.report_id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/emergency-reports/${r.report_id}`}
                                                    className="font-mono font-medium text-primary hover:underline"
                                                >
                                                    {r.report_id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={statusBadgeVariant(r.status)}>
                                                    {statuses[r.status] ?? r.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {categories[r.category] ?? r.category}
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px] truncate" title={r.address}>
                                                {r.address}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.sender_name ?? '–'}
                                                {r.sender_phone && (
                                                    <span className="block text-xs text-muted-foreground">{r.sender_phone}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(r.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/emergency-reports/${r.report_id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {reports.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {reports.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button size="sm" variant={link.active ? 'default' : 'outline'} asChild>
                                            <Link href={link.url} preserveState>
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            className="inline-flex size-8 items-center justify-center text-muted-foreground"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-sm text-muted-foreground">
                    Total: {reports.total} laporan
                </p>
            </div>
        </AppLayout>
    );
}
