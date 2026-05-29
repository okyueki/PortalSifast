import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactSelect from 'react-select';
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

type IndicatorSelectOption = {
    value: string;
    label: string;
    id: number;
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

type MonthRealization = {
    id: number;
    mutu_indicator_id: number;
    indicator_title: string | null;
    dep_id: string;
    period_anchor: string;
    numerator_value: number | null;
    denominator_value: number | null;
    achievement_percent: number | null;
    notes: string | null;
    input_by_name: string | null;
    created_at: string | null;
};

type Props = {
    indicators: IndicatorOption[];
    userDepId: string | null;
    selectedMonth: string;
    calendarDays: CalendarDay[];
    dailyRows: DailyRow[];
    monthRealizations: MonthRealization[];
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
    dailyRows: initialDailyRows,
    monthRealizations,
}: Props) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;

    // Local state for daily rows (to update after submission)
    const [dailyRows, setDailyRows] = useState<DailyRow[]>(initialDailyRows);

    // Local state for month realizations (to update after submission)
    const [localMonthRealizations, setLocalMonthRealizations] = useState<MonthRealization[]>(monthRealizations);

    // Success message state
    const [showSuccess, setShowSuccess] = useState(false);

    // Tab state: 'form' or 'data'
    const [activeTab, setActiveTab] = useState<'form' | 'data'>('form');

    // Reset states when month changes
    useEffect(() => {
        setDailyRows(initialDailyRows);
        setLocalMonthRealizations(monthRealizations);
    }, [initialDailyRows, monthRealizations]);

    // Get all unique departments from all indicators
    const allDepChoices = useMemo(() => {
        const deps = new Set<string>();
        indicators.forEach((i: IndicatorOption) => i.dep_ids.forEach((d: string) => deps.add(d)));
        return Array.from(deps).sort();
    }, [indicators]);

    const { data, setData, post, processing, errors, transform } = useForm({
        mutu_indicator_id: '',
        dep_id: userDepId ?? '',
        period_date: '',
        numerator_value: '',
        denominator_value: '',
        notes: '',
    });

    // Handle successful submission
    const handleSuccess = () => {
        // Calculate achievement percent
        const n = Number(data.numerator_value);
        const d = Number(data.denominator_value);
        const achievement = d > 0 ? (n / d) * 100 : null;

        // Add to local dailyRows state
        const newRow: DailyRow = {
            mutu_indicator_id: Number(data.mutu_indicator_id),
            dep_id: data.dep_id,
            date: data.period_date,
            day: parseInt(data.period_date.split('-')[2], 10),
            achievement_percent: achievement,
        };

        setDailyRows((prev: DailyRow[]) => [...prev, newRow]);

        // Find indicator title
        const indicatorTitle = filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id))?.title ?? '';

        // Add to local month realizations
        const newRealization: MonthRealization = {
            id: Date.now(), // temporary id
            mutu_indicator_id: Number(data.mutu_indicator_id),
            indicator_title: indicatorTitle,
            dep_id: data.dep_id,
            period_anchor: `D:${data.period_date}`,
            numerator_value: n,
            denominator_value: d,
            achievement_percent: achievement,
            notes: data.notes || null,
            input_by_name: auth?.user?.name ?? null,
            created_at: new Date().toISOString(),
        };

        setLocalMonthRealizations((prev: MonthRealization[]) => [newRealization, ...prev]);

        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Reset form
        setData({
            mutu_indicator_id: data.mutu_indicator_id,
            dep_id: data.dep_id,
            period_date: '',
            numerator_value: '',
            denominator_value: '',
            notes: '',
        });
    };

    transform((raw) => ({
        ...raw,
        mutu_indicator_id: Number(raw.mutu_indicator_id),
        numerator_value: Number(raw.numerator_value),
        denominator_value: Number(raw.denominator_value),
    }));

    // Filter indicators based on selected department
    const filteredByDepIndicators = useMemo(() => {
        if (!data.dep_id) return [];
        return indicators.filter((i: IndicatorOption) => i.dep_ids.includes(data.dep_id));
    }, [indicators, data.dep_id]);

    const selected = useMemo(
        () => filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id)),
        [filteredByDepIndicators, data.mutu_indicator_id],
    );

    // Auto-select indicator when only 1 option available
    useEffect(() => {
        if (filteredByDepIndicators.length === 1 && !data.mutu_indicator_id) {
            setData('mutu_indicator_id', String(filteredByDepIndicators[0].id));
        } else if (filteredByDepIndicators.length === 0) {
            setData('mutu_indicator_id', '');
        }
    }, [data.dep_id, filteredByDepIndicators.length]);

    // Reset indicator when department changes
    useEffect(() => {
        if (data.mutu_indicator_id) {
            const stillValid = filteredByDepIndicators.some((i: IndicatorOption) => String(i.id) === data.mutu_indicator_id);
            if (!stillValid) {
                setData('mutu_indicator_id', '');
            }
        }
    }, [filteredByDepIndicators]);

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

                    </div>

                {indicators.length === 0 ? (
                    <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                        Tidak ada indikator aktif untuk departemen Anda. Hubungi tim mutu untuk pemetaan indikator.
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                        <div className="rounded-xl border bg-card p-3">
                            {/* Tab Headers */}
                            <div className="mb-3 flex border-b">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('form')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium transition ${
                                        activeTab === 'form'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Kalender
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('data')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium transition ${
                                        activeTab === 'data'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Data ({localMonthRealizations.length})
                                </button>
                            </div>

                            {activeTab === 'form' && (
                                <>
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
                                                {filled && row?.achievement_percent !== null && row?.achievement_percent !== undefined
                                                    ? `${Number(row.achievement_percent).toFixed(2)}%`
                                                    : 'belum input'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                                </>
                            )}

                            {activeTab === 'data' && (
                                <div className="max-h-[60vh] space-y-1 overflow-y-auto">
                                    {localMonthRealizations.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted-foreground">
                                            Belum ada data bulan ini
                                        </div>
                                    ) : (
                                        localMonthRealizations.map((r) => {
                                            const dateOnly = r.period_anchor.replace('D:', '').replace('W:', '').replace('M:', '').replace('Y:', '');
                                            return (
                                                <div
                                                    key={r.id}
                                                    className="flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/50"
                                                >
                                                    <div>
                                                        <div className="font-medium">{dateOnly}</div>
                                                        <div className="text-muted-foreground truncate max-w-[120px]">{r.indicator_title ?? '-'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-medium ${r.achievement_percent !== null && r.achievement_percent >= 100 ? 'text-emerald-600' : r.achievement_percent !== null && r.achievement_percent >= 80 ? 'text-primary' : 'text-amber-600'}`}>
                                                            {r.achievement_percent !== null ? `${Number(r.achievement_percent).toFixed(0)}%` : '-'}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-5 w-5 p-0 ml-1"
                                                        >
                                                            <Link href={`/simmutu/realisations/${r.id}/edit`}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {showSuccess && (
                            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <CheckCircle2 className="h-4 w-4" />
                                Data berhasil disimpan
                            </div>
                        )}

                        <div className="rounded-xl border bg-card p-4">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {selectedDate ? dateFormatter.format(ymdToDate(selectedDate)) : 'Pilih tanggal'}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    post('/simmutu/realisations', {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            handleSuccess();
                                        },
                                    });
                                }}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label>Indikator</Label>
                                    <ReactSelect<IndicatorSelectOption, false>
                                        inputId="mutu_indicator_id"
                                        isDisabled={!data.dep_id}
                                        value={filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id)) ? {
                                            value: String(data.mutu_indicator_id),
                                            label: `${filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id))?.title}${filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id))?.category_name ? ` — ${filteredByDepIndicators.find((i: IndicatorOption) => String(i.id) === String(data.mutu_indicator_id))?.category_name}` : ''}`,
                                            id: Number(data.mutu_indicator_id),
                                        } : null}
                                        options={filteredByDepIndicators.map((i: IndicatorOption) => ({
                                            value: String(i.id),
                                            label: `${i.title}${i.category_name ? ` — ${i.category_name}` : ''}`,
                                            id: i.id,
                                        }))}
                                        onChange={(option) => {
                                            setData('mutu_indicator_id', option?.value ?? '');
                                        }}
                                        placeholder={data.dep_id ? "Pilih indikator..." : "Pilih departemen terlebih dahulu"}
                                        isSearchable
                                        noOptionsMessage={() => data.dep_id ? 'Tidak ada indikator' : 'Pilih departemen terlebih dahulu'}
                                        className="text-sm"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderColor: errors.mutu_indicator_id ? '#ef4444' : base.borderColor,
                                            }),
                                        }}
                                    />
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
                                            <ReactSelect
                                                inputId="dep_id"
                                                value={allDepChoices.find((d) => d === data.dep_id) ? { value: data.dep_id, label: data.dep_id } : null}
                                                options={allDepChoices.map((d: string) => ({ value: d, label: d }))}
                                                onChange={(option) => setData('dep_id', option?.value ?? '')}
                                                placeholder="Pilih departemen..."
                                                isSearchable
                                                className="text-sm"
                                            />
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
                                        rows={2}
                                    />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={processing || (percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value))}
                                        variant={percentagePreview !== null && parseFloat(data.numerator_value) > parseFloat(data.denominator_value) ? 'destructive' : 'default'}
                                    >
                                        {processing ? 'Menyimpan…' : 'Tambah Data'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/simmutu/realisations">Batal</Link>
                                    </Button>
                                </div>
                            </form>
                            {/* Tab Content: Data Bulan Ini */}
                            {activeTab === 'data' && (
                                <div className="overflow-x-auto">
                                    {localMonthRealizations.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada data untuk bulan ini
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="pb-2 text-left font-medium text-muted-foreground">Tanggal</th>
                                                    <th className="pb-2 text-left font-medium text-muted-foreground">Indikator</th>
                                                    <th className="pb-2 text-right font-medium text-muted-foreground">Num</th>
                                                    <th className="pb-2 text-right font-medium text-muted-foreground">Denom</th>
                                                    <th className="pb-2 text-right font-medium text-muted-foreground">%</th>
                                                    <th className="pb-2 text-left font-medium text-muted-foreground">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {localMonthRealizations.map((r) => {
                                                    const dateOnly = r.period_anchor.replace('D:', '').replace('W:', '').replace('M:', '').replace('Y:', '');
                                                    return (
                                                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                                            <td className="py-2">{dateOnly}</td>
                                                            <td className="py-2 max-w-[150px] truncate">{r.indicator_title ?? '-'}</td>
                                                            <td className="py-2 text-right">{r.numerator_value !== null ? Number(r.numerator_value).toFixed(0) : '-'}</td>
                                                            <td className="py-2 text-right">{r.denominator_value !== null ? Number(r.denominator_value).toFixed(0) : '-'}</td>
                                                            <td className={`py-2 text-right font-medium ${r.achievement_percent !== null && r.achievement_percent >= 100 ? 'text-emerald-600' : r.achievement_percent !== null && r.achievement_percent >= 80 ? 'text-primary' : 'text-amber-600'}`}>
                                                                {r.achievement_percent !== null ? `${Number(r.achievement_percent).toFixed(0)}%` : '-'}
                                                            </td>
                                                            <td className="py-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Link href={`/simmutu/realisations/${r.id}/edit`}>
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Link>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
