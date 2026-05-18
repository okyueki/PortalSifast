import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, User, Phone, MessageSquare, Clock, AlertCircle, Navigation, Map } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import EmergencyMap, { type ReportMarker, type OfficerMarker } from '@/components/ui/emergency-map';
import { useEmergencyBroadcast, type OfficerLocationUpdatedEvent } from '@/hooks/use-emergency-broadcast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Emergency', href: '/emergency-reports' },
];

type LocationHistory = {
    latitude: number;
    longitude: number;
    speed_kmh: number | null;
    eta_minutes: number | null;
    distance_meters: number | null;
    updated_at: string;
};

type Report = {
    report_id: string;
    status: string;
    category: string;
    latitude: number;
    longitude: number;
    address: string;
    sender_name: string | null;
    sender_phone: string | null;
    notes: string | null;
    response_notes: string | null;
    assigned_team: string | null;
    created_at: string;
    responded_at: string | null;
    arrived_at: string | null;
    resolved_at: string | null;
    destination_type: string | null;
    destination_name: string | null;
    waiting_minutes: number;
    operator: { id: number; name: string; phone: string | null } | null;
    photo_url: string | null;
    officer_location: {
        latitude: number;
        longitude: number;
        eta_minutes: number;
        distance_meters: number;
        speed_kmh: number | null;
        updated_at: string;
    } | null;
    location_history: LocationHistory[];
};

type Props = {
    report: Report;
    statuses: Record<string, string>;
    categories: Record<string, string>;
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    responded: 'Direspons',
    in_progress: 'Dalam Perjalanan',
    arrived: 'Sampai',
    resolved: 'Selesai',
    cancelled: 'Dibatalkan',
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

function statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-700 border-amber-500/50',
        responded: 'bg-blue-500/20 text-blue-700 border-blue-500/50',
        in_progress: 'bg-orange-500/20 text-orange-700 border-orange-500/50',
        arrived: 'bg-green-500/20 text-green-700 border-green-500/50',
        resolved: 'bg-slate-500/20 text-slate-600 border-slate-500/50',
        cancelled: 'bg-slate-500/20 text-slate-600 border-slate-500/50',
    };
    return map[status] ?? 'bg-slate-500/20';
}

export default function EmergencyReportsShow({ report, statuses, categories }: Props) {
    const [reportData, setReportData] = useState(report);
    const [showMap, setShowMap] = useState(false);

    const respondForm = useForm({
        status: report.status === 'pending' ? 'responded' : report.status,
        notes: report.response_notes ?? '',
        assigned_team: report.assigned_team ?? '',
        destination_type: report.destination_type ?? '',
        destination_name: report.destination_name ?? '',
    });

    const canRespond = report.status !== 'cancelled' && report.status !== 'resolved';
    const canMarkArrived = report.status === 'in_progress';
    const canResolve = report.status === 'in_progress' || report.status === 'arrived';

    // WebSocket for real-time officer location updates
    useEmergencyBroadcast({
        onOfficerLocationUpdated: useCallback((event: OfficerLocationUpdatedEvent) => {
            if (event.report_id === reportData.report_id) {
                setReportData(prev => ({
                    ...prev,
                    officer_location: {
                        latitude: event.latitude,
                        longitude: event.longitude,
                        eta_minutes: event.eta_minutes,
                        distance_meters: event.distance_meters,
                        speed_kmh: event.speed_kmh,
                        updated_at: event.updated_at,
                    },
                    location_history: [
                        {
                            latitude: event.latitude,
                            longitude: event.longitude,
                            speed_kmh: event.speed_kmh,
                            eta_minutes: event.eta_minutes,
                            distance_meters: event.distance_meters,
                            updated_at: event.updated_at,
                        },
                        ...prev.location_history.slice(0, 9), // Keep last 10
                    ],
                }));
            }
        }, [reportData.report_id]),
        enabled: true,
    });

    const handleRespond = (e: React.FormEvent) => {
        e.preventDefault();
        respondForm.patch(`/emergency-reports/${reportData.report_id}/respond`, {
            preserveScroll: true,
        });
    };

    // Map data
    const reportMarker: ReportMarker = {
        report_id: reportData.report_id,
        status: reportData.status,
        category: reportData.category,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address,
        sender_name: reportData.sender_name,
        sender_phone: reportData.sender_phone,
        waiting_minutes: reportData.waiting_minutes,
        officer_location: reportData.officer_location,
    };

    const officerMarker: OfficerMarker | null = reportData.officer_location ? {
        officer_id: reportData.operator?.id ?? 0,
        officer_name: reportData.operator?.name ?? 'Petugas',
        report_id: reportData.report_id,
        latitude: reportData.officer_location.latitude,
        longitude: reportData.officer_location.longitude,
        eta_minutes: reportData.officer_location.eta_minutes,
        distance_meters: reportData.officer_location.distance_meters,
        speed_kmh: reportData.officer_location.speed_kmh,
        updated_at: reportData.officer_location.updated_at,
    } : null;

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: reportData.report_id, href: `/emergency-reports/${reportData.report_id}` }]}>
            <Head title={`Laporan ${reportData.report_id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/emergency-reports">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold font-mono">{reportData.report_id}</h1>
                        <p className="text-sm text-muted-foreground">
                            {categories[reportData.category] ?? reportData.category} · {formatDate(reportData.created_at)}
                        </p>
                    </div>
                    <Badge variant="outline" className={cn('text-sm font-medium px-3 py-1', statusBadgeClass(reportData.status))}>
                        {statusLabels[reportData.status] ?? reportData.status}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                    >
                        <Map className="h-4 w-4 mr-2" />
                        {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
                    </Button>
                </div>

                {/* Map Section */}
                {showMap && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Navigation className="h-4 w-4" />
                                Tracking Petugas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <EmergencyMap
                                reports={[reportMarker]}
                                officers={officerMarker ? [officerMarker] : []}
                                selectedReportId={reportData.report_id}
                                height="400px"
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Officer Location Info (Real-time) */}
                {reportData.officer_location && (
                    <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <Navigation className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Petugas sedang dalam perjalanan</p>
                                        {reportData.operator && (
                                            <p className="text-xs text-muted-foreground">{reportData.operator.name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-600">~{reportData.officer_location.eta_minutes} menit</p>
                                    <p className="text-sm text-muted-foreground">{formatDistance(reportData.officer_location.distance_meters)}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm">
                                {reportData.officer_location.speed_kmh && (
                                    <span className="text-muted-foreground">
                                        🚗 {reportData.officer_location.speed_kmh} km/jam
                                    </span>
                                )}
                                <span className="text-muted-foreground">
                                    Update: {formatDate(reportData.officer_location.updated_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Left Column - Report Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="h-4 w-4" />
                                Detail Laporan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Alamat</p>
                                <p className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    {reportData.address}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Pelapor</p>
                                    <p className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {reportData.sender_name ?? '–'}
                                    </p>
                                </div>
                                {reportData.sender_phone && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">No. HP</p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a href={`tel:${reportData.sender_phone}`} className="text-primary hover:underline">
                                                {reportData.sender_phone}
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Koordinat</p>
                                <p className="font-mono text-sm">{reportData.latitude}, {reportData.longitude}</p>
                            </div>
                            {reportData.notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Catatan pelapor</p>
                                    <p className="flex items-start gap-2">
                                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        {reportData.notes}
                                    </p>
                                </div>
                            )}
                            {reportData.photo_url && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Foto</p>
                                    <a href={reportData.photo_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={reportData.photo_url}
                                            alt="Foto kejadian"
                                            className="max-h-48 rounded border object-cover"
                                        />
                                    </a>
                                </div>
                            )}
                            <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Menunggu respons</p>
                                <p className={cn(
                                    'text-lg font-bold',
                                    reportData.waiting_minutes > 5 && 'text-red-600'
                                )}>
                                    {reportData.waiting_minutes} menit
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column - Handling */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4" />
                                Penanganan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {reportData.responded_at && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Direspons pada</p>
                                    <p>{formatDate(reportData.responded_at)}</p>
                                </div>
                            )}
                            {reportData.arrived_at && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Sampai di lokasi</p>
                                    <p>{formatDate(reportData.arrived_at)}</p>
                                </div>
                            )}
                            {reportData.operator && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Operator</p>
                                    <p>{reportData.operator.name}</p>
                                    {reportData.operator.phone && (
                                        <p className="text-sm text-muted-foreground">{reportData.operator.phone}</p>
                                    )}
                                </div>
                            )}
                            {reportData.assigned_team && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Tim</p>
                                    <p>{reportData.assigned_team}</p>
                                </div>
                            )}
                            {reportData.response_notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Catatan respons</p>
                                    <p className="whitespace-pre-wrap">{reportData.response_notes}</p>
                                </div>
                            )}
                            {reportData.resolved_at && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Selesai pada</p>
                                    <p>{formatDate(reportData.resolved_at)}</p>
                                </div>
                            )}
                            {reportData.destination_type && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-xs font-medium text-muted-foreground">Tujuan Akhir</p>
                                    <p className="font-medium">
                                        {reportData.destination_type === 'rs_kita' ? 'RS Kita' : 'Dirujuk'}:
                                        {reportData.destination_name ?? '-'}
                                    </p>
                                </div>
                            )}

                            {canRespond && (
                                <form onSubmit={handleRespond} className="mt-4 space-y-3 rounded border bg-muted/30 p-3">
                                    <p className="text-sm font-medium">Perbarui Status</p>
                                    <div>
                                        <Label className="text-xs">Status</Label>
                                        <Select
                                            value={respondForm.data.status}
                                            onValueChange={(v) => respondForm.setData('status', v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="responded">{statuses.responded}</SelectItem>
                                                <SelectItem value="in_progress">{statuses.in_progress}</SelectItem>
                                                {canMarkArrived && <SelectItem value="arrived">{statuses.arrived}</SelectItem>}
                                                {canResolve && <SelectItem value="resolved">{statuses.resolved}</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Destination fields for resolved status */}
                                    {respondForm.data.status === 'resolved' && (
                                        <>
                                            <div>
                                                <Label className="text-xs">Tipe Tujuan</Label>
                                                <Select
                                                    value={respondForm.data.destination_type}
                                                    onValueChange={(v) => respondForm.setData('destination_type', v)}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Pilih tipe" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="rs_kita">RS Kita</SelectItem>
                                                        <SelectItem value="rujuk">Dirujuk ke RS Lain</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Nama RS / Tujuan</Label>
                                                <input
                                                    type="text"
                                                    value={respondForm.data.destination_name}
                                                    onChange={(e) => respondForm.setData('destination_name', e.target.value)}
                                                    placeholder="Contoh: RSUD Surabaya"
                                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <Label className="text-xs">Tim yang ditugaskan (opsional)</Label>
                                        <input
                                            type="text"
                                            value={respondForm.data.assigned_team}
                                            onChange={(e) => respondForm.setData('assigned_team', e.target.value)}
                                            placeholder="Contoh: Tim Alpha"
                                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Catatan respons</Label>
                                        <Textarea
                                            value={respondForm.data.notes}
                                            onChange={(e) => respondForm.setData('notes', e.target.value)}
                                            placeholder="Catatan untuk pelapor"
                                            rows={2}
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button type="submit" size="sm" disabled={respondForm.processing}>
                                        {respondForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Location History */}
                {reportData.location_history.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Navigation className="h-4 w-4" />
                                Riwayat Lokasi Petugas ({reportData.location_history.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-2 font-medium">Waktu</th>
                                            <th className="px-4 py-2 font-medium">Latitude</th>
                                            <th className="px-4 py-2 font-medium">Longitude</th>
                                            <th className="px-4 py-2 font-medium">Speed</th>
                                            <th className="px-4 py-2 font-medium">ETA</th>
                                            <th className="px-4 py-2 font-medium">Jarak</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.location_history.map((loc, index) => (
                                            <tr key={index} className="border-b last:border-0">
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {formatDate(loc.updated_at)}
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs">{loc.latitude}</td>
                                                <td className="px-4 py-2 font-mono text-xs">{loc.longitude}</td>
                                                <td className="px-4 py-2">{loc.speed_kmh ? `${loc.speed_kmh} km/jam` : '–'}</td>
                                                <td className="px-4 py-2">{loc.eta_minutes ? `${loc.eta_minutes} menit` : '–'}</td>
                                                <td className="px-4 py-2">{loc.distance_meters ? formatDistance(loc.distance_meters) : '–'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}