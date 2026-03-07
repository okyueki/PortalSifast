import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil, Package } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type InventarisData = {
    no_inventaris: string;
    kode_barang: string;
    nama_barang: string;
    asal_barang: string | null;
    tgl_pengadaan: string | null;
    harga: number | null;
    status_barang: string | null;
    nama_ruang: string | null;
    no_rak: string | null;
    no_box: string | null;
};

type Props = {
    inventaris: InventarisData;
};

function formatDate(s: string | null): string {
    if (!s) return '–';
    return new Date(s).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatCurrency(n: number | null): string {
    if (n == null) return '–';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(n);
}

export default function InventarisShow({ inventaris }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Inventaris', href: '/inventaris' },
        { title: inventaris.no_inventaris, href: `/inventaris/${inventaris.no_inventaris}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Inventaris ${inventaris.no_inventaris}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/inventaris">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title={inventaris.no_inventaris}
                            description={inventaris.nama_barang}
                            variant="small"
                        />
                    </div>
                    <Button asChild>
                        <Link href={`/inventaris/${inventaris.no_inventaris}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="h-4 w-4" />
                            Detail Inventaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">No Inventaris</p>
                                <p className="font-mono font-medium">{inventaris.no_inventaris}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Kode Barang</p>
                                <p className="font-mono">{inventaris.kode_barang}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Nama Barang</p>
                                <p>{inventaris.nama_barang}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ruang</p>
                                <p>{inventaris.nama_ruang ?? '–'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Asal Barang</p>
                                <p>{inventaris.asal_barang ?? '–'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tanggal Pengadaan</p>
                                <p>{formatDate(inventaris.tgl_pengadaan)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Harga</p>
                                <p>{formatCurrency(inventaris.harga)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status Barang</p>
                                <p>{inventaris.status_barang ?? '–'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">No Rak</p>
                                <p>{inventaris.no_rak ?? '–'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">No Box</p>
                                <p>{inventaris.no_box ?? '–'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
