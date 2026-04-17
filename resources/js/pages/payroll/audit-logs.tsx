import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarIcon,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Filter,
    RefreshCw,
    User,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
    { title: 'Audit Logs', href: '/payroll/audit-logs' },
];

type LogItem = {
    id: number;
    user_name: string;
    action: string;
    action_label: string;
    action_color: string;
    model_type: string;
    model_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    description: string | null;
    ip_address: string | null;
    created_at: string;
    created_at_diff: string;
};

type UserOption = {
    id: number;
    name: string;
};

type PaginatedLogs = {
    data: LogItem[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    logs: PaginatedLogs;
    actions: Record<string, number>;
    users: UserOption[];
    filters: {
        action: string;
        user_id: number;
        date_from: string;
        date_to: string;
    };
};

export default function AuditLogs({ logs, actions, users, filters }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const applyFilters = () => {
        router.get('/payroll/audit-logs', localFilters, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setLocalFilters({ action: '', user_id: 0, date_from: '', date_to: '' });
        router.get('/payroll/audit-logs', {}, { preserveState: true, preserveScroll: true });
    };

    const getActionBadge = (item: LogItem) => {
        const colorMap: Record<string, string> = {
            emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
            violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
            gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };

        return (
            <Badge className={colorMap[item.action_color] || colorMap.gray}>
                {item.action_label}
            </Badge>
        );
    };

    const hasFilters = localFilters.action || localFilters.user_id || localFilters.date_from || localFilters.date_to;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log Payroll" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/payroll">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title="Audit Log"
                            description="Riwayat semua aktivitas pada modul Payroll"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />

                    <Select
                        value={localFilters.action || 'all'}
                        onValueChange={(v) => setLocalFilters({ ...localFilters, action: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Semua Aksi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Aksi</SelectItem>
                            {Object.entries(actions).map(([action, count]) => (
                                <SelectItem key={action} value={action}>
                                    {action} ({count})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={localFilters.user_id ? String(localFilters.user_id) : 'all'}
                        onValueChange={(v) => setLocalFilters({ ...localFilters, user_id: v === 'all' ? 0 : parseInt(v) })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Semua User" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua User</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={String(user.id)}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="w-[140px]"
                            value={localFilters.date_from}
                            onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })}
                            placeholder="Dari"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            className="w-[140px]"
                            value={localFilters.date_to}
                            onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                            placeholder="Sampai"
                        />
                    </div>

                    <Button onClick={applyFilters} size="sm">
                        Terapkan
                    </Button>

                    {hasFilters && (
                        <Button onClick={resetFilters} size="sm" variant="ghost">
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Reset
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="w-10 px-4 py-3"></th>
                                    <th className="px-4 py-3 text-left font-medium">Waktu</th>
                                    <th className="px-4 py-3 text-left font-medium">User</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                                    <th className="px-4 py-3 text-left font-medium">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            <ClipboardList className="mx-auto h-12 w-12 opacity-30" />
                                            <p className="mt-2">Belum ada audit log.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((item) => (
                                        <>
                                            <tr
                                                key={item.id}
                                                className={`border-b last:border-0 hover:bg-muted/40 cursor-pointer ${expandedId === item.id ? 'bg-muted/20' : ''}`}
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    {(item.old_values || item.new_values) && (
                                                        expandedId === item.id ? (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-muted-foreground text-xs">{item.created_at_diff}</div>
                                                    <div className="text-xs">{item.created_at}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {item.user_name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getActionBadge(item)}
                                                    {item.model_type && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {item.model_type}
                                                            {item.model_id && ` #${item.model_id}`}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 max-w-md truncate" title={item.description ?? ''}>
                                                    {item.description ?? '-'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                    {item.ip_address ?? '-'}
                                                </td>
                                            </tr>
                                            {expandedId === item.id && (item.old_values || item.new_values) && (
                                                <tr key={`${item.id}-details`} className="bg-muted/10">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            {item.old_values && (
                                                                <div>
                                                                    <div className="text-xs font-medium text-muted-foreground mb-2">Old Values</div>
                                                                    <pre className="rounded bg-red-50 p-3 text-xs overflow-auto dark:bg-red-950/30">
                                                                        {JSON.stringify(item.old_values, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {item.new_values && (
                                                                <div>
                                                                    <div className="text-xs font-medium text-muted-foreground mb-2">New Values</div>
                                                                    <pre className="rounded bg-emerald-50 p-3 text-xs overflow-auto dark:bg-emerald-950/30">
                                                                        {JSON.stringify(item.new_values, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {logs.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {logs.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button size="sm" variant={link.active ? 'default' : 'outline'} asChild>
                                            <Link href={link.url} preserveScroll preserveState>
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

                <div className="grid gap-4 md:grid-cols-4">
                    {Object.entries(actions).slice(0, 4).map(([action, count]) => (
                        <div key={action} className="rounded-lg border bg-card p-4">
                            <div className="text-sm text-muted-foreground capitalize">{action.replace('_', ' ')}</div>
                            <div className="text-2xl font-bold">{count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
