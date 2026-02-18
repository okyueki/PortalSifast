import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Package, Calendar, MapPin, Tag, Building } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Master Barang', href: '/inventaris-barang' },
    { title: 'Detail Barang', href: '' },
];

type BarangData = {
    kode_barang: string;
    nama_barang: string;
    jml_barang: number | null;
    nama_produsen: string | null;
    nama_merk: string | null;
    thn_produksi: number | null;
    isbn: string | null;
    nama_kategori: string | null;
    nama_jenis: string | null;
};

type Props = {
    barang: BarangData;
};

export default function InventarisBarangShow({ barang }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Barang - ${barang.nama_barang}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/inventaris-barang">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <Heading
                            title={barang.nama_barang}
                            description={`Kode: ${barang.kode_barang}`}
                        />
                    </div>
                    <Button asChild>
                        <Link href={`/inventaris-barang/${barang.kode_barang}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Informasi Barang
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode Barang</label>
                                    <p className="font-mono font-medium">{barang.kode_barang}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Barang</label>
                                    <p className="font-medium">{barang.nama_barang}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Jumlah</label>
                                    <p className="font-medium">{barang.jml_barang ?? '–'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Produsen & Merk
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Produsen</label>
                                    <p className="font-medium">{barang.nama_produsen ?? '–'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Merk</label>
                                    <p className="font-medium">{barang.nama_merk ?? '–'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Produksi & Identifikasi
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tahun Produksi</label>
                                    <p className="font-medium">{barang.thn_produksi ?? '–'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ISBN</label>
                                    <p className="font-mono font-medium">{barang.isbn ?? '–'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Kategori & Jenis
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                                    <p className="font-medium">{barang.nama_kategori ?? '–'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Jenis</label>
                                    <p className="font-medium">{barang.nama_jenis ?? '–'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/inventaris-barang">Kembali ke Daftar</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/inventaris-barang/${barang.kode_barang}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Barang
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
