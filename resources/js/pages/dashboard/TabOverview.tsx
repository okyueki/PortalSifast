import { Link } from '@inertiajs/react';
import {
    Ticket,
    UserCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    ListTodo,
    Users,
} from 'lucide-react';
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { QuickCreateButton } from '@/components/dashboard/QuickCreateButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserOnlineStatus from '@/components/user-online-status';
import UserPresenceWidget from '@/components/user-presence-widget';
import type { Ticket as TicketType } from '@/types/ticket';

type Props = {
    stats: {
        total_open: number;
        total_closed_month: number;
        overdue: number;
        assigned_to_me: number;
        unassigned: number;
    };
    recentTickets: TicketType[];
    overdueTickets: TicketType[];
    unresolvedTickets: TicketType[];
};

function getStatusColor(color: string | undefined): string {
    const map: Record<string, string> = {
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:text-blue-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:text-green-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:text-orange-300',
        purple: 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:text-purple-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    };
    return (color && map[color]) || map.gray;
}

export default function TabOverview({
    stats,
    recentTickets,
    overdueTickets,
    unresolvedTickets,
}: Props) {
    return (
        <div className="space-y-6">
            <QuickActionsBar />

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/tickets">
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tiket Open
                            </CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_open}</div>
                            <p className="text-xs text-muted-foreground">
                                Belum selesai
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/tickets?include_closed=1&status=7">
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Ditutup
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_closed_month}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ditutup bulan ini
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link
                    href={`/tickets?created_from=${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                    ).padStart(2, '0')}-01&created_to=${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                    ).padStart(2, '0')}-31&status=6`}
                >
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-destructive/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tertunda
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {stats.overdue}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Melewati target SLA
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link
                    href={`/tickets?assignee=me&created_from=${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                    ).padStart(2, '0')}-01&created_to=${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                    ).padStart(2, '0')}-31&include_closed=1`}
                >
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Ditugaskan ke Saya
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.assigned_to_me}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.unassigned} belum ditugaskan
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* User Online Widget */}
            <div className="mt-6">
                <UserPresenceWidget />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tiket Terbaru — hanya status Baru */}
                <Card className="border-yellow-200 dark:border-yellow-800/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tiket Terbaru</CardTitle>
                        <Link
                            href="/tickets"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Lihat semua
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentTickets.length > 0 ? (
                            <ul className="space-y-3">
                                {recentTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="block rounded-lg border border-yellow-300/60 bg-yellow-50/80 p-3 transition-colors hover:bg-yellow-100/80 dark:border-yellow-700/50 dark:bg-yellow-950/30 dark:hover:bg-yellow-900/40"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {t.ticket_number}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(
                                                        t.status?.color
                                                    )}
                                                >
                                                    {t.status?.name}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 truncate text-sm">
                                                {t.title}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="h-3 w-3" />
                                                    <span className="text-foreground">
                                                        {t.requester?.name || '-'}
                                                    </span>
                                                </span>
                                                {t.assignee ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">
                                                            →
                                                        </span>
                                                        <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            {t.assignee.name}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        Belum ditugaskan
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada tiket dengan status Baru
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Tiket Terlambat */}
                <Card className="border-destructive/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-destructive">
                            Tiket Menggantung
                        </CardTitle>
                        <Link
                            href="/tickets"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Lihat
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {overdueTickets.length > 0 ? (
                            <ul className="space-y-3">
                                {overdueTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="block rounded-lg border border-destructive/30 bg-destructive/5 p-3 transition-colors hover:bg-destructive/10"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {t.ticket_number}
                                                </span>
                                                <span className="text-xs text-destructive">
                                                    Target:{' '}
                                                    {t.resolution_due_at
                                                        ? new Date(
                                                              t.resolution_due_at
                                                          ).toLocaleDateString(
                                                              'id-ID'
                                                          )
                                                        : '-'}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm">
                                                {t.title}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="h-3 w-3" />
                                                    <span className="text-foreground">
                                                        {t.requester?.name || '-'}
                                                    </span>
                                                </span>
                                                {t.assignee ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">
                                                            →
                                                        </span>
                                                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                            {t.assignee.name}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                        Belum ditugaskan!
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Tidak ada tiket terlambat
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Tiket Belum Diselesaikan */}
                <Card className="border-green-200 dark:border-green-800/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tiket Belum Diselesaikan</CardTitle>
                        <Link
                            href="/tickets"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Lihat semua
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {unresolvedTickets.length > 0 ? (
                            <ul className="space-y-3">
                                {unresolvedTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="block rounded-lg border border-green-300/60 bg-green-50/80 p-3 transition-colors hover:bg-green-100/80 dark:border-green-700/50 dark:bg-green-950/30 dark:hover:bg-green-900/40"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {t.ticket_number}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(
                                                        t.status?.color
                                                    )}
                                                >
                                                    {t.status?.name}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 truncate text-sm">
                                                {t.title}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="h-3 w-3" />
                                                    <span className="text-foreground">
                                                        {t.requester?.name || '-'}
                                                    </span>
                                                </span>
                                                {t.assignee ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">
                                                            →
                                                        </span>
                                                        <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            {t.assignee.name}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        Belum ditugaskan
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Tidak ada tiket belum diselesaikan
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                    href="/tickets"
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 dark:border-white/10"
                >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                        <Ticket className="size-6" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold text-foreground">Tiket</span>
                    </div>
                </Link>
                <Link
                    href="/pegawai"
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 dark:border-white/10"
                >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                        <UserCircle className="size-6" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold text-foreground">
                            Daftar Pegawai
                        </span>
                    </div>
                </Link>
                <Link
                    href="/users"
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 dark:border-white/10"
                >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                        <Users className="size-6" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold text-foreground">
                            Daftar User
                        </span>
                    </div>
                </Link>
            </div>

            {/* Floating User Online Status */}
            <UserOnlineStatus />

            <QuickCreateButton />
        </div>
    );
}