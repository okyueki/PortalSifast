import { Head, Link, router } from '@inertiajs/react';
import { Search, Plus, Filter, X, Download, Ticket, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type {
    PaginatedTickets,
    TicketStatus,
    TicketPriority,
    TicketTag,
    TicketFilters,
} from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
];

type Props = {
    tickets: PaginatedTickets;
    statuses: TicketStatus[];
    priorities: TicketPriority[];
    tags: TicketTag[];
    filters: TicketFilters;
    canExport?: boolean;
    canDelete?: boolean;
};

function getPriorityColor(color: string): string {
    const colorMap: Record<string, string> = {
        red: 'border-red-400/60 bg-red-500/15 text-red-700 dark:border-red-500/50 dark:bg-red-500/25 dark:text-red-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return colorMap[color] || colorMap.gray;
}

function getStatusColor(color: string): string {
    const colorMap: Record<string, string> = {
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        purple: 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/25 dark:text-purple-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return colorMap[color] || colorMap.gray;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TicketsIndex({
    tickets,
    statuses,
    priorities,
    tags = [],
    filters,
    canExport = false,
    canDelete = false,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(
        !!(filters.status || filters.priority || filters.assignee || filters.tag)
    );
    const [deleteTicketId, setDeleteTicketId] = useState<number | null>(null);
    const [deleteTicketNumber, setDeleteTicketNumber] = useState<string>('');

    const applyFilters = useCallback(
        (newFilters: Partial<TicketFilters>) => {
            router.get(
                '/tickets',
                { ...filters, ...newFilters },
                { preserveState: true, replace: true }
            );
        },
        [filters]
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/tickets', {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = !!(filters.status || filters.priority || filters.assignee || filters.search || filters.tag);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Tiket" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Daftar Tiket"
                        description="Kelola semua tiket permintaan dan insiden"
                    />
                    <div className="flex gap-2">
                        {canExport && (
                            <Button variant="outline" asChild>
                                <a
                                    href={`/tickets/export?${new URLSearchParams(
                                        Object.fromEntries(
                                            Object.entries(filters).filter(
                                                ([, v]) => v !== undefined && v !== ''
                                            )
                                        ) as Record<string, string>
                                    )}`}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Ekspor CSV
                                </a>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href="/tickets/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Tiket
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nomor tiket atau judul..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Cari
                        </Button>
                    </form>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-accent' : ''}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters} size="sm">
                            <X className="mr-1 h-4 w-4" />
                            Reset
                        </Button>
                    )}
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
                        <div className="min-w-[150px]">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Status
                            </label>
                            <Select
                                value={filters.status || '__all__'}
                                onValueChange={(v) => applyFilters({ status: v === '__all__' ? undefined : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua status</SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[150px]">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Prioritas
                            </label>
                            <Select
                                value={filters.priority || '__all__'}
                                onValueChange={(v) => applyFilters({ priority: v === '__all__' ? undefined : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua prioritas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua prioritas</SelectItem>
                                    {priorities.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[150px]">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Penugasan
                            </label>
                            <Select
                                value={filters.assignee || '__all__'}
                                onValueChange={(v) => applyFilters({ assignee: v === '__all__' ? undefined : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua</SelectItem>
                                    <SelectItem value="me">Ditugaskan ke saya</SelectItem>
                                    <SelectItem value="unassigned">Belum ditugaskan</SelectItem>
                                    <SelectItem value="my_group">Pool grup saya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {tags.length > 0 && (
                            <div className="min-w-[150px]">
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Tag / Pengelompokan
                                </label>
                                <Select
                                    value={filters.tag || '__all__'}
                                    onValueChange={(v) => applyFilters({ tag: v === '__all__' ? undefined : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua tag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Semua tag</SelectItem>
                                        {tags.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}

                {/* Tickets Table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20">
                                    <th className="px-4 py-3 font-medium">No. Tiket</th>
                                    <th className="px-4 py-3 font-medium">Judul</th>
                                    <th className="px-4 py-3 font-medium">Prioritas</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Pemohon</th>
                                    <th className="px-4 py-3 font-medium">Petugas</th>
                                    <th className="px-4 py-3 font-medium">Dibuat</th>
                                    {canDelete && <th className="px-4 py-3 font-medium w-12"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canDelete ? 8 : 7} className="p-0">
                                            <EmptyState
                                                icon={<Ticket className="size-7" />}
                                                title={
                                                    hasActiveFilters
                                                        ? 'Tidak ada tiket sesuai filter'
                                                        : 'Belum ada tiket'
                                                }
                                                description={
                                                    hasActiveFilters
                                                        ? 'Coba ubah filter atau reset untuk melihat semua tiket.'
                                                        : 'Buat tiket baru untuk memulai.'
                                                }
                                                action={
                                                    !hasActiveFilters ? (
                                                        <Link href="/tickets/create">
                                                            <Button>Buat Tiket</Button>
                                                        </Link>
                                                    ) : (
                                                        <Button variant="outline" onClick={clearFilters}>
                                                            Reset Filter
                                                        </Button>
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.data.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => router.visit(`/tickets/${ticket.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-medium text-primary">
                                                    {ticket.ticket_number}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-[300px]">
                                                    <p className="font-medium truncate">
                                                        {ticket.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {ticket.category?.name || '-'}
                                                    </p>
                                                    {ticket.tags && ticket.tags.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {ticket.tags.map((tag) => (
                                                                <Badge
                                                                    key={tag.id}
                                                                    variant="secondary"
                                                                    className="text-[10px] font-normal"
                                                                >
                                                                    {tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={getPriorityColor(ticket.priority.color)}
                                                >
                                                    {ticket.priority.name}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(ticket.status.color)}
                                                >
                                                    {ticket.status.name}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {ticket.requester.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {ticket.assignee?.name || (
                                                    <span className="italic text-muted-foreground/60">
                                                        Belum ditugaskan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {formatDate(ticket.created_at)}
                                            </td>
                                            {canDelete && (
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/tickets/${ticket.id}/edit`}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    setDeleteTicketId(ticket.id);
                                                                    setDeleteTicketNumber(ticket.ticket_number);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tickets.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {tickets.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button
                                            size="sm"
                                            variant={link.active ? 'default' : 'outline'}
                                            asChild
                                        >
                                            <Link href={link.url} preserveState>
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            className="inline-flex size-8 items-center justify-center text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-sm text-muted-foreground">
                    Total: {tickets.total} tiket
                </p>
            </div>

            {canDelete && (
                <ConfirmDialog
                    open={deleteTicketId !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteTicketId(null);
                            setDeleteTicketNumber('');
                        }
                    }}
                    title="Hapus Tiket"
                    description={`Apakah Anda yakin ingin menghapus tiket ${deleteTicketNumber}? Tindakan ini tidak bisa dibatalkan.`}
                    confirmLabel="Hapus"
                    onConfirm={() => {
                        if (deleteTicketId) {
                            router.delete(`/tickets/${deleteTicketId}`, {
                                onSuccess: () => {
                                    setDeleteTicketId(null);
                                    setDeleteTicketNumber('');
                                },
                            });
                        }
                    }}
                />
            )}
        </AppLayout>
    );
}
