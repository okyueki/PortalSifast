import { Head, Link, router } from '@inertiajs/react';
import { Search, FolderKanban, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Rencana', href: '/projects' },
];

const STATUS_LABELS: Record<string, string> = {
    planning: 'Perencanaan',
    in_progress: 'Sedang Berjalan',
    completed: 'Selesai',
    on_hold: 'Ditunda',
};

type ProjectItem = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    dep_id: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    tickets_count: number;
    created_by_user?: { id: number; name: string } | null;
    createdBy?: { id: number; name: string } | null;
};

type PaginatedProjects = {
    data: ProjectItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    projects: PaginatedProjects;
    filters: { q?: string; status?: string };
};

export default function ProjectsIndex({ projects, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '__all__');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/projects', { q: search || undefined, status: status === '__all__' ? undefined : status }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('__all__');
        router.get('/projects', {}, { preserveState: true });
    };

    const hasFilters = !!filters.q || !!filters.status;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rencana / Proyek" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Rencana / Proyek"
                        description="Tracking pekerjaan per project; satu project bisa berisi banyak tiket"
                    />
                    <Button asChild>
                        <Link href="/projects/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Rencana
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau deskripsi..."
                            className="pl-9"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Semua status</SelectItem>
                            <SelectItem value="planning">Perencanaan</SelectItem>
                            <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="on_hold">Ditunda</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit">Cari</Button>
                    {hasFilters && (
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Reset
                        </Button>
                    )}
                </form>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20">
                                    <th className="px-4 py-3 font-medium">Nama</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Tiket</th>
                                    <th className="px-4 py-3 font-medium">Dibuat</th>
                                    <th className="px-4 py-3 font-medium w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <EmptyState
                                                title={
                                                    hasFilters
                                                        ? 'Tidak ada hasil pencarian'
                                                        : 'Belum ada rencana/proyek'
                                                }
                                                description={
                                                    hasFilters
                                                        ? 'Coba ubah filter atau kata kunci.'
                                                        : 'Buat rencana untuk mengelompokkan tiket per project.'
                                                }
                                                icon={<FolderKanban className="size-7" />}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    projects.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/projects/${item.id}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {item.name}
                                                </Link>
                                                {item.description && (
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                    {STATUS_LABELS[item.status] ?? item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{item.tickets_count}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(item.createdBy ?? item.created_by_user)?.name ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/projects/${item.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/projects/${item.id}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (confirm('Hapus rencana ini? Tiket yang terhubung tidak dihapus, hanya dilepas dari project.')) {
                                                                router.delete(`/projects/${item.id}`);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {projects.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {projects.links.map((link, i) => (
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
                    Total: {projects.total} rencana
                    {hasFilters && ` (filter diterapkan)`}
                </p>
            </div>
        </AppLayout>
    );
}
