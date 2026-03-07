import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, User, Phone, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan Darurat', href: '/emergency-reports' },
];

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
    resolved_at: string | null;
    operator: { id: number; name: string; phone: string | null } | null;
    photo_url: string | null;
};

type Props = {
    report: Report;
    statuses: Record<string, string>;
    categories: Record<string, string>;
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

function statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-700 border-amber-500/50',
        responded: 'bg-blue-500/20 text-blue-700 border-blue-500/50',
        in_progress: 'bg-orange-500/20 text-orange-700 border-orange-500/50',
        resolved: 'bg-green-500/20 text-green-700 border-green-500/50',
        cancelled: 'bg-slate-500/20 text-slate-600 border-slate-500/50',
    };
    return map[status] ?? 'bg-slate-500/20';
}

export default function EmergencyReportsShow({ report, statuses, categories }: Props) {
    const respondForm = useForm({
        status: report.status === 'pending' ? 'responded' : report.status,
        notes: report.response_notes ?? '',
        assigned_team: report.assigned_team ?? '',
    });

    const canRespond = report.status !== 'cancelled' && report.status !== 'resolved';

    const handleRespond = (e: React.FormEvent) => {
        e.preventDefault();
        respondForm.patch(`/emergency-reports/${report.report_id}/respond`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: report.report_id, href: `/emergency-reports/${report.report_id}` }]}>
            <Head title={`Laporan ${report.report_id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/emergency-reports">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold font-mono">{report.report_id}</h1>
                        <p className="text-sm text-muted-foreground">
                            {categories[report.category] ?? report.category} · {formatDate(report.created_at)}
                        </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusBadgeClass(report.status)}`}>
                        {statuses[report.status] ?? report.status}
                    </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                                    {report.address}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Pelapor</p>
                                    <p className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {report.sender_name ?? '–'}
                                    </p>
                                </div>
                                {report.sender_phone && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">No. HP</p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {report.sender_phone}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Koordinat</p>
                                <p className="font-mono text-sm">{report.latitude}, {report.longitude}</p>
                            </div>
                            {report.notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Catatan pelapor</p>
                                    <p className="flex items-start gap-2">
                                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        {report.notes}
                                    </p>
                                </div>
                            )}
                            {report.photo_url && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Foto</p>
                                    <a href={report.photo_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={report.photo_url}
                                            alt="Foto kejadian"
                                            className="max-h-48 rounded border object-cover"
                                        />
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4" />
                                Penanganan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {report.responded_at && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Direspons pada</p>
                                    <p>{formatDate(report.responded_at)}</p>
                                </div>
                            )}
                            {report.operator && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Operator</p>
                                    <p>{report.operator.name}</p>
                                    {report.operator.phone && (
                                        <p className="text-sm text-muted-foreground">{report.operator.phone}</p>
                                    )}
                                </div>
                            )}
                            {report.assigned_team && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Tim</p>
                                    <p>{report.assigned_team}</p>
                                </div>
                            )}
                            {report.response_notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Catatan respons</p>
                                    <p className="whitespace-pre-wrap">{report.response_notes}</p>
                                </div>
                            )}
                            {report.resolved_at && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Selesai pada</p>
                                    <p>{formatDate(report.resolved_at)}</p>
                                </div>
                            )}

                            {canRespond && (
                                <form onSubmit={handleRespond} className="mt-4 space-y-3 rounded border bg-muted/30 p-3">
                                    <p className="text-sm font-medium">Perbarui status / respons</p>
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
                                                <SelectItem value="resolved">{statuses.resolved}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                            rows={3}
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
            </div>
        </AppLayout>
    );
}
