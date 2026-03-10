import { Head, Link, router } from '@inertiajs/react';
import { Search, Plus, Filter, X, Download, Upload, Ticket, MoreHorizontal, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    PaginatedTickets,
    TicketStatus,
    TicketPriority,
    TicketTag,
    TicketFilters,
    TicketCategory,
} from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
];

type ProjectOption = { id: number; name: string };

type Props = {
    tickets: PaginatedTickets;
    statuses: TicketStatus[];
    priorities: TicketPriority[];
    tags: TicketTag[];
    categories: TicketCategory[];
    filters: TicketFilters;
    projects?: ProjectOption[];
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
    categories = [],
    filters,
    projects = [],
    canExport = false,
    canDelete = false,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(
        !!(
            filters.status ||
            filters.priority ||
            filters.assignee ||
            filters.tag ||
            filters.category ||
            filters.subcategory ||
            filters.project ||
            filters.created_from ||
            filters.created_to ||
            filters.include_closed
        )
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

    const hasActiveFilters = !!(
        filters.status ||
        filters.priority ||
        filters.assignee ||
        filters.search ||
        filters.tag ||
        filters.category ||
        filters.subcategory ||
        filters.created_from ||
        filters.created_to ||
        filters.include_closed
    );

    const includeClosed = filters.include_closed === '1' || filters.include_closed === 'true';

    const selectedCategory = filters.category
        ? categories.find((c) => c.id === parseInt(filters.category!, 10))
        : null;
    const subcategories = selectedCategory?.subcategories ?? [];

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
                            <>
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
                                <Button variant="outline" asChild>
                                    <Link href="/tickets/import">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Impor CSV
                                    </Link>
                                </Button>
                            </>
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
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Checkbox
                                id="include_closed"
                                checked={includeClosed}
                                onCheckedChange={(checked) =>
                                    applyFilters({ include_closed: checked ? '1' : undefined })
                                }
                            />
                            <label
                                htmlFor="include_closed"
                                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Tampilkan tiket ditutup
                            </label>
                        </div>
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
                        <div className="min-w-[180px]">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Kategori
                            </label>
                            <Select
                                value={filters.category || '__all__'}
                                onValueChange={(v) => {
                                    const catId = v === '__all__' ? undefined : v;
                                    applyFilters({
                                        category: catId,
                                        subcategory: undefined,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua kategori</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[180px]">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Subkategori
                            </label>
                            <Select
                                value={filters.subcategory || '__all__'}
                                onValueChange={(v) =>
                                    applyFilters({ subcategory: v === '__all__' ? undefined : v })
                                }
                                disabled={subcategories.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedCategory ? 'Semua subkategori' : 'Pilih kategori dulu'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua subkategori</SelectItem>
                                    {subcategories.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {projects.length > 0 && (
                            <div className="min-w-[180px]">
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Rencana / Project
                                </label>
                                <Select
                                    value={filters.project ?? '__all__'}
                                    onValueChange={(v) =>
                                        applyFilters({ project: v === '__all__' ? undefined : v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Semua</SelectItem>
                                        <SelectItem value="__none__">Tanpa project</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="min-w-[140px]">
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Tanggal dibuat dari
                                </label>
                                <Input
                                    type="date"
                                    value={filters.created_from ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value || undefined;
                                        applyFilters({
                                            created_from: v,
                                            created_to: v ? filters.created_to : undefined,
                                        });
                                    }}
                                />
                            </div>
                            <div className="min-w-[140px]">
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Tanggal dibuat sampai
                                </label>
                                <Input
                                    type="date"
                                    value={filters.created_to ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value || undefined;
                                        applyFilters({
                                            created_from: v ? filters.created_from : undefined,
                                            created_to: v,
                                        });
                                    }}
                                />
                            </div>
                        </div>
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
                                    <th className="px-4 py-3 font-medium">Rencana</th>
                                    <th className="px-4 py-3 font-medium">Pemohon</th>
                                    <th className="px-4 py-3 font-medium">Petugas</th>
                                    <th className="px-4 py-3 font-medium">Dibuat</th>
                                    {(canExport || canDelete) && <th className="px-4 py-3 font-medium w-12"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={(canExport || canDelete) ? 9 : 8} className="p-0">
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
                                                        {[
                                                            ticket.category?.name,
                                                            ticket.subcategory?.name,
                                                            ticket.inventaris?.barang?.nama_barang ||
                                                                ticket.inventaris?.no_inventaris,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ') || '-'}
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
                                                {ticket.project ? (
                                                    <Link
                                                        href={`/projects/${ticket.project.id}`}
                                                        className="text-primary hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {ticket.project.name}
                                                    </Link>
                                                ) : (
                                                    '–'
                                                )}
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
                                            {(canExport || canDelete) && (
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
                                                            {projects.length > 0 && (
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger>
                                                                        <FolderKanban className="mr-2 h-4 w-4" />
                                                                        Pindah ke project
                                                                    </DropdownMenuSubTrigger>
                                                                    <DropdownMenuSubContent>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                router.patch(
                                                                                    `/tickets/${ticket.id}`,
                                                                                    { project_id: null },
                                                                                    { preserveScroll: true }
                                                                                );
                                                                            }}
                                                                        >
                                                                            Lepas dari project
                                                                        </DropdownMenuItem>
                                                                        {projects.map((p) => (
                                                                            <DropdownMenuItem
                                                                                key={p.id}
                                                                                onClick={() => {
                                                                                    router.patch(
                                                                                        `/tickets/${ticket.id}`,
                                                                                        { project_id: p.id },
                                                                                        { preserveScroll: true }
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {p.name}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuSub>
                                                            )}
                                                            {canDelete && (
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
                                                            )}
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
