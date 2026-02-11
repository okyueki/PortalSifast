import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
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
    { title: 'Daftar User', href: '/users' },
    { title: 'Tambah User', href: '/users/create' },
];

type PegawaiOption = {
    nik: string;
    nama: string;
    email: string;
    phone: string | null;
};

type Props = {
    availablePegawai: PegawaiOption[];
};

export default function UsersCreate({ availablePegawai }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        simrs_nik: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
    });

    const [selectedPegawaiNik, setSelectedPegawaiNik] = useState<string>('');

    const handlePegawaiChange = (nik: string) => {
        setSelectedPegawaiNik(nik);
        const pegawai = availablePegawai.find((p) => p.nik === nik);
        if (pegawai) {
            setData({
                simrs_nik: pegawai.nik,
                name: pegawai.nama,
                email: pegawai.email,
                phone: pegawai.phone || '',
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Tambah User"
                    description="Buat user baru dari data pegawai SIMRS atau manual"
                />

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="pegawai">Pilih Pegawai dari SIMRS (opsional)</Label>
                        <Select
                            value={selectedPegawaiNik}
                            onValueChange={handlePegawaiChange}
                        >
                            <SelectTrigger id="pegawai">
                                <SelectValue placeholder="Pilih pegawai untuk auto-fill data..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePegawai.length === 0 ? (
                                    <SelectItem value="" disabled>
                                        Semua pegawai sudah jadi user
                                    </SelectItem>
                                ) : (
                                    availablePegawai.map((p) => (
                                        <SelectItem key={p.nik} value={p.nik}>
                                            {p.nama} ({p.email})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Pilih pegawai untuk mengisi otomatis nama, email, dan no HP.
                            Atau isi manual di bawah.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nama lengkap"
                            autoComplete="name"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@contoh.com"
                            autoComplete="email"
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Min. 8 karakter"
                            autoComplete="new-password"
                            required
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Ulangi password"
                            autoComplete="new-password"
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">No. HP (opsional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="081234567890"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/users">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
