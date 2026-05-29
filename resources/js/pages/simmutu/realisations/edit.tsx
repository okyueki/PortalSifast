import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Rekap Mutu', href: '/simmutu/realisations' },
    { title: 'Edit', href: '#' },
];

type IndicatorOption = {
    id: number;
    title: string;
};

type Props = {
    realisation: {
        id: number;
        mutu_indicator_id: number;
        indicator_title: string | null;
        category_name: string | null;
        dep_id: string;
        period_anchor: string;
        numerator_value: number | null;
        denominator_value: number | null;
        achievement_percent: number | null;
        notes: string | null;
        input_by: number | null;
        input_by_name: string | null;
        created_at: string | null;
        can_edit: boolean;
    };
    indicatorOptions: IndicatorOption[];
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

function ymdToDate(ymd: string): Date {
    return new Date(`${ymd}T00:00:00`);
}

function formatPeriodAnchor(anchor: string): string {
    if (anchor.startsWith('D:')) {
        return dateFormatter.format(ymdToDate(anchor.replace('D:', '')));
    }
    if (anchor.startsWith('W:')) {
        return `Minggu ${anchor.replace('W:', '')}`;
    }
    if (anchor.startsWith('M:')) {
        const [year, month] = anchor.replace('M:', '').split('-');
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
            new Date(`${year}-${month}-01`),
        );
    }
    if (anchor.startsWith('Y:')) {
        return `Tahun ${anchor.replace('Y:', '')}`;
    }
    return anchor;
}

export default function MutuRealisationsEdit({ realisation, indicatorOptions }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        numerator_value: String(realisation.numerator_value ?? ''),
        denominator_value: String(realisation.denominator_value ?? ''),
        notes: realisation.notes ?? '',
    });

    const percentagePreview = (() => {
        const n = Number(data.numerator_value);
        const d = Number(data.denominator_value);
        if (Number.isNaN(n) || Number.isNaN(d) || d <= 0) {
            return null;
        }
        return ((n / d) * 100).toFixed(2);
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/simmutu/realisations/${realisation.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Realisasi Mutu" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Edit Realisasi Mutu"
                        description="Update data capaian indikator mutu."
                    />
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/simmutu/realisations">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="mb-6 grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-2">
                        <div>
                            <span className="text-muted-foreground">Indikator</span>
                            <p className="font-medium">{realisation.indicator_title ?? '–'}</p>
                            {realisation.category_name && (
                                <p className="text-xs text-muted-foreground">{realisation.category_name}</p>
                            )}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Departemen</span>
                            <p className="font-medium">{realisation.dep_id}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Periode</span>
                            <p className="font-medium">{formatPeriodAnchor(realisation.period_anchor)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Input oleh</span>
                            <p className="font-medium">{realisation.input_by_name ?? '–'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="numerator_value">Numerator</Label>
                                <Input
                                    id="numerator_value"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    max={data.denominator_value || undefined}
                                    value={data.numerator_value}
                                    onChange={(e) => setData('numerator_value', e.target.value)}
                                    required
                                    className={percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value) ? 'border-destructive focus:border-destructive' : ''}
                                />
                                <InputError message={errors.numerator_value} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="denominator_value">Denominator</Label>
                                <Input
                                    id="denominator_value"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={data.denominator_value}
                                    onChange={(e) => setData('denominator_value', e.target.value)}
                                    required
                                />
                                <InputError message={errors.denominator_value} />
                            </div>
                        </div>

                        <div className={`rounded-md border p-3 text-sm ${percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value) ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Preview Capaian: </span>
                                {percentagePreview !== null ? (
                                    <span className={parseFloat(data.numerator_value) > parseFloat(data.denominator_value) ? 'text-destructive font-semibold' : 'text-primary font-semibold'}>
                                        {percentagePreview}%
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </div>
                            {percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value) && (
                                <p className="mt-2 text-xs text-destructive">
                                    Peringatan: Numerator tidak boleh lebih besar dari denominator, BACA dan Telili lagi input Anda.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan (opsional)</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                placeholder="Tambahkan catatan jika diperlukan..."
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={processing || (percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value))}
                                variant={percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value) ? 'destructive' : 'default'}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/simmutu/realisations">Batal</Link>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}