import { Head, Link } from '@inertiajs/react';
import {
    Ticket,
    UserCircle,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    ListTodo,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserPresenceWidget from '@/components/user-presence-widget';
import UserOnlineStatus from '@/components/user-online-status';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Ticket as TicketType } from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type DashboardStats = {
    total_open: number;
    total_closed_month: number;
    overdue: number;
    assigned_to_me: number;
    unassigned: number;
    by_status: Record<string, number>;
    by_department: Record<string, number>;
};

type Props = {
    stats: DashboardStats;
    recentTickets: TicketType[];
    overdueTickets: TicketType[];
    onlineUsers: {
        count: number;
        users: Array<{
            id: number;
            name: string;
            email: string;
            avatar_url?: string;
        }>;
    };
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

export default function Dashboard({
    stats,
    recentTickets,
    overdueTickets,
    onlineUsers,
}: Props) {
    const quickLinks = [
        {
            title: 'Tiket',
            href: '/tickets',
            icon: Ticket,
            gradient: 'bg-primary',
            hover: 'hover:opacity-90 hover:-translate-y-0.5',
        },
        {
            title: 'Daftar Pegawai',
            href: '/pegawai',
            icon: UserCircle,
            gradient: 'bg-primary',
            hover: 'hover:opacity-90 hover:-translate-y-0.5',
        },
        {
            title: 'Daftar User',
            href: '/users',
            icon: Users,
            gradient: 'bg-primary',
            hover: 'hover:opacity-90 hover:-translate-y-0.5',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Selamat datang
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola tiket, pegawai, dan user akses aplikasi dari sini.
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Selesai (Bulan Ini)
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Terlambat
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
                    <Card>
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
                </div>

                {/* User Online Widget */}
                <div className="mt-6">
                    <UserPresenceWidget />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent tickets */}
                    <Card>
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
                                                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
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
                                                        <span className="text-foreground">{t.requester?.name || '-'}</span>
                                                    </span>
                                                    {t.assignee ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-muted-foreground">→</span>
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
                                    Belum ada tiket
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Overdue tickets */}
                    {overdueTickets.length > 0 && (
                        <Card className="border-destructive/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-destructive">
                                    Tiket Terlambat
                                </CardTitle>
                                <Link
                                    href="/tickets?assignee=me"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Lihat
                                </Link>
                            </CardHeader>
                            <CardContent>
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
                                                        <span className="text-foreground">{t.requester?.name || '-'}</span>
                                                    </span>
                                                    {t.assignee ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-muted-foreground">→</span>
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
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickLinks.map(
                        ({ title, href, icon: Icon, gradient, hover }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 ${hover} dark:border-white/10`}
                            >
                                <div
                                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${gradient} text-primary-foreground shadow-md`}
                                >
                                    <Icon className="size-6" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-semibold text-foreground">
                                        {title}
                                    </span>
                                </div>
                            </Link>
                        ),
                    )}
                </div>

                {/* Floating User Online Status */}
                <UserOnlineStatus />
            </div>
        </AppLayout>
    );
}
