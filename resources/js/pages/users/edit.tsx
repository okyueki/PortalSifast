import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    { title: 'Edit User', href: '#' },
];

type Department = {
    dep_id: string;
    nama: string;
};

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        dep_id: string | null;
    };
    departments: Department[];
};

export default function UsersEdit({ user, departments }: Props) {
    const { data, setData } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        phone: user.phone || '',
        role: user.role,
        dep_id: user.dep_id || '__none__',
    });

    const pageErrors = (usePage().props as { errors?: Record<string, string | string[]> }).errors ?? {};
    const getError = (field: string) => {
        const e = pageErrors[field];
        return Array.isArray(e) ? e[0] : e;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            role: data.role,
            dep_id: data.dep_id === '__none__' ? null : data.dep_id,
        };
        if (data.password) {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        setIsSubmitting(true);
        router.put(`/users/${user.id}`, payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Edit User"
                    description="Ubah role dan data user"
                />

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nama lengkap"
                            required
                        />
                        <InputError message={getError('name')} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            required
                        />
                        <InputError message={getError('email')} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={data.role}
                            onValueChange={(v) => setData('role', v)}
                        >
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="pemohon">Pemohon</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Admin: full access. Staff: handle tiket departemen. Pemohon: buat & lihat tiket sendiri.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dep_id">Departemen (untuk Staff)</Label>
                        <Select
                            value={data.dep_id}
                            onValueChange={(v) => setData('dep_id', v)}
                        >
                            <SelectTrigger id="dep_id">
                                <SelectValue placeholder="Pilih departemen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Tidak ada</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.dep_id} value={d.dep_id}>
                                        {d.nama} ({d.dep_id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Wajib untuk Staff (IT/IPS). Kosongkan untuk Admin/Pemohon.
                        </p>
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
                        <InputError message={getError('phone')} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password baru (kosongkan jika tidak ingin mengubah)</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Min. 8 karakter"
                            autoComplete="new-password"
                        />
                        <InputError message={getError('password')} />
                    </div>

                    {data.password && (
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                placeholder="Ulangi password"
                            />
                            <InputError message={getError('password_confirmation')} />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan…' : 'Simpan'}
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
