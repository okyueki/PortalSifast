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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Inventaris', href: '/inventaris' },
    { title: 'Tambah Inventaris', href: '/inventaris/create' },
];

type BarangOption = { kode_barang: string; nama_barang: string };
type RuangOption = { id_ruang: string; nama_ruang: string };

type Props = {
    barang: BarangOption[];
    ruang: RuangOption[];
};

export default function InventarisCreate({ barang, ruang }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        no_inventaris: '',
        kode_barang: '',
        asal_barang: '',
        tgl_pengadaan: '',
        harga: '',
        status_barang: '',
        id_ruang: '__none__',
        no_rak: '',
        no_box: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventaris', {
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
            <Head title="Tambah Inventaris" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/inventaris">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Tambah Inventaris"
                        description="Data inventaris baru"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="no_inventaris">
                            No Inventaris <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="no_inventaris"
                            value={data.no_inventaris}
                            onChange={(e) => setData('no_inventaris', e.target.value)}
                            placeholder="Contoh: INV-2024-001"
                            maxLength={30}
                            required
                        />
                        <InputError message={errors.no_inventaris} />
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
                                {barang.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Tidak ada data barang. Periksa koneksi database.
                                    </div>
                                ) : (
                                    barang.map((b) => (
                                        <SelectItem key={b.kode_barang} value={b.kode_barang}>
                                            {b.kode_barang} - {b.nama_barang}
                                        </SelectItem>
                                    ))
                                )}
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
                        <Select
                            value={data.asal_barang}
                            onValueChange={(v) => setData('asal_barang', v)}
                        >
                            <SelectTrigger id="asal_barang">
                                <SelectValue placeholder="Pilih asal barang..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Beli">Beli</SelectItem>
                                <SelectItem value="Bantuan">Bantuan</SelectItem>
                                <SelectItem value="Hibah">Hibah</SelectItem>
                            </SelectContent>
                        </Select>
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
                                placeholder="0"
                            />
                            <InputError message={errors.harga} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status_barang">Status Barang</Label>
                        <Select
                            value={data.status_barang}
                            onValueChange={(v) => setData('status_barang', v)}
                        >
                            <SelectTrigger id="status_barang">
                                <SelectValue placeholder="Pilih status barang..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ada">Ada</SelectItem>
                                <SelectItem value="Rusak">Rusak</SelectItem>
                                <SelectItem value="Hilang">Hilang</SelectItem>
                                <SelectItem value="Perbaikan">Perbaikan</SelectItem>
                                <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status_barang} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="no_rak">No Rak</Label>
                            <Input
                                id="no_rak"
                                value={data.no_rak}
                                onChange={(e) => setData('no_rak', e.target.value)}
                                placeholder="Contoh: A1"
                                maxLength={3}
                            />
                            <InputError message={errors.no_rak} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="no_box">No Box</Label>
                            <Input
                                id="no_box"
                                value={data.no_box}
                                onChange={(e) => setData('no_box', e.target.value)}
                                placeholder="Opsional"
                                maxLength={3}
                            />
                            <InputError message={errors.no_box} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/inventaris">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
