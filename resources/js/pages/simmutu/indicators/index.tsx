import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
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
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Indikator Mutu', href: '/simmutu/indicators' },
];

type Category = { id: number; name: string };

type IndicatorRow = {
    id: number;
    title: string;
    is_active: boolean;
    collection_frequency: string;
    mutu_category_id: number;
    mutu_category: Category | null;
    has_mutu_benchmarking: boolean;
    indicator_departemen_count: number;
};

type Paginated = {
    data: IndicatorRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    indicators: Paginated;
    categories: Category[];
    filters: { mutu_category_id: string | number };
};

export default function MutuIndicatorsIndex({ indicators, categories, filters }: Props) {
    const filterValue = useMemo(
        () => (filters.mutu_category_id === '' || filters.mutu_category_id === null ? '__all__' : String(filters.mutu_category_id)),
        [filters.mutu_category_id],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Indikator Mutu" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Heading title="Profil Indikator" description="Master indikator mutu per kategori." />
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="grid gap-1">
                            <span className="text-xs text-muted-foreground">Filter kategori</span>
                            <Select
                                value={filterValue}
                                onValueChange={(v) => {
                                    router.get(
                                        '/simmutu/indicators',
                                        v === '__all__' ? {} : { mutu_category_id: v },
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button asChild>
                            <Link href="/simmutu/indicators/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah indikator
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="px-4 py-3 font-medium">Judul</th>
                                    <th className="px-4 py-3 font-medium">Kategori</th>
                                    <th className="px-4 py-3 font-medium">Frekuensi</th>
                                    <th className="px-4 py-3 font-medium">Benchmarking</th>
                                    <th className="px-4 py-3 font-medium">Unit</th>
                                    <th className="px-4 py-3 font-medium">Aktif</th>
                                    <th className="px-4 py-3 font-medium w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {indicators.data.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{row.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.mutu_category?.name ?? '–'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{row.collection_frequency}</td>
                                        <td className="px-4 py-3">{row.has_mutu_benchmarking ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3">{row.indicator_departemen_count}</td>
                                        <td className="px-4 py-3">{row.is_active ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/simmutu/indicators/${row.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (confirm('Hapus indikator ini?')) {
                                                            router.delete(`/simmutu/indicators/${row.id}`);
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

                    {indicators.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {indicators.links.map((link, i) => (
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

                <p className="text-sm text-muted-foreground">Total: {indicators.total} indikator</p>
            </div>
        </AppLayout>
    );
}
