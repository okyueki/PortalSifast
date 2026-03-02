import { Head, Link, router, useForm } from '@inertiajs/react';
import { Activity, Calendar, User, MessageSquare, FileEdit, Paperclip, CheckCircle } from 'lucide-react';
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
    { title: 'Aktivitas Harian', href: '/reports/daily-activity' },
];

type ActivityItem = {
    id: number;
    action: string;
    action_label: string;
    old_value: string | null;
    new_value: string | null;
    description: string | null;
    created_at: string;
    ticket: { id: number; title: string } | null;
};

type SummaryItem = {
    action: string;
    count: number;
    action_label: string;
};

type UserOption = { id: number; name: string };

type Props = {
    activities: ActivityItem[];
    summary: SummaryItem[];
    date: string;
    targetUser: UserOption | null;
    usersForFilter: UserOption[];
    canSelectUser: boolean;
    currentUserId: number;
    filters: { date: string; user_id: number | null };
};

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DailyActivityReport({
    activities,
    summary,
    date,
    targetUser,
    usersForFilter,
    canSelectUser,
    currentUserId,
    filters,
}: Props) {
    const { data, setData } = useForm({
        date: filters.date,
        user_id: filters.user_id === currentUserId ? '__me__' : (filters.user_id ? String(filters.user_id) : '__me__'),
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('date', data.date);
        if (data.user_id && data.user_id !== '__me__') params.set('user_id', data.user_id);
        router.get(`/reports/daily-activity?${params.toString()}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aktivitas Harian" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Aktivitas Harian</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Apa yang dilakukan user pada tiket per hari: komentar, ubah status, lampiran, dll. Bukan hanya tiket selesai — kerja yang belum selesai tetap terlihat dari aktivitasnya.
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
                            Pilih tanggal dan (untuk admin) user yang ingin dilihat aktivitasnya.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Tanggal</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                />
                            </div>
                            {canSelectUser && usersForFilter.length > 0 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="user_id">User</Label>
                                    <Select
                                        value={data.user_id}
                                        onValueChange={(v) => setData('user_id', v)}
                                    >
                                        <SelectTrigger id="user_id" className="w-56">
                                            <SelectValue placeholder="Pilih user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__me__">Saya</SelectItem>
                                            {usersForFilter.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name}
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

                {targetUser && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <User className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">User</p>
                                        <p className="font-semibold">{targetUser.name}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Calendar className="size-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal</p>
                                        <p className="font-semibold">{date}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                        <Activity className="size-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total aktivitas</p>
                                        <p className="font-semibold">{activities.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                        <CheckCircle className="size-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Jenis aksi</p>
                                        <p className="font-semibold">{summary.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {summary.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Ringkasan per jenis aksi</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Berapa kali setiap jenis aktivitas dilakukan pada hari ini.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        {summary.map((s) => (
                                            <div
                                                key={s.action}
                                                className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2"
                                            >
                                                {s.action === 'commented' && <MessageSquare className="size-4 text-muted-foreground" />}
                                                {s.action === 'status_changed' && <FileEdit className="size-4 text-muted-foreground" />}
                                                {s.action === 'attachment_added' && <Paperclip className="size-4 text-muted-foreground" />}
                                                {s.action === 'closed' && <CheckCircle className="size-4 text-emerald-600" />}
                                                {!['commented', 'status_changed', 'attachment_added', 'closed'].includes(s.action) && (
                                                    <Activity className="size-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm font-medium">{s.action_label}</span>
                                                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                                                    {s.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activities.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                    Tidak ada aktivitas tiket tercatat untuk user ini pada tanggal ini.
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Daftar aktivitas (urutan terbaru)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="pb-2 font-medium">Waktu</th>
                                                    <th className="pb-2 font-medium">Aksi</th>
                                                    <th className="pb-2 font-medium">Tiket</th>
                                                    <th className="pb-2 font-medium">Detail</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activities.map((a) => (
                                                    <tr key={a.id} className="border-b last:border-0">
                                                        <td className="py-3 font-mono text-muted-foreground">
                                                            {formatTime(a.created_at)}
                                                        </td>
                                                        <td className="py-3">{a.action_label}</td>
                                                        <td className="py-3">
                                                            {a.ticket ? (
                                                                <Link
                                                                    href={`/tickets/${a.ticket.id}`}
                                                                    className="font-medium text-primary hover:underline"
                                                                >
                                                                    #{a.ticket.id} {a.ticket.title.slice(0, 40)}
                                                                    {a.ticket.title.length > 40 ? '…' : ''}
                                                                </Link>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                        <td className="max-w-xs py-3 text-muted-foreground">
                                                            {a.description && <span>{a.description}</span>}
                                                            {!a.description && a.old_value != null && a.new_value != null && (
                                                                <span>
                                                                    {a.old_value} → {a.new_value}
                                                                </span>
                                                            )}
                                                            {!a.description && (a.old_value == null || a.new_value == null) && '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {!targetUser && (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            Pilih user (dan tanggal) lalu klik Terapkan untuk melihat aktivitas.
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
