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
    { title: 'Master Barang', href: '/inventaris-barang' },
];

type BarangItem = {
    kode_barang: string;
    nama_barang: string;
    jml_barang: number | null;
    nama_produsen: string | null;
    nama_merk: string | null;
    thn_produksi: number | null;
    nama_kategori: string | null;
    nama_jenis: string | null;
};

type PaginatedBarang = {
    data: BarangItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    barang: PaginatedBarang;
    filters: { q?: string };
};

export default function InventarisBarangIndex({ barang, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventaris-barang', { q: search || undefined }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/inventaris-barang', {}, { preserveState: true });
    };

    const hasSearch = !!filters.q;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Barang" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Master Barang"
                        description="Data master barang untuk inventaris SIMRS"
                    />
                    <Button asChild>
                        <Link href="/inventaris-barang/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Barang
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kode barang, nama barang, produsen, atau merk..."
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
                                    <th className="px-4 py-3 font-medium">Kode Barang</th>
                                    <th className="px-4 py-3 font-medium">Nama Barang</th>
                                    <th className="px-4 py-3 font-medium">Jumlah</th>
                                    <th className="px-4 py-3 font-medium">Produsen</th>
                                    <th className="px-4 py-3 font-medium">Merk</th>
                                    <th className="px-4 py-3 font-medium">Tahun</th>
                                    <th className="px-4 py-3 font-medium">Kategori</th>
                                    <th className="px-4 py-3 font-medium w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {barang.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-0">
                                            <EmptyState
                                                title={
                                                    hasSearch
                                                        ? 'Tidak ada hasil pencarian'
                                                        : 'Belum ada data barang'
                                                }
                                                description={
                                                    hasSearch
                                                        ? 'Coba ubah kata kunci pencarian.'
                                                        : 'Tambahkan barang master untuk inventaris.'
                                                }
                                                icon={Package}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    barang.data.map((item) => (
                                        <tr
                                            key={item.kode_barang}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/inventaris-barang/${item.kode_barang}`}
                                                    className="font-mono font-medium text-primary hover:underline"
                                                >
                                                    {item.kode_barang}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{item.nama_barang}</td>
                                            <td className="px-4 py-3 text-center">
                                                {item.jml_barang ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.nama_produsen ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.nama_merk ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.thn_produksi ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.nama_kategori ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/inventaris-barang/${item.kode_barang}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/inventaris-barang/${item.kode_barang}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (confirm('Hapus barang ini?')) {
                                                                router.delete(`/inventaris-barang/${item.kode_barang}`);
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

                    {barang.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {barang.links.map((link, i) => (
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
                    Total: {barang.total} barang
                    {hasSearch && ` (filter: "${filters.q}")`}
                </p>

                <p className="text-xs text-muted-foreground">
                    Master barang ini digunakan sebagai referensi saat membuat inventaris.
                </p>
            </div>
        </AppLayout>
    );
}
