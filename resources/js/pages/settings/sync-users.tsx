import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sync User SIMRS',
        href: '/settings/sync-users',
    },
];

type LastSyncResult = {
    created: number;
    updated: number;
    skipped: number;
    run_at: string;
};

type PegawaiEmailItem = {
    nik: string;
    nama: string;
    email: string | null;
    phone: string | null;
    has_email: boolean;
};

type Props = {
    lastSyncResult: LastSyncResult | null;
    pegawaiEmailStatus: PegawaiEmailItem[];
};

function formatRunAt(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

type FilterEmail = 'all' | 'has_email' | 'no_email';

export default function SyncUsers({
    lastSyncResult,
    pegawaiEmailStatus,
}: Props) {
    const [syncing, setSyncing] = useState(false);
    const [emailFilter, setEmailFilter] = useState<FilterEmail>('all');
    const { flash } = usePage<{ flash: { syncSuccess?: boolean } }>().props;

    const filteredPegawai = useMemo(() => {
        if (emailFilter === 'has_email') {
            return pegawaiEmailStatus.filter((p) => p.has_email);
        }
        if (emailFilter === 'no_email') {
            return pegawaiEmailStatus.filter((p) => !p.has_email);
        }
        return pegawaiEmailStatus;
    }, [pegawaiEmailStatus, emailFilter]);

    const stats = useMemo(() => {
        const hasEmail = pegawaiEmailStatus.filter((p) => p.has_email).length;
        const noEmail = pegawaiEmailStatus.length - hasEmail;
        return { hasEmail, noEmail, total: pegawaiEmailStatus.length };
    }, [pegawaiEmailStatus]);

    const handleSync = () => {
        setSyncing(true);
        router.post('/settings/sync-users', {}, {
            preserveScroll: true,
            onFinish: () => setSyncing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sync User dari SIMRS" />

            <h1 className="sr-only">Sync User dari SIMRS</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Sync User dari SIMRS"
                        description="Impor atau perbarui user dari data Pegawai (Petugas/Dokter) di database SIMRS. Hanya pegawai yang punya email valid akan disinkronkan."
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Jalankan sinkronisasi</CardTitle>
                            <CardDescription>
                                Data diambil dari tabel pegawai, petugas, dan dokter
                                pada database SIMRS. User baru perlu menggunakan
                                &quot;Lupa password&quot; untuk set password pertama
                                kali.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Button
                                onClick={handleSync}
                                disabled={syncing}
                            >
                                {syncing ? 'Memproses…' : 'Sync dari SIMRS'}
                            </Button>

                            {flash?.syncSuccess && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Sync selesai. Lihat ringkasan di bawah.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {lastSyncResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Hasil sync terakhir</CardTitle>
                                <CardDescription>
                                    {formatRunAt(lastSyncResult.run_at)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border bg-muted/50 px-4 py-3">
                                        <dt className="text-xs font-medium text-muted-foreground">
                                            Dibuat
                                        </dt>
                                        <dd className="mt-1 text-2xl font-semibold">
                                            {lastSyncResult.created}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg border bg-muted/50 px-4 py-3">
                                        <dt className="text-xs font-medium text-muted-foreground">
                                            Diupdate
                                        </dt>
                                        <dd className="mt-1 text-2xl font-semibold">
                                            {lastSyncResult.updated}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg border bg-muted/50 px-4 py-3">
                                        <dt className="text-xs font-medium text-muted-foreground">
                                            Dilewati (tanpa email)
                                        </dt>
                                        <dd className="mt-1 text-2xl font-semibold">
                                            {lastSyncResult.skipped}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar pegawai SIMRS (status email)</CardTitle>
                            <CardDescription>
                                Pegawai yang punya email bisa disinkronkan jadi
                                user. Yang tidak punya email akan dilewati.
                            </CardDescription>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <span className="text-sm text-muted-foreground">
                                    Ringkasan:
                                </span>
                                <Badge variant="default">
                                    Punya email: {stats.hasEmail}
                                </Badge>
                                <Badge variant="secondary">
                                    Tidak punya email: {stats.noEmail}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Total: {stats.total} pegawai
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant={
                                        emailFilter === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setEmailFilter('all')}
                                >
                                    Semua
                                </Button>
                                <Button
                                    size="sm"
                                    variant={
                                        emailFilter === 'has_email'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setEmailFilter('has_email')}
                                >
                                    Punya email
                                </Button>
                                <Button
                                    size="sm"
                                    variant={
                                        emailFilter === 'no_email'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setEmailFilter('no_email')}
                                >
                                    Tidak punya email
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 font-medium">
                                                NIK
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Nama
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                No. HP
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPegawai.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-6 text-center text-muted-foreground"
                                                >
                                                    Tidak ada data.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPegawai.map((p) => (
                                                <tr
                                                    key={p.nik}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="px-4 py-2 font-mono text-muted-foreground">
                                                        {p.nik}
                                                    </td>
                                                    <td className="px-4 py-2 font-medium">
                                                        {p.nama}
                                                    </td>
                                                    <td className="px-4 py-2 text-muted-foreground">
                                                        {p.email ?? '–'}
                                                    </td>
                                                    <td className="px-4 py-2 text-muted-foreground">
                                                        {p.phone ?? '–'}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Badge
                                                            variant={
                                                                p.has_email
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {p.has_email
                                                                ? 'Punya email'
                                                                : 'Tidak punya email'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
