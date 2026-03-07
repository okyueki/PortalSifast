import { Head, Link, useForm, usePage } from '@inertiajs/react';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan Darurat', href: '/emergency-reports' },
    { title: 'Input Laporan (Admin)', href: '/emergency-reports/create' },
];

type Props = {
    categories: Record<string, string>;
};

export default function EmergencyReportsCreate({ categories }: Props) {
    const pageErrors = (usePage().props.errors as Record<string, string[]> | undefined) ?? {};
    const form = useForm({
        nik: '',
        latitude: '',
        longitude: '',
        address: '',
        category: '',
        sender_name: '',
        sender_phone: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/emergency-reports', {
            transform: (data) => ({
                ...data,
                latitude: data.latitude ? parseFloat(data.latitude) : undefined,
                longitude: data.longitude ? parseFloat(data.longitude) : undefined,
            }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Input Laporan Darurat (Admin)" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/emergency-reports">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Input Laporan Darurat (Admin)"
                        description="Untuk pengujian dan laporan internal. NIK akan dicocokkan dengan data Pegawai SIMRS."
                    />
                </div>

                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-2">
                        <Label htmlFor="nik">NIK Pelapor *</Label>
                        <Input
                            id="nik"
                            value={form.data.nik}
                            onChange={(e) => form.setData('nik', e.target.value)}
                            placeholder="NIK pegawai (wajib)"
                            required
                        />
                        <InputError message={form.errors.nik ?? (Array.isArray(pageErrors.nik) ? pageErrors.nik[0] : pageErrors.nik)} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude *</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={form.data.latitude}
                                onChange={(e) => form.setData('latitude', e.target.value)}
                                placeholder="-6.200000"
                                required
                            />
                            <InputError message={form.errors.latitude} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude *</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={form.data.longitude}
                                onChange={(e) => form.setData('longitude', e.target.value)}
                                placeholder="106.816666"
                                required
                            />
                            <InputError message={form.errors.longitude} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Alamat *</Label>
                        <Textarea
                            id="address"
                            value={form.data.address}
                            onChange={(e) => form.setData('address', e.target.value)}
                            placeholder="Jl. Contoh No.1, Kota"
                            rows={2}
                            required
                        />
                        <InputError message={form.errors.address} />
                    </div>

                    <div className="space-y-2">
                        <Label>Kategori *</Label>
                        <Select
                            value={form.data.category}
                            onValueChange={(v) => form.setData('category', v)}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categories).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.category} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sender_name">Nama Pelapor (opsional)</Label>
                            <Input
                                id="sender_name"
                                value={form.data.sender_name}
                                onChange={(e) => form.setData('sender_name', e.target.value)}
                                placeholder="Kosongkan = ambil dari data pegawai"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sender_phone">No. HP Pelapor (opsional)</Label>
                            <Input
                                id="sender_phone"
                                value={form.data.sender_phone}
                                onChange={(e) => form.setData('sender_phone', e.target.value)}
                                placeholder="08123456789"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan (opsional)</Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Keterangan tambahan"
                            rows={3}
                        />
                        <InputError message={form.errors.notes} />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan Laporan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/emergency-reports">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
