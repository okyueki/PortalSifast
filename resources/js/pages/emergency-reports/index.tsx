import { Head, Link, router } from '@inertiajs/react';
import {
    Search, Plus, Filter, AlertCircle, Eye, Map, List,
    Clock, Users, Activity, CheckCircle, Wifi, WifiOff, MapPin, RefreshCw
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import EmergencyMap, { type ReportMarker, type OfficerMarker } from '@/components/ui/emergency-map';
import {
    useEmergencyBroadcast,
    type EmergencyReportStatusChangedEvent,
} from '@/hooks/use-emergency-broadcast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Emergency', href: '/emergency-reports' },
];

// Types
type ReportItem = {
    report_id: string;
    status: string;
    category: string;
    latitude: number;
    longitude: number;
    address: string;
    sender_name: string | null;
    sender_phone: string | null;
    created_at: string;
    responded_at: string | null;
    assigned_operator: string | null;
    waiting_minutes: number;
    officer_location: {
        latitude: number;
        longitude: number;
        eta_minutes: number;
        distance_meters: number;
    } | null;
};

type PaginatedReports = {
    data: ReportItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type ActiveOfficer = {
    officer_id: number;
    officer_name: string | null;
    officer_phone: string | null;
    report_id: string;
    latitude: number;
    longitude: number;
    speed_kmh: number | null;
    eta_minutes: number;
    distance_meters: number;
    updated_at: string;
};

type Stats = {
    by_status: {
        pending: number;
        responded: number;
        in_progress: number;
        arrived: number;
    };
    total_active: number;
    long_waiting: number;
    avg_response_time_minutes: number;
    today: { total: number; resolved: number };
    active_officers: number;
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
    activeOfficers: ActiveOfficer[];
    stats: Stats;
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

function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
}

function statusBadgeVariant(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-700 border-amber-500/50 dark:text-amber-300',
        responded: 'bg-blue-500/20 text-blue-700 border-blue-500/50 dark:text-blue-300',
        in_progress: 'bg-orange-500/20 text-orange-700 border-orange-500/50 dark:text-orange-300',
        arrived: 'bg-green-500/20 text-green-700 border-green-500/50 dark:text-green-300',
        resolved: 'bg-slate-500/20 text-slate-600 border-slate-500/50 dark:text-slate-400',
        cancelled: 'bg-slate-500/20 text-slate-600 border-slate-500/50 dark:text-slate-400',
    };
    return map[status] ?? 'bg-slate-500/20';
}

export default function EmergencyReportsIndex({
    reports,
    filters,
    categories,
    statuses,
    activeOfficers,
    stats,
}: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [reportsData, setReportsData] = useState(reports);
    const [statsData, setStatsData] = useState(stats);
    const [activeOfficersData, setActiveOfficersData] = useState(activeOfficers);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // WebSocket connection
    const { isConnected } = useEmergencyBroadcast({
        onStatusChanged: useCallback((event: EmergencyReportStatusChangedEvent) => {
            // Update local state when status changes via WebSocket
            setReportsData(prev => ({
                ...prev,
                data: prev.data.map(r =>
                    r.report_id === event.report_id
                        ? { ...r, status: event.status }
                        : r
                ),
            }));

            // Update stats
            setStatsData(prev => {
                const newStats = { ...prev };
                if (event.previous_status) {
                    newStats.by_status = {
                        ...newStats.by_status,
                        [event.previous_status]: Math.max(0, (newStats.by_status[event.previous_status as keyof typeof prev.by_status] || 0) - 1),
                    };
                }
                if (event.status) {
                    newStats.by_status = {
                        ...newStats.by_status,
                        [event.status]: (newStats.by_status[event.status as keyof typeof prev.by_status] || 0) + 1,
                    };
                }
                return newStats;
            });
        }, []),
        enabled: true,
    });

    // Auto-refresh every 30 seconds
    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        router.reload({ only: ['reports', 'activeOfficers', 'stats'], preserveState: true });
        setTimeout(() => setIsRefreshing(false), 1000);
    }, []);

    useEffect(() => {
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, [refreshData]);

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

    // Convert data for map
    const reportMarkers: ReportMarker[] = reportsData.data.map(r => ({
        report_id: r.report_id,
        status: r.status,
        category: r.category,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address,
        sender_name: r.sender_name,
        sender_phone: r.sender_phone,
        waiting_minutes: r.waiting_minutes,
        officer_location: r.officer_location,
    }));

    const officerMarkers: OfficerMarker[] = activeOfficersData.map(o => ({
        officer_id: o.officer_id,
        officer_name: o.officer_name || 'Petugas',
        report_id: o.report_id,
        latitude: o.latitude,
        longitude: o.longitude,
        eta_minutes: o.eta_minutes,
        distance_meters: o.distance_meters,
        speed_kmh: o.speed_kmh,
        updated_at: o.updated_at,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Darurat" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header with stats and view toggle */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Laporan Darurat"
                        description="Monitoring panic button dan emergency reports"
                    />

                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                            isConnected ? 'bg-green-500/10 text-green-600' : 'bg-slate-500/10 text-slate-600'
                        )}>
                            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                            <span>{isConnected ? 'Live' : 'Offline'}</span>
                        </div>

                        {/* View Toggle */}
                        <div className="flex rounded-lg border bg-card">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                )}
                            >
                                <List className="h-4 w-4" />
                                <span>List</span>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                    viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                )}
                            >
                                <Map className="h-4 w-4" />
                                <span>Map</span>
                            </button>
                        </div>

                        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
                            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                            Refresh
                        </Button>

                        <Button asChild>
                            <Link href="/emergency-reports/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Laporan
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Aktif</p>
                                    <p className="text-2xl font-bold">{statsData.total_active}</p>
                                </div>
                                <div className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center',
                                    statsData.total_active > 0 ? 'bg-amber-500/20' : 'bg-green-500/20'
                                )}>
                                    <Activity className={cn(
                                        'h-5 w-5',
                                        statsData.total_active > 0 ? 'text-amber-500' : 'text-green-500'
                                    )} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Menunggu</p>
                                    <p className="text-2xl font-bold">{statsData.by_status.pending}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                </div>
                            </div>
                            {statsData.long_waiting > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    {statsData.long_waiting} lebih dari 5 menit
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Dalam Perjalanan</p>
                                    <p className="text-2xl font-bold">{statsData.by_status.in_progress}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-orange-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Petugas Aktif</p>
                                    <p className="text-2xl font-bold">{statsData.active_officers}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Hari Ini</p>
                                    <p className="text-2xl font-bold">{statsData.today.total}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-blue-500" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{statsData.today.resolved} selesai</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Map View (when map mode selected) */}
                {viewMode === 'map' && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Map className="h-4 w-4" />
                                Peta Lokasi
                                <span className="text-xs text-muted-foreground font-normal ml-2">
                                    ({reportsData.data.length} laporan aktif)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <EmergencyMap
                                reports={reportMarkers}
                                officers={officerMarkers}
                                selectedReportId={selectedReportId}
                                onReportClick={setSelectedReportId}
                                height="450px"
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
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
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Semua Status</SelectItem>
                                {Object.entries(statuses).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Semua Kategori</SelectItem>
                                {Object.entries(categories).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-[140px]"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
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

                {/* Main Content Grid */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Reports Table */}
                    <div className={cn('lg:col-span-2', viewMode === 'map' && 'lg:col-span-3')}>
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                                                <th className="px-4 py-3 font-medium">Report ID</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium">Kategori</th>
                                                <th className="px-4 py-3 font-medium">Alamat</th>
                                                <th className="px-4 py-3 font-medium">Pelapor</th>
                                                <th className="px-4 py-3 font-medium">Menunggu</th>
                                                <th className="px-4 py-3 font-medium w-20">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportsData.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <EmptyState
                                                            title={hasFilters ? 'Tidak ada hasil' : 'Belum ada laporan'}
                                                            description={hasFilters ? 'Coba ubah filter.' : 'Laporan bisa dari API (panic button) atau input manual.'}
                                                            icon={<AlertCircle className="size-7" />}
                                                        />
                                                    </td>
                                                </tr>
                                            ) : (
                                                reportsData.data.map((r) => (
                                                    <tr
                                                        key={r.report_id}
                                                        className={cn(
                                                            'border-b last:border-0 hover:bg-muted/50 cursor-pointer',
                                                            selectedReportId === r.report_id && 'bg-primary/5',
                                                            r.status === 'pending' && r.waiting_minutes > 5 && 'bg-red-500/5'
                                                        )}
                                                        onClick={() => setSelectedReportId(
                                                            selectedReportId === r.report_id ? null : r.report_id
                                                        )}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono font-medium text-primary">{r.report_id}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={statusBadgeVariant(r.status)}>
                                                                {statuses[r.status] ?? r.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {categories[r.category] ?? r.category}
                                                        </td>
                                                        <td className="px-4 py-3 max-w-[180px] truncate" title={r.address}>
                                                            {r.address}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {r.sender_name ?? '–'}
                                                            {r.sender_phone && (
                                                                <span className="block text-xs text-muted-foreground">{r.sender_phone}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn(
                                                                'text-sm',
                                                                r.waiting_minutes > 5 && 'text-red-500 font-medium'
                                                            )}>
                                                                {r.waiting_minutes} menit
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                                                                    <Link href={`/emergency-reports/${r.report_id}`}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                {r.officer_location && (
                                                                    <span className="text-xs text-green-600 font-medium">
                                                                        🚗 {r.officer_location.eta_minutes}m
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {reportsData.last_page > 1 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                                        {reportsData.links.map((link, i) => (
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
                            </CardContent>
                        </Card>

                        <p className="text-sm text-muted-foreground mt-2">
                            Total: {reportsData.total} laporan
                        </p>
                    </div>

                    {/* Active Officers Panel */}
                    <div className={cn(viewMode === 'map' && 'hidden lg:hidden')}>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Petugas Aktif ({activeOfficersData.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y max-h-[500px] overflow-y-auto">
                                    {activeOfficersData.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            Tidak ada petugas aktif
                                        </div>
                                    ) : (
                                        activeOfficersData.map(officer => (
                                            <div key={officer.officer_id} className="p-3 hover:bg-muted/50">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium text-sm">{officer.officer_name || 'Petugas'}</div>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                                        Aktif
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{officer.report_id}</span>
                                                    {officer.speed_kmh && (
                                                        <span>• {officer.speed_kmh} km/jam</span>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-xs">
                                                    <span className="text-green-600">
                                                        🚗 ~{officer.eta_minutes} menit
                                                    </span>
                                                    <span className="ml-2 text-muted-foreground">
                                                        {formatDistance(officer.distance_meters)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}