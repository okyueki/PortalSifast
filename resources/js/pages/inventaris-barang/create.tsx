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
    { title: 'Master Barang', href: '/inventaris-barang' },
    { title: 'Tambah Barang', href: '/inventaris-barang/create' },
];

type ProdusenOption = { kode_produsen: string; nama_produsen: string };
type MerkOption = { id_merk: number; nama_merk: string };
type KategoriOption = { id_kategori: number; nama_kategori: string };
type JenisOption = { id_jenis: number; nama_jenis: string };

type Props = {
    produsen: ProdusenOption[];
    merk: MerkOption[];
    kategori: KategoriOption[];
    jenis: JenisOption[];
};

export default function InventarisBarangCreate({ produsen, merk, kategori, jenis }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        kode_barang: '',
        nama_barang: '',
        jml_barang: '',
        kode_produsen: '__none__',
        id_merk: '__none__',
        thn_produksi: '',
        isbn: '',
        id_kategori: '__none__',
        id_jenis: '__none__',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventaris-barang');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Barang" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/inventaris-barang">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Tambah Barang"
                        description="Data master barang baru"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="kode_barang">
                            Kode Barang <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="kode_barang"
                            value={data.kode_barang}
                            onChange={(e) => setData('kode_barang', e.target.value)}
                            placeholder="Contoh: BRG-001"
                            maxLength={50}
                            required
                        />
                        <InputError message={errors.kode_barang} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nama_barang">
                            Nama Barang <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="nama_barang"
                            value={data.nama_barang}
                            onChange={(e) => setData('nama_barang', e.target.value)}
                            placeholder="Contoh: Monitor LCD 24 inch"
                            maxLength={255}
                            required
                        />
                        <InputError message={errors.nama_barang} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="jml_barang">Jumlah Barang</Label>
                        <Input
                            id="jml_barang"
                            type="number"
                            min={0}
                            value={data.jml_barang}
                            onChange={(e) => setData('jml_barang', e.target.value)}
                            placeholder="0"
                        />
                        <InputError message={errors.jml_barang} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="kode_produsen">Produsen</Label>
                            <Select
                                value={data.kode_produsen}
                                onValueChange={(v) => setData('kode_produsen', v)}
                            >
                                <SelectTrigger id="kode_produsen">
                                    <SelectValue placeholder="Pilih produsen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Tidak ada</SelectItem>
                                    {produsen.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            Tidak ada data produsen
                                        </div>
                                    ) : (
                                        produsen.map((p) => (
                                            <SelectItem key={p.kode_produsen} value={p.kode_produsen}>
                                                {p.nama_produsen}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.kode_produsen} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="id_merk">Merk</Label>
                            <Select
                                value={data.id_merk}
                                onValueChange={(v) => setData('id_merk', v)}
                            >
                                <SelectTrigger id="id_merk">
                                    <SelectValue placeholder="Pilih merk..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Tidak ada</SelectItem>
                                    {merk.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            Tidak ada data merk
                                        </div>
                                    ) : (
                                        merk.map((m) => (
                                            <SelectItem key={m.id_merk} value={m.id_merk.toString()}>
                                                {m.nama_merk}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.id_merk} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="thn_produksi">Tahun Produksi</Label>
                            <Input
                                id="thn_produksi"
                                type="number"
                                min={1900}
                                max={new Date().getFullYear() + 10}
                                value={data.thn_produksi}
                                onChange={(e) => setData('thn_produksi', e.target.value)}
                                placeholder="2024"
                            />
                            <InputError message={errors.thn_produksi} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                value={data.isbn}
                                onChange={(e) => setData('isbn', e.target.value)}
                                placeholder="Opsional"
                                maxLength={20}
                            />
                            <InputError message={errors.isbn} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id_kategori">Kategori</Label>
                            <Select
                                value={data.id_kategori}
                                onValueChange={(v) => setData('id_kategori', v)}
                            >
                                <SelectTrigger id="id_kategori">
                                    <SelectValue placeholder="Pilih kategori..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Tidak ada</SelectItem>
                                    {kategori.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            Tidak ada data kategori
                                        </div>
                                    ) : (
                                        kategori.map((k) => (
                                            <SelectItem key={k.id_kategori} value={k.id_kategori.toString()}>
                                                {k.nama_kategori}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.id_kategori} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="id_jenis">Jenis</Label>
                            <Select
                                value={data.id_jenis}
                                onValueChange={(v) => setData('id_jenis', v)}
                            >
                                <SelectTrigger id="id_jenis">
                                    <SelectValue placeholder="Pilih jenis..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Tidak ada</SelectItem>
                                    {jenis.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            Tidak ada data jenis
                                        </div>
                                    ) : (
                                        jenis.map((j) => (
                                            <SelectItem key={j.id_jenis} value={j.id_jenis.toString()}>
                                                {j.nama_jenis}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.id_jenis} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/inventaris-barang">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
