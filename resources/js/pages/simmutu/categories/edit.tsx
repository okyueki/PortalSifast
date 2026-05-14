import { Head, Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Kategori Mutu', href: '/simmutu/categories' },
    { title: 'Edit', href: '#' },
];

type Option = { value: string; label: string };

type Category = {
    id: number;
    name: string;
    short_name: string | null;
    scope: string;
    description: string | null;
    is_general_use: boolean;
    obligation_profile: string | null;
    is_active: boolean;
};

type Props = {
    category: Category;
    scopeOptions: Option[];
    obligationOptions: Option[];
};

export default function MutuCategoriesEdit({ category, scopeOptions, obligationOptions }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        short_name: category.short_name ?? '',
        scope: category.scope,
        description: category.description ?? '',
        is_general_use: category.is_general_use,
        obligation_profile: category.obligation_profile ?? '',
        is_active: category.is_active,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${category.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading title="Edit Kategori Mutu" description="Perbarui definisi kategori." />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        put(`/simmutu/categories/${category.id}`);
                    }}
                    className="max-w-xl space-y-5 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="short_name">Singkatan (opsional)</Label>
                        <Input
                            id="short_name"
                            value={data.short_name}
                            onChange={(e) => setData('short_name', e.target.value)}
                        />
                        <InputError message={errors.short_name} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Lingkup</Label>
                        <Select value={data.scope} onValueChange={(v) => setData('scope', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {scopeOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.scope} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Profil kewajiban (opsional)</Label>
                        <Select
                            value={data.obligation_profile || '__none__'}
                            onValueChange={(v) => setData('obligation_profile', v === '__none__' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Tidak dipilih</SelectItem>
                                {obligationOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.obligation_profile} />
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="is_general_use"
                                checked={data.is_general_use}
                                onCheckedChange={(c) => setData('is_general_use', c === true)}
                            />
                            <Label htmlFor="is_general_use" className="cursor-pointer">
                                Mutu umum (general use)
                            </Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(c) => setData('is_active', c === true)}
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Aktif
                            </Label>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/simmutu/categories">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
