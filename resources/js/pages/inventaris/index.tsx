import { Head, Link, router } from '@inertiajs/react';
import { Search, Package, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Inventaris', href: '/inventaris' },
];

type InventarisItem = {
    no_inventaris: string;
    kode_barang: string;
    nama_barang: string;
    nama_ruang: string | null;
    status_barang: string | null;
};

type PaginatedInventaris = {
    data: InventarisItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    inventaris: PaginatedInventaris;
    filters: { q?: string };
};

export default function InventarisIndex({ inventaris, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventaris', { q: search || undefined }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/inventaris', {}, { preserveState: true });
    };

    const hasSearch = !!filters.q;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Inventaris" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Daftar Inventaris"
                        description="Inventaris barang dari SIMRS (alat medis, peralatan)"
                    />
                    <Button asChild>
                        <Link href="/inventaris/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Inventaris
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari no inventaris, kode barang, atau nama barang..."
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit">Cari</Button>
                    {hasSearch && (
                        <Button type="button" variant="outline" onClick={clearSearch}>
                            Reset
                        </Button>
                    )}
                </form>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20">
                                    <th className="px-4 py-3 font-medium">No Inventaris</th>
                                    <th className="px-4 py-3 font-medium">Kode Barang</th>
                                    <th className="px-4 py-3 font-medium">Nama Barang</th>
                                    <th className="px-4 py-3 font-medium">Ruang</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventaris.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-0">
                                            <EmptyState
                                                title={
                                                    hasSearch
                                                        ? 'Tidak ada hasil pencarian'
                                                        : 'Belum ada data inventaris'
                                                }
                                                description={
                                                    hasSearch
                                                        ? 'Coba ubah kata kunci pencarian.'
                                                        : 'Data inventaris diambil dari SIMRS.'
                                                }
                                                icon={<Package className="size-7" />}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    inventaris.data.map((item) => (
                                        <tr
                                            key={item.no_inventaris}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/inventaris/${item.no_inventaris}`}
                                                    className="font-mono font-medium text-primary hover:underline"
                                                >
                                                    {item.no_inventaris}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground">
                                                {item.kode_barang}
                                            </td>
                                            <td className="px-4 py-3">{item.nama_barang}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.nama_ruang ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.status_barang ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/inventaris/${item.no_inventaris}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/inventaris/${item.no_inventaris}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (confirm('Hapus inventaris ini?')) {
                                                                router.delete(`/inventaris/${item.no_inventaris}`);
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

                    {inventaris.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {inventaris.links.map((link, i) => (
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
                    Total: {inventaris.total} inventaris
                    {hasSearch && ` (filter: "${filters.q}")`}
                </p>

                <p className="text-xs text-muted-foreground">
                    Untuk menautkan inventaris ke tiket, gunakan form saat membuat atau mengedit tiket.
                </p>
            </div>
        </AppLayout>
    );
}
