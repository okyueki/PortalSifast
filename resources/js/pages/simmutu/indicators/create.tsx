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
    { title: 'Indikator Mutu', href: '/simmutu/indicators' },
    { title: 'Tambah', href: '#' },
];

type Option = { value: string; label: string };
type Department = { dep_id: string; nama: string };
type Category = { id: number; name: string };
type AccountableUser = { id: number; name: string; email: string };

type Props = {
    categories: Category[];
    departments: Department[];
    accountableUsers: AccountableUser[];
    indicatorKindOptions: Option[];
    collectionFrequencyOptions: Option[];
    analysisPeriodOptions: Option[];
};

export default function MutuIndicatorsCreate({
    categories,
    departments,
    accountableUsers,
    indicatorKindOptions,
    collectionFrequencyOptions,
    analysisPeriodOptions,
}: Props) {
    const defaultCategoryId = categories[0]?.id ?? '';

    const { data, setData, post, processing, errors, transform } = useForm({
        mutu_category_id: defaultCategoryId ? String(defaultCategoryId) : '',
        title: '',
        description: '',
        is_active: true,
        valid_from: '',
        valid_until: '',
        accountable_user_id: '__none__',
        indicator_kind: indicatorKindOptions[0]?.value ?? 'outcome',
        collection_frequency: collectionFrequencyOptions[0]?.value ?? 'bulanan',
        numerator_definition: '',
        denominator_definition: '',
        analysis_period: analysisPeriodOptions[0]?.value ?? 'monthly',
        has_mutu_benchmarking: false,
        data_source: '',
        target_value: '',
        weight_in_category: '1',
        dep_ids: [] as string[],
    });

    transform((raw) => ({
        ...raw,
        mutu_category_id: Number(raw.mutu_category_id),
        accountable_user_id:
            raw.accountable_user_id === '__none__' || raw.accountable_user_id === ''
                ? null
                : Number(raw.accountable_user_id),
        valid_from: raw.valid_from || null,
        valid_until: raw.valid_until || null,
        target_value: raw.target_value === '' ? null : raw.target_value,
        weight_in_category: raw.weight_in_category === '' ? 1 : Number(raw.weight_in_category),
    }));

    function toggleDep(depId: string): void {
        const next = new Set(data.dep_ids);
        if (next.has(depId)) {
            next.delete(depId);
        } else {
            next.add(depId);
        }
        setData('dep_ids', [...next]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Indikator Mutu" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading title="Tambah Indikator Mutu" description="Definisi numerator, denominator, dan pemetaan unit." />

                {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada kategori.{' '}
                        <Link href="/simmutu/categories/create" className="text-primary underline">
                            Buat kategori
                        </Link>{' '}
                        terlebih dahulu.
                    </p>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            post('/simmutu/indicators');
                        }}
                        className="max-w-3xl space-y-5 rounded-xl border bg-card p-6"
                    >
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Kategori</Label>
                                <Select
                                    value={String(data.mutu_category_id)}
                                    onValueChange={(v) => setData('mutu_category_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.mutu_category_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Penanggung jawab (opsional)</Label>
                                <Select
                                    value={String(data.accountable_user_id)}
                                    onValueChange={(v) => setData('accountable_user_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Tidak ada</SelectItem>
                                        {accountableUsers.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.accountable_user_id} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Judul indikator</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Jenis</Label>
                                <Select
                                    value={data.indicator_kind}
                                    onValueChange={(v) => setData('indicator_kind', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {indicatorKindOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.indicator_kind} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Frekuensi pengumpulan</Label>
                                <Select
                                    value={data.collection_frequency}
                                    onValueChange={(v) => setData('collection_frequency', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collectionFrequencyOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.collection_frequency} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Periode analisis</Label>
                                <Select
                                    value={data.analysis_period}
                                    onValueChange={(v) => setData('analysis_period', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {analysisPeriodOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.analysis_period} />
                            </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="valid_from">Berlaku dari (opsional)</Label>
                                <Input
                                    id="valid_from"
                                    type="date"
                                    value={data.valid_from}
                                    onChange={(e) => setData('valid_from', e.target.value)}
                                />
                                <InputError message={errors.valid_from} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="valid_until">Berlaku s/d (opsional)</Label>
                                <Input
                                    id="valid_until"
                                    type="date"
                                    value={data.valid_until}
                                    onChange={(e) => setData('valid_until', e.target.value)}
                                />
                                <InputError message={errors.valid_until} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="numerator_definition">Definisi numerator</Label>
                            <Textarea
                                id="numerator_definition"
                                value={data.numerator_definition}
                                onChange={(e) => setData('numerator_definition', e.target.value)}
                                rows={3}
                                required
                            />
                            <InputError message={errors.numerator_definition} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="denominator_definition">Definisi denominator</Label>
                            <Textarea
                                id="denominator_definition"
                                value={data.denominator_definition}
                                onChange={(e) => setData('denominator_definition', e.target.value)}
                                rows={3}
                                required
                            />
                            <InputError message={errors.denominator_definition} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="data_source">Sumber data (opsional)</Label>
                                <Input
                                    id="data_source"
                                    value={data.data_source}
                                    onChange={(e) => setData('data_source', e.target.value)}
                                />
                                <InputError message={errors.data_source} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="target_value">Nilai target (opsional)</Label>
                                <Input
                                    id="target_value"
                                    type="number"
                                    step="0.0001"
                                    value={data.target_value}
                                    onChange={(e) => setData('target_value', e.target.value)}
                                />
                                <InputError message={errors.target_value} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <Checkbox
                                id="has_mutu_benchmarking"
                                checked={data.has_mutu_benchmarking}
                                onCheckedChange={(c) => setData('has_mutu_benchmarking', c === true)}
                            />
                            <Label htmlFor="has_mutu_benchmarking" className="cursor-pointer">
                                Benchmarking mutu (di profil indikator)
                            </Label>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="weight_in_category">Bobot dalam kategori</Label>
                            <Input
                                id="weight_in_category"
                                type="number"
                                step="0.0001"
                                min="0"
                                value={data.weight_in_category}
                                onChange={(e) => setData('weight_in_category', e.target.value)}
                            />
                            <InputError message={errors.weight_in_category} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Unit terkait</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData('dep_ids', departments.map((d) => d.dep_id))}
                                >
                                    Pilih semua
                                </Button>
                            </div>
                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                                {departments.map((d) => (
                                    <div key={d.dep_id} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`dep-${d.dep_id}`}
                                            checked={data.dep_ids.includes(d.dep_id)}
                                            onCheckedChange={() => toggleDep(d.dep_id)}
                                        />
                                        <Label htmlFor={`dep-${d.dep_id}`} className="cursor-pointer text-sm font-normal">
                                            {d.nama} ({d.dep_id})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <InputError message={errors.dep_ids} />
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

                        <div className="flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan…' : 'Simpan'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/simmutu/indicators">Batal</Link>
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
