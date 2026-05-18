import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    MapPin,
    Phone,
    User,
    Clock,
    Volume2,
    VolumeX,
    CheckCircle,
    Navigation,
    Bell,
    RefreshCw,
    Ambulance,
    Heart,
    Activity,
    Zap,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlarmSound } from '@/hooks/use-alarm-sound';
import {
    useEmergencyBroadcast,
    type EmergencyReportCreatedEvent,
} from '@/hooks/use-emergency-broadcast';
import { cn } from '@/lib/utils';

const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Panic Staff', href: '/panic-staff' },
];

// Category icons
const categoryIcons: Record<string, typeof Ambulance> = {
    kecelakaan_lalu_lintas: Ambulance,
    ibu_hamil: Heart,
    serangan_jantung: Activity,
    serangan_stroke: Zap,
    home_care: Activity,
    ambulance: Ambulance,
};

const categoryLabels: Record<string, string> = {
    kecelakaan_lalu_lintas: 'Kecelakaan Lalu Lintas',
    ibu_hamil: 'Ibu Hamil',
    serangan_jantung: 'Serangan Jantung',
    serangan_stroke: 'Serangan Stroke',
    home_care: 'Home Care',
    ambulance: 'Ambulance',
};

type PendingReport = EmergencyReportCreatedEvent & {
    isAccepting?: boolean;
    accepted?: boolean;
    error?: string;
};

type Props = {
    pendingReports: PendingReport[];
};

export default function PanicStaffPage({ pendingReports: initialReports }: Props) {
    const [pendingReports, setPendingReports] = useState<PendingReport[]>(initialReports);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const { play, stop, isPlaying } = useAlarmSound({ enabled: soundEnabled });

    // WebSocket connection for real-time panic
    const { isConnected } = useEmergencyBroadcast({
        onReportCreated: useCallback((event: EmergencyReportCreatedEvent) => {
            // Add new panic to list if not already there
            setPendingReports(prev => {
                const exists = prev.some(r => r.report_id === event.report_id);
                if (exists) return prev;
                return [event, ...prev];
            });
            // Play alarm
            if (soundEnabled) {
                play('panic');
            }
        }, [soundEnabled, play]),
        enabled: true,
        channelName: 'emergency.command-center',
    });

    const acceptReport = useCallback(async (reportId: string) => {
        // Set accepting state
        setPendingReports(prev =>
            prev.map(r =>
                r.report_id === reportId ? { ...r, isAccepting: true } : r
            )
        );

        try {
            const response = await fetch(`/api/sifast/emergency/reports/${reportId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Authorization': `Bearer ${localStorage.getItem('officer_token') || ''}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setPendingReports(prev =>
                    prev.map(r =>
                        r.report_id === reportId ? { ...r, accepted: true, isAccepting: false } : r
                    )
                );
                stop();
                // Navigate to tracking page
                router.visit(`/panic-staff/track/${reportId}`);
            } else {
                setPendingReports(prev =>
                    prev.map(r =>
                        r.report_id === reportId ? { ...r, error: data.message, isAccepting: false } : r
                    )
                );
            }
        } catch (error) {
            setPendingReports(prev =>
                prev.map(r =>
                    r.report_id === reportId ? { ...r, error: 'Gagal accept laporan', isAccepting: false } : r
                )
            );
        }
    }, [stop]);

    const toggleSound = () => {
        if (soundEnabled) {
            stop();
        }
        setSoundEnabled(!soundEnabled);
    };

    const clearAccepted = () => {
        setPendingReports(prev => prev.filter(r => !r.accepted));
    };

    const waitingMinutes = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        return Math.floor(diff / 60000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panic Staff - Terima Tugas Darurat" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Panic Staff</h1>
                        <p className="text-sm text-muted-foreground">
                            Terima tugas panic button dari pengguna
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <Badge variant={isConnected ? 'default' : 'secondary'}>
                            {isConnected ? '🟢 Live' : '🔴 Offline'}
                        </Badge>

                        {/* Sound Toggle */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleSound}
                            title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
                        >
                            {soundEnabled ? (
                                <Volume2 className="h-5 w-5" />
                            ) : (
                                <VolumeX className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Clear Accepted */}
                        {pendingReports.some(r => r.accepted) && (
                            <Button variant="outline" onClick={clearAccepted}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Clear Selesai
                            </Button>
                        )}
                    </div>
                </div>

                {/* Alert Banner */}
                {pendingReports.filter(r => !r.accepted).length > 0 && (
                    <Card className="border-red-500 bg-red-500/10">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                                <Bell className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-600 dark:text-red-400">
                                    {pendingReports.filter(r => !r.accepted).length} Laporan Darurat Menunggu
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Tekan ACCEPT untuk mengambil tugas
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pending Reports Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingReports.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="mb-4 rounded-full bg-green-500/20 p-4">
                                    <CheckCircle className="h-12 w-12 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold">Tidak Ada Laporan Darurat</h3>
                                <p className="text-sm text-muted-foreground">
                                    Anda akan menerima notifikasi saat ada panic button masuk
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingReports.map((report) => {
                            const CategoryIcon = categoryIcons[report.category] || AlertTriangle;
                            const isWaiting = waitingMinutes(report.created_at) > 5;

                            return (
                                <Card
                                    key={report.report_id}
                                    className={cn(
                                        'relative overflow-hidden transition-all',
                                        report.accepted && 'border-green-500 bg-green-500/5',
                                        !report.accepted && isWaiting && 'border-amber-500'
                                    )}
                                >
                                    {/* Urgency Indicator */}
                                    {!report.accepted && isWaiting && (
                                        <div className="absolute right-2 top-2">
                                            <Badge variant="destructive" className="animate-pulse">
                                                ⚠️ {waitingMinutes(report.created_at)} menit
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full',
                                                report.accepted ? 'bg-green-500/20' : 'bg-red-500/20'
                                            )}>
                                                <CategoryIcon className={cn(
                                                    'h-5 w-5',
                                                    report.accepted ? 'text-green-500' : 'text-red-500'
                                                )} />
                                            </div>
                                            <span className="text-base">
                                                {categoryLabels[report.category] || report.category}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* Report ID */}
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">ID:</span>{' '}
                                            <span className="font-mono font-medium">{report.report_id}</span>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            <span className="text-sm">{report.address || 'Lokasi tidak tersedia'}</span>
                                        </div>

                                        {/* Sender Info */}
                                        {report.sender_name && (
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{report.sender_name}</span>
                                            </div>
                                        )}

                                        {/* Phone */}
                                        {report.sender_phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <a
                                                    href={`tel:${report.sender_phone}`}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {report.sender_phone}
                                                </a>
                                            </div>
                                        )}

                                        {/* Time */}
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(report.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        {/* Error Message */}
                                        {report.error && (
                                            <div className="rounded-md bg-red-500/10 p-2 text-sm text-red-600">
                                                {report.error}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            {report.accepted ? (
                                                <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-500/20 py-2.5 text-green-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="font-medium">Sudah Diambil</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button
                                                        className="flex-1 bg-red-500 hover:bg-red-600"
                                                        onClick={() => acceptReport(report.report_id)}
                                                        disabled={report.isAccepting}
                                                    >
                                                        {report.isAccepting ? (
                                                            <>
                                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                                Memproses...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                ACCEPT
                                                            </>
                                                        )}
                                                    </Button>

                                                    {/* Open in Maps */}
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        title="Buka di Google Maps"
                                                    >
                                                        <Navigation className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Sound Test (for development) */}
                {process.env.NODE_ENV === 'development' && (
                    <Card className="fixed bottom-4 right-4 bg-muted/50">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-2">Test Alarm</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => play('panic')}>
                                    <Volume2 className="mr-1 h-3 w-3" /> Test
                                </Button>
                                <Button size="sm" variant="outline" onClick={stop}>
                                    Stop
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}