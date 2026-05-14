import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Kategori Mutu', href: '/simmutu/categories' },
];

type CategoryRow = {
    id: number;
    name: string;
    short_name: string | null;
    scope: string;
    is_active: boolean;
    indicators_count: number;
};

type Paginated = {
    data: CategoryRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = { categories: Paginated };

export default function MutuCategoriesIndex({ categories }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Mutu" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading title="Kategori Mutu" description="Master kategori indikator mutu." />
                    <Button asChild>
                        <Link href="/simmutu/categories/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah kategori
                        </Link>
                    </Button>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 font-medium">Nama</th>
                                    <th className="px-4 py-3 font-medium">Singkatan</th>
                                    <th className="px-4 py-3 font-medium">Lingkup</th>
                                    <th className="px-4 py-3 font-medium">Indikator</th>
                                    <th className="px-4 py-3 font-medium">Aktif</th>
                                    <th className="px-4 py-3 font-medium w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{c.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.short_name ?? '–'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{c.scope}</td>
                                        <td className="px-4 py-3">{c.indicators_count}</td>
                                        <td className="px-4 py-3">{c.is_active ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/simmutu/categories/${c.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (confirm('Hapus kategori ini? Indikator terkait ikut terhapus.')) {
                                                            router.delete(`/simmutu/categories/${c.id}`);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {categories.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {categories.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button size="sm" variant={link.active ? 'default' : 'outline'} asChild>
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

                <p className="text-sm text-muted-foreground">Total: {categories.total} kategori</p>
            </div>
        </AppLayout>
    );
}
