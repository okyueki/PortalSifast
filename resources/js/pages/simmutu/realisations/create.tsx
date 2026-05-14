import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Rekap Mutu', href: '/simmutu/realisations' },
    { title: 'Input', href: '#' },
];

type IndicatorOption = {
    id: number;
    title: string;
    category_name: string | null;
    description: string | null;
    collection_frequency: string;
    collection_frequency_label: string;
    numerator_definition: string;
    denominator_definition: string;
    dep_ids: string[];
};

type DailyRow = {
    mutu_indicator_id: number;
    dep_id: string;
    date: string;
    day: number;
    achievement_percent: number | null;
};

type CalendarDay = {
    date: string;
    day: number;
};

type Props = {
    indicators: IndicatorOption[];
    userDepId: string | null;
    selectedMonth: string;
    calendarDays: CalendarDay[];
    dailyRows: DailyRow[];
};

const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});
const dayNameFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });

function ymdToDate(ymd: string): Date {
    return new Date(`${ymd}T00:00:00`);
}

export default function MutuRealisationsCreate({
    indicators,
    userDepId,
    selectedMonth,
    calendarDays,
    dailyRows,
}: Props) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;
    const firstId = indicators[0]?.id;
    const [searchText, setSearchText] = useState('');

    const { data, setData, post, processing, errors, transform } = useForm({
        mutu_indicator_id: firstId ? String(firstId) : '',
        dep_id: userDepId ?? '',
        period_date: '',
        numerator_value: '',
        denominator_value: '',
        notes: '',
    });

    transform((raw) => ({
        ...raw,
        mutu_indicator_id: Number(raw.mutu_indicator_id),
        numerator_value: Number(raw.numerator_value),
        denominator_value: Number(raw.denominator_value),
    }));

    const filteredIndicators = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (keyword.length === 0) {
            return indicators;
        }

        return indicators.filter((i) => {
            const haystack = `${i.title} ${i.category_name ?? ''} ${i.description ?? ''}`.toLowerCase();
            return haystack.includes(keyword);
        });
    }, [indicators, searchText]);

    const selected = useMemo(
        () => indicators.find((i) => String(i.id) === String(data.mutu_indicator_id)),
        [indicators, data.mutu_indicator_id],
    );

    const depChoices = selected?.dep_ids ?? [];

    const monthlyRowsForSelected = useMemo(() => {
        const selectedIndicatorId = Number(data.mutu_indicator_id);
        if (!selectedIndicatorId) {
            return [] as DailyRow[];
        }

        return dailyRows.filter((r) => r.mutu_indicator_id === selectedIndicatorId);
    }, [dailyRows, data.mutu_indicator_id]);

    const statusByDate = useMemo(() => {
        const map = new Map<string, DailyRow>();
        for (const row of monthlyRowsForSelected) {
            map.set(row.date, row);
        }
        return map;
    }, [monthlyRowsForSelected]);

    const selectedDate = data.period_date || calendarDays[0]?.date || '';

    useEffect(() => {
        if (!data.period_date && calendarDays.length > 0) {
            setData('period_date', calendarDays[0].date);
        }
    }, [data.period_date, calendarDays, setData]);

    const percentagePreview = useMemo(() => {
        const n = Number(data.numerator_value);
        const d = Number(data.denominator_value);
        if (Number.isNaN(n) || Number.isNaN(d) || d <= 0) {
            return null;
        }

        return ((n / d) * 100).toFixed(2);
    }, [data.numerator_value, data.denominator_value]);

    const todayDate = new Date().toISOString().slice(0, 10);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Input Realisasi Mutu Harian" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Heading
                            title="Input Realisasi Mutu Harian"
                            description="Input dan monitoring laporan harian indikator mutu"
                        />
                        <div className="flex items-center gap-2">
                            <Button variant="default" size="sm">
                                Input Harian
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/simmutu/recap/departments">Monitoring Bulanan</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="relative mt-4">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="pl-9"
                            placeholder="Cari indikator..."
                        />
                    </div>
                </div>

                {indicators.length === 0 ? (
                    <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                        Tidak ada indikator aktif untuk departemen Anda. Hubungi tim mutu untuk pemetaan indikator.
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                        <div className="rounded-xl border bg-card p-3">
                            <div className="mb-3 flex items-center justify-between rounded-md border p-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const [y, m] = selectedMonth.split('-').map(Number);
                                        const prev = new Date(y, m - 2, 1);
                                        const value = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
                                        router.get('/simmutu/realisations/create', { month: value });
                                    }}
                                >
                                    {'<'}
                                </Button>
                                <div className="text-center text-sm font-semibold">
                                    {monthFormatter.format(ymdToDate(`${selectedMonth}-01`))}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const [y, m] = selectedMonth.split('-').map(Number);
                                        const next = new Date(y, m, 1);
                                        const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
                                        router.get('/simmutu/realisations/create', { month: value });
                                    }}
                                >
                                    {'>'}
                                </Button>
                            </div>

                            <div className="mb-3 space-y-1 text-xs">
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> sudah diisi</div>
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> belum diisi</div>
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> hari ini</div>
                            </div>

                            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
                                {calendarDays.map((d) => {
                                    const row = statusByDate.get(d.date);
                                    const isSelected = d.date === selectedDate;
                                    const isToday = d.date === todayDate;
                                    const filled = row?.achievement_percent !== null && row?.achievement_percent !== undefined;

                                    return (
                                        <button
                                            key={d.date}
                                            type="button"
                                            onClick={() => setData('period_date', d.date)}
                                            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-transparent hover:border-border hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{d.day} {dayNameFormatter.format(ymdToDate(d.date))}</span>
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        isToday ? 'bg-blue-500' : filled ? 'bg-emerald-500' : 'bg-rose-400'
                                                    }`}
                                                />
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {filled && row?.achievement_percent !== null
                                                    ? `${row.achievement_percent.toFixed(2)}%`
                                                    : 'belum input'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-4">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {selectedDate ? dateFormatter.format(ymdToDate(selectedDate)) : 'Pilih tanggal'}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    post('/simmutu/realisations');
                                }}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label>Indikator</Label>
                                    <Select
                                        value={String(data.mutu_indicator_id)}
                                        onValueChange={(v) => {
                                            setData('mutu_indicator_id', v);
                                            const ind = indicators.find((i) => String(i.id) === v);
                                            if (userDepId) {
                                                setData('dep_id', userDepId);
                                            } else if (ind && ind.dep_ids.length === 1) {
                                                setData('dep_id', ind.dep_ids[0]);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredIndicators.map((i) => (
                                                <SelectItem key={i.id} value={String(i.id)}>
                                                    {i.title}
                                                    {i.category_name ? ` — ${i.category_name}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.mutu_indicator_id} />
                                </div>

                                {selected && (
                                    <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                                        <p>
                                            <span className="font-medium text-foreground">Deskripsi:</span>{' '}
                                            {selected.description || '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-foreground">Profil:</span> {selected.collection_frequency_label}
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Penginput</Label>
                                        <Input value={auth?.user?.name ?? '-'} disabled />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Departemen</Label>
                                        {userDepId ? (
                                            <Input value={userDepId} disabled />
                                        ) : (
                                            <Select value={data.dep_id} onValueChange={(v) => setData('dep_id', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih departemen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {depChoices.map((d) => (
                                                        <SelectItem key={d} value={d}>
                                                            {d}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <InputError message={errors.dep_id} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="period_date">Tanggal periode</Label>
                                    <Input
                                        id="period_date"
                                        type="date"
                                        value={data.period_date}
                                        onChange={(e) => setData('period_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.period_date} />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="numerator_value">Numerator</Label>
                                        {selected && <p className="text-xs text-muted-foreground">{selected.numerator_definition}</p>}
                                        <Input
                                            id="numerator_value"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={data.numerator_value}
                                            onChange={(e) => setData('numerator_value', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.numerator_value} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="denominator_value">Denominator</Label>
                                        {selected && <p className="text-xs text-muted-foreground">{selected.denominator_definition}</p>}
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

                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    <span className="font-medium">Preview Capaian: </span>
                                    {percentagePreview !== null ? `${percentagePreview}%` : '-'}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Catatan (opsional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                    />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Menyimpan…' : 'Tambah Data'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/simmutu/realisations">Batal</Link>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
