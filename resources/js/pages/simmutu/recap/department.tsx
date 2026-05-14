import { Head, Link, router, useForm } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Rekap Departemen', href: '/simmutu/recap/departments' },
];

type DepartmentRecap = {
    dep_id: string;
    entry_count: number;
    indicator_count: number;
    avg_achievement: number | null;
    min_achievement: number | null;
    max_achievement: number | null;
};

type TrendPoint = {
    date: string;
    day: number;
    avg_achievement: number | null;
};

type Option = { id: number; title: string };

type Props = {
    month: string;
    departmentRecaps: DepartmentRecap[];
    dailyTrend: TrendPoint[];
    selectedDep: string;
    depOptions: string[];
    indicatorOptions: Option[];
    filters: {
        dep_id?: string;
        mutu_indicator_id?: string | number;
        chart_dep_id?: string;
    };
};

function formatPercent(value: number | null): string {
    return value === null ? '-' : `${value.toFixed(2)}%`;
}

export default function SimmutuDepartmentRecapPage({
    month,
    departmentRecaps,
    dailyTrend,
    selectedDep,
    depOptions,
    indicatorOptions,
    filters,
}: Props) {
    const { data, setData } = useForm({
        month,
        dep_id: filters.dep_id || '__all__',
        mutu_indicator_id: filters.mutu_indicator_id ? String(filters.mutu_indicator_id) : '__all__',
        chart_dep_id: filters.chart_dep_id || selectedDep || '__all__',
    });

    const applyFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/simmutu/recap/departments', {
            month: data.month,
            dep_id: data.dep_id === '__all__' ? undefined : data.dep_id,
            mutu_indicator_id: data.mutu_indicator_id === '__all__' ? undefined : data.mutu_indicator_id,
            chart_dep_id: data.chart_dep_id === '__all__' ? undefined : data.chart_dep_id,
        });
    };

    const rankingData = departmentRecaps.map((r) => ({
        dep_id: r.dep_id,
        avg_achievement: r.avg_achievement ?? 0,
        entry_count: r.entry_count,
    }));

    const missingDays = dailyTrend.filter((d) => d.avg_achievement === null).map((d) => d.day);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekap Mutu per Departemen" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Heading
                        title="Rekap Mutu per Departemen"
                        description="Pantau capaian mutu tiap unit dan tren harian pada bulan terpilih."
                    />
                    <Button asChild variant="outline">
                        <Link href="/simmutu/realisations/create">Input Realisasi</Link>
                    </Button>
                </div>

                <form onSubmit={applyFilter} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
                    <div className="grid gap-1">
                        <Label htmlFor="month">Bulan</Label>
                        <Input
                            id="month"
                            type="month"
                            value={data.month}
                            onChange={(e) => setData('month', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Departemen</Label>
                        <Select value={data.dep_id} onValueChange={(v) => setData('dep_id', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Semua departemen</SelectItem>
                                {depOptions.map((dep) => (
                                    <SelectItem key={dep} value={dep}>
                                        {dep}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label>Indikator</Label>
                        <Select value={data.mutu_indicator_id} onValueChange={(v) => setData('mutu_indicator_id', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Semua indikator</SelectItem>
                                {indicatorOptions.map((indicator) => (
                                    <SelectItem key={indicator.id} value={String(indicator.id)}>
                                        {indicator.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label>Grafik detail dep</Label>
                        <Select value={data.chart_dep_id} onValueChange={(v) => setData('chart_dep_id', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {depOptions.map((dep) => (
                                    <SelectItem key={dep} value={dep}>
                                        {dep}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button type="submit">Terapkan</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                router.get('/simmutu/recap/departments');
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </form>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4" />
                                Ranking Capaian per Departemen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={rankingData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="dep_id" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                                        <Bar dataKey="avg_achievement" fill="#2563eb" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Tren Harian Departemen {data.chart_dep_id}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip
                                            formatter={(v: number | null) => (v === null ? 'Belum diinput' : `${v.toFixed(2)}%`)}
                                            labelFormatter={(label) => `Tanggal ${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avg_achievement"
                                            stroke="#16a34a"
                                            strokeWidth={2}
                                            connectNulls={false}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Hari kosong (belum diinput): {missingDays.length > 0 ? missingDays.join(', ') : 'Tidak ada'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <h2 className="mb-3 text-sm font-semibold">Tabel Rekap Departemen ({month})</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-3 py-2">Departemen</th>
                                    <th className="px-3 py-2">Jumlah Entri</th>
                                    <th className="px-3 py-2">Jumlah Indikator</th>
                                    <th className="px-3 py-2">Rata-rata %</th>
                                    <th className="px-3 py-2">Min %</th>
                                    <th className="px-3 py-2">Max %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentRecaps.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                                            Belum ada data rekap pada filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    departmentRecaps.map((row) => (
                                        <tr key={row.dep_id} className="border-b last:border-0">
                                            <td className="px-3 py-2 font-mono">{row.dep_id}</td>
                                            <td className="px-3 py-2">{row.entry_count}</td>
                                            <td className="px-3 py-2">{row.indicator_count}</td>
                                            <td className="px-3 py-2">{formatPercent(row.avg_achievement)}</td>
                                            <td className="px-3 py-2">{formatPercent(row.min_achievement)}</td>
                                            <td className="px-3 py-2">{formatPercent(row.max_achievement)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
