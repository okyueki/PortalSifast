import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type BarangOption = { kode_barang: string; nama_barang: string };
type RuangOption = { id_ruang: string; nama_ruang: string };

type InventarisData = {
    no_inventaris: string;
    kode_barang: string;
    nama_barang: string;
    asal_barang: string | null;
    tgl_pengadaan: string | null;
    harga: number | null;
    status_barang: string | null;
    id_ruang: string | null;
    nama_ruang: string | null;
    no_rak: string | null;
    no_box: string | null;
};

type Props = {
    inventaris: InventarisData;
    barang: BarangOption[];
    ruang: RuangOption[];
};

export default function InventarisEdit({ inventaris, barang, ruang }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Inventaris', href: '/inventaris' },
        { title: inventaris.no_inventaris, href: `/inventaris/${inventaris.no_inventaris}` },
        { title: 'Edit', href: `/inventaris/${inventaris.no_inventaris}/edit` },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        kode_barang: inventaris.kode_barang,
        asal_barang: inventaris.asal_barang ?? '',
        tgl_pengadaan: inventaris.tgl_pengadaan ?? '',
        harga: inventaris.harga != null ? String(inventaris.harga) : '',
        status_barang: inventaris.status_barang ?? '',
        id_ruang: inventaris.id_ruang ?? '__none__',
        no_rak: inventaris.no_rak ?? '',
        no_box: inventaris.no_box ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/inventaris/${inventaris.no_inventaris}`, {
            data: {
                ...data,
                tgl_pengadaan: data.tgl_pengadaan || null,
                harga: data.harga ? parseFloat(data.harga) : null,
                id_ruang: data.id_ruang === '__none__' ? null : data.id_ruang,
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Inventaris ${inventaris.no_inventaris}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/inventaris/${inventaris.no_inventaris}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title={`Edit ${inventaris.no_inventaris}`}
                        description={inventaris.nama_barang}
                        variant="small"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label>No Inventaris</Label>
                        <p className="font-mono text-sm text-muted-foreground">
                            {inventaris.no_inventaris} (tidak dapat diubah)
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="kode_barang">
                            Barang <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.kode_barang}
                            onValueChange={(v) => setData('kode_barang', v)}
                        >
                            <SelectTrigger id="kode_barang">
                                <SelectValue placeholder="Pilih barang..." />
                            </SelectTrigger>
                            <SelectContent>
                                {barang.map((b) => (
                                    <SelectItem key={b.kode_barang} value={b.kode_barang}>
                                        {b.kode_barang} - {b.nama_barang}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.kode_barang} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="id_ruang">Ruang</Label>
                        <Select
                            value={data.id_ruang}
                            onValueChange={(v) => setData('id_ruang', v)}
                        >
                            <SelectTrigger id="id_ruang">
                                <SelectValue placeholder="Pilih ruang (opsional)..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Tidak ada</SelectItem>
                                {ruang.map((r) => (
                                    <SelectItem key={r.id_ruang} value={r.id_ruang}>
                                        {r.nama_ruang}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.id_ruang} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="asal_barang">Asal Barang</Label>
                        <Input
                            id="asal_barang"
                            value={data.asal_barang}
                            onChange={(e) => setData('asal_barang', e.target.value)}
                            maxLength={100}
                        />
                        <InputError message={errors.asal_barang} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="tgl_pengadaan">Tanggal Pengadaan</Label>
                            <Input
                                id="tgl_pengadaan"
                                type="date"
                                value={data.tgl_pengadaan}
                                onChange={(e) => setData('tgl_pengadaan', e.target.value)}
                            />
                            <InputError message={errors.tgl_pengadaan} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="harga">Harga</Label>
                            <Input
                                id="harga"
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.harga}
                                onChange={(e) => setData('harga', e.target.value)}
                            />
                            <InputError message={errors.harga} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status_barang">Status Barang</Label>
                        <Input
                            id="status_barang"
                            value={data.status_barang}
                            onChange={(e) => setData('status_barang', e.target.value)}
                            maxLength={50}
                        />
                        <InputError message={errors.status_barang} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="no_rak">No Rak</Label>
                            <Input
                                id="no_rak"
                                value={data.no_rak}
                                onChange={(e) => setData('no_rak', e.target.value)}
                                maxLength={50}
                            />
                            <InputError message={errors.no_rak} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="no_box">No Box</Label>
                            <Input
                                id="no_box"
                                value={data.no_box}
                                onChange={(e) => setData('no_box', e.target.value)}
                                maxLength={50}
                            />
                            <InputError message={errors.no_box} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/inventaris/${inventaris.no_inventaris}`}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
