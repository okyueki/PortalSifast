import { Head, Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Banknote,
    Calendar,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
    { title: 'Analytics', href: '/payroll/dashboard' },
];

type TrendDataItem = {
    period: string;
    period_raw: string;
    total_employees: number;
    total_penerimaan: number;
    avg_penerimaan: number;
    total_pajak: number;
    total_zakat: number;
};

type UnitDistItem = {
    unit: string;
    count: number;
    total: number;
};

type TopEarner = {
    id: number;
    name: string | null;
    unit: string | null;
    penerimaan: number;
};

type Props = {
    trendData: TrendDataItem[];
    unitDistribution: UnitDistItem[];
    yoyGrowth: {
        this_year: number;
        last_year: number;
        growth_percent: number;
    } | null;
    topEarners: TopEarner[];
    summary: {
        unique_employees: number;
        total_periods: number;
        lifetime_penerimaan: number;
    };
    latestPeriod: string | null;
};

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

export default function PayrollDashboard({ trendData, unitDistribution, yoyGrowth, topEarners, summary, latestPeriod }: Props) {
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatShortCurrency = (value: number): string => {
        if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
        return value.toString();
    };

    const latestTrend = trendData[trendData.length - 1];
    const prevTrend = trendData[trendData.length - 2];
    const monthlyChange = latestTrend && prevTrend
        ? latestTrend.total_penerimaan - prevTrend.total_penerimaan
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Analytics Payroll" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/payroll">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title="Dashboard Analytics"
                            description="Analisis tren dan distribusi gaji karyawan"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 shadow-sm dark:from-emerald-950 dark:to-emerald-900">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-medium">Total Pegawai</span>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                            {summary.unique_employees.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            unik sepanjang waktu
                        </p>
                    </div>

                    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm dark:from-blue-950 dark:to-blue-900">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Total Periode</span>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
                            {summary.total_periods}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">bulan data</p>
                    </div>

                    <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100 p-4 shadow-sm dark:from-violet-950 dark:to-violet-900">
                        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                            <Banknote className="h-4 w-4" />
                            <span className="text-sm font-medium">Total Disbursed</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-violet-900 dark:text-violet-100">
                            {formatShortCurrency(summary.lifetime_penerimaan)}
                        </p>
                        <p className="text-xs text-violet-600 dark:text-violet-400">sepanjang waktu</p>
                    </div>

                    {yoyGrowth && (
                        <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100 p-4 shadow-sm dark:from-amber-950 dark:to-amber-900">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm font-medium">YoY Growth</span>
                            </div>
                            <p className={`mt-2 flex items-center gap-1 text-3xl font-bold ${yoyGrowth.growth_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {yoyGrowth.growth_percent >= 0 ? <ArrowUp className="h-6 w-6" /> : <ArrowDown className="h-6 w-6" />}
                                {Math.abs(yoyGrowth.growth_percent)}%
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                vs tahun lalu
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-4 font-semibold">Tren Penerimaan (12 Bulan Terakhir)</h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorPenerimaan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="period" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                    <YAxis tickFormatter={formatShortCurrency} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_penerimaan"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPenerimaan)"
                                        name="Total Penerimaan"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                Belum ada data
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-4 font-semibold">Jumlah Pegawai per Bulan</h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="period" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                    />
                                    <Bar dataKey="total_employees" fill="#3b82f6" name="Jumlah Pegawai" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                Belum ada data
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-4 font-semibold">
                            Distribusi per Unit {latestPeriod && <span className="text-muted-foreground font-normal">({latestPeriod})</span>}
                        </h3>
                        {unitDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={unitDistribution}
                                        dataKey="total"
                                        nameKey="unit"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ unit, percent }) => `${unit.slice(0, 15)}${unit.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {unitDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid hsl(var(--border))',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                Belum ada data
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-4 font-semibold">
                            Top 5 Penerimaan Tertinggi {latestPeriod && <span className="text-muted-foreground font-normal">({latestPeriod})</span>}
                        </h3>
                        {topEarners.length > 0 ? (
                            <div className="space-y-3">
                                {topEarners.map((earner, index) => (
                                    <div key={earner.id} className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                                            index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{earner.name ?? 'Tidak Ada Nama'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{earner.unit ?? '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-emerald-600">{formatCurrency(earner.penerimaan)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                Belum ada data
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <h3 className="mb-4 font-semibold">Rata-rata Penerimaan per Bulan</h3>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                <YAxis tickFormatter={formatShortCurrency} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        backgroundColor: 'hsl(var(--card))',
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="avg_penerimaan"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorAvg)"
                                    name="Rata-rata Penerimaan"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                            Belum ada data
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
