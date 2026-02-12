import { Head, Link } from '@inertiajs/react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Daftar Pegawai', href: '/pegawai' },
];

type PegawaiItem = {
    nik: string;
    nama: string;
    jk: string | null;
    jbtn: string | null;
    departemen: string | null;
    type: string;
};

type PaginatedPegawai = {
    data: PegawaiItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    pegawai: PaginatedPegawai;
};

export default function PegawaiIndex({ pegawai }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Pegawai" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Daftar Pegawai"
                    description="Pegawai aktif dari SIMRS (Dokter & Petugas)"
                />

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20">
                                    <th className="px-4 py-3 font-medium">
                                        NIK
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        JK
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Jabatan
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Tipe
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Departemen
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pegawai.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-0">
                                            <EmptyState
                                                title="Belum ada data pegawai aktif"
                                                description="Data pegawai diambil dari SIMRS (Dokter & Petugas)."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    pegawai.data.map((p) => (
                                        <tr
                                            key={p.nik}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {p.nik}
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.nama}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {p.jk ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {p.jbtn ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        p.type === 'Dokter'
                                                            ? 'border-violet-400/60 bg-violet-500/15 text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/25 dark:text-violet-300'
                                                            : p.type === 'Petugas'
                                                              ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/25 dark:text-emerald-300'
                                                              : 'border-amber-400/60 bg-amber-500/15 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/25 dark:text-amber-300'
                                                    }
                                                >
                                                    {p.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {p.departemen ?? '–'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pegawai.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {pegawai.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            asChild
                                        >
                                            <Link
                                                href={link.url}
                                                preserveState
                                            >
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
                    Total: {pegawai.total} pegawai aktif
                </p>
            </div>
        </AppLayout>
    );
}
