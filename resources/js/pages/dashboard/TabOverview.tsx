import { Link } from '@inertiajs/react';
import {
    Ticket,
    UserCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    ListTodo,
    Users,
    ArrowRight,
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

const statCards = [
    {
        href: '/tickets',
        label: 'Tiket Open',
        sublabel: 'Belum selesai',
        value: (p: Props) => p.stats.total_open,
        icon: ListTodo,
        bgClass: 'bg-primary/10 text-primary',
    },
    {
        href: '/tickets?include_closed=1&status=7',
        label: 'Ditutup',
        sublabel: 'Bulan ini',
        value: (p: Props) => p.stats.total_closed_month,
        icon: CheckCircle,
        bgClass: 'bg-primary/10 text-primary',
    },
    {
        href: '/tickets?status=6',
        label: 'Tertunda',
        sublabel: 'Melewati SLA',
        value: (p: Props) => p.stats.overdue,
        icon: AlertTriangle,
        bgClass: 'bg-destructive/10 text-destructive',
    },
    {
        href: '/tickets?assignee=me',
        label: 'Ditugaskan',
        sublabel: (p: Props) => `${p.stats.unassigned} belum ditugaskan`,
        value: (p: Props) => p.stats.assigned_to_me,
        icon: Clock,
        bgClass: 'bg-primary/10 text-primary',
    },
];

export default function TabOverview(props: Props) {
    return (
        <div className="space-y-6">
            <QuickActionsBar />

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="group card-refined block rounded-xl border border-border p-5"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {card.label}
                                </span>
                                <div className={`flex size-8 items-center justify-center rounded-lg ${card.bgClass}`}>
                                    <Icon className="size-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold tracking-tight text-foreground">
                                {card.value(props)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {typeof card.sublabel === 'function'
                                    ? card.sublabel(props)
                                    : card.sublabel}
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                <span>Lihat</span>
                                <ArrowRight className="size-3" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <UserPresenceWidget />

            {/* Ticket Lists */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Tiket Terbaru */}
                <Card className="card-refined overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/30 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Tiket Terbaru</CardTitle>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                                Baru
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        {props.recentTickets.length > 0 ? (
                            <ul className="space-y-2">
                                {props.recentTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-all duration-150 hover:border-primary/30 hover:bg-primary/[0.02]"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-semibold text-primary">
                                                    {t.ticket_number}
                                                </span>
                                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(t.status?.color)}`}>
                                                    {t.status?.name}
                                                </Badge>
                                            </div>
                                            <p className="text-sm leading-snug text-foreground line-clamp-2">
                                                {t.title}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="size-3" />
                                                    {t.requester?.name || '-'}
                                                </span>
                                                {t.assignee ? (
                                                    <span className="flex items-center gap-1">
                                                        <ArrowRight className="size-2 opacity-50" />
                                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                                                            {t.assignee.name.split(' ')[0]}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                                        Belum ditugaskan
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <CheckCircle className="size-5 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">Belum ada tiket baru</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tiket Terlambat */}
                <Card className="card-refined overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-destructive/5 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                                <AlertTriangle className="size-4" />
                                Tertunda
                            </CardTitle>
                            {props.overdueTickets.length > 0 && (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                    {props.overdueTickets.length}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        {props.overdueTickets.length > 0 ? (
                            <ul className="space-y-2">
                                {props.overdueTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="group flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 transition-all duration-150 hover:border-destructive/40 hover:bg-destructive/10"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-semibold text-destructive">
                                                    {t.ticket_number}
                                                </span>
                                                <span className="text-[10px] font-medium text-destructive">
                                                    {t.resolution_due_at
                                                        ? `${new Date(t.resolution_due_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`
                                                        : 'Tanpa SLA'}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-snug text-foreground line-clamp-2">
                                                {t.title}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="size-3" />
                                                    {t.requester?.name || '-'}
                                                </span>
                                                {!t.assignee && (
                                                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                                        Perlu ditugaskan!
                                                    </span>
                                                )}
                                                {t.assignee && (
                                                    <span className="flex items-center gap-1">
                                                        <ArrowRight className="size-2 opacity-50" />
                                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                                                            {t.assignee.name.split(' ')[0]}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <CheckCircle className="size-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-primary">Tidak ada tiket terlambat</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Semua ticket dalam kondisi baik</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tiket Belum Diselesaikan */}
                <Card className="card-refined overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/30 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Clock className="size-4 text-primary" />
                                Belum Selesai
                            </CardTitle>
                            {props.unresolvedTickets.length > 0 && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    {props.unresolvedTickets.length}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        {props.unresolvedTickets.length > 0 ? (
                            <ul className="space-y-2">
                                {props.unresolvedTickets.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/tickets/${t.id}`}
                                            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-all duration-150 hover:border-primary/30 hover:bg-primary/[0.02]"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-semibold text-primary">
                                                    {t.ticket_number}
                                                </span>
                                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(t.status?.color)}`}>
                                                    {t.status?.name}
                                                </Badge>
                                            </div>
                                            <p className="text-sm leading-snug text-foreground line-clamp-2">
                                                {t.title}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="size-3" />
                                                    {t.requester?.name || '-'}
                                                </span>
                                                {t.assignee && (
                                                    <span className="flex items-center gap-1">
                                                        <ArrowRight className="size-2 opacity-50" />
                                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                                                            {t.assignee.name.split(' ')[0]}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <CheckCircle className="size-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-primary">Semua ticket selesai</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Tidak ada ticket menggantung</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    { href: '/tickets', icon: Ticket, label: 'Tiket', desc: 'Kelola semua ticket' },
                    { href: '/pegawai', icon: UserCircle, label: 'Daftar Pegawai', desc: 'Data & profil' },
                    { href: '/users', icon: Users, label: 'Daftar User', desc: 'Kelola akses' },
                ].map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group card-refined flex items-center gap-4 rounded-xl border border-border p-4"
                        >
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-semibold text-foreground">{link.label}</span>
                                <span className="block text-xs text-muted-foreground">{link.desc}</span>
                            </div>
                            <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    );
                })}
            </div>

            <UserOnlineStatus />
            <QuickCreateButton />
        </div>
    );
}
