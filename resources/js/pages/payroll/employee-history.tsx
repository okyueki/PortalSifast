import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Calendar,
    TrendingDown,
    TrendingUp,
    User,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

type SalaryItem = {
    id: number;
    period_start: string;
    period_label: string;
    penerimaan: string | null;
    pajak: string | null;
    zakat: string | null;
};

type ChartDataItem = {
    period: string;
    penerimaan: number;
    pajak: number;
    zakat: number;
};

type Props = {
    nik: string;
    employee: {
        name: string | null;
        unit: string | null;
        npwp: string | null;
        mulai_kerja: string | null;
    };
    salaries: SalaryItem[];
    stats: {
        total_periods: number;
        avg_penerimaan: number;
        max_penerimaan: number;
        min_penerimaan: number;
        total_penerimaan: number;
        total_pajak: number;
        total_zakat: number;
    };
    chartData: ChartDataItem[];
};

export default function EmployeeHistory({ nik, employee, salaries, stats, chartData }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Payroll', href: '/payroll' },
        { title: employee.name ?? nik, href: `/payroll/employee/${encodeURIComponent(nik)}` },
    ];

    const formatCurrency = (value: string | number | null): string => {
        if (value === null || value === '') return '–';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);

        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatShortCurrency = (value: number): string => {
        if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
        return value.toString();
    };

    const latestSalary = salaries[0];
    const previousSalary = salaries[1];
    const trend = latestSalary && previousSalary
        ? Number(latestSalary.penerimaan ?? 0) - Number(previousSalary.penerimaan ?? 0)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Histori Gaji - ${employee.name ?? nik}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/payroll">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title={`Histori Gaji: ${employee.name ?? 'Unknown'}`}
                            description={`NIK: ${nik} • Unit: ${employee.unit ?? '-'}`}
                        />
                    </div>
                    <Badge variant="outline" className="text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {stats.total_periods} periode
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Banknote className="h-4 w-4" />
                            <span className="text-sm">Rata-rata</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-primary">
                            {formatCurrency(stats.avg_penerimaan)}
                        </p>
                        <p className="text-xs text-muted-foreground">per bulan</p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">Tertinggi</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {formatCurrency(stats.max_penerimaan)}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Terendah</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-orange-600">
                            {formatCurrency(stats.min_penerimaan)}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="text-sm">Trend Terakhir</span>
                        </div>
                        <p className={`mt-2 text-2xl font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trend >= 0 ? '+' : ''}{formatCurrency(trend)}
                        </p>
                        <p className="text-xs text-muted-foreground">vs periode sebelumnya</p>
                    </div>
                </div>

                {chartData.length > 1 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-4 font-semibold">Grafik Penerimaan</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPenerimaan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 12 }}
                                    className="fill-muted-foreground"
                                />
                                <YAxis
                                    tickFormatter={formatShortCurrency}
                                    tick={{ fontSize: 12 }}
                                    className="fill-muted-foreground"
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    labelClassName="font-medium"
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        backgroundColor: 'hsl(var(--card))',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="penerimaan"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPenerimaan)"
                                    name="Penerimaan"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h3 className="font-semibold">Riwayat Per Periode</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left font-medium">Periode</th>
                                    <th className="px-4 py-3 text-right font-medium">Penerimaan</th>
                                    <th className="px-4 py-3 text-right font-medium">Pajak</th>
                                    <th className="px-4 py-3 text-right font-medium">Zakat</th>
                                    <th className="px-4 py-3 text-right font-medium">Gaji Bersih</th>
                                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map((salary, idx) => {
                                    const penerimaan = Number(salary.penerimaan ?? 0);
                                    const pajak = Number(salary.pajak ?? 0);
                                    const zakat = Number(salary.zakat ?? 0);
                                    const bersih = penerimaan - pajak - zakat;
                                    const prevSalary = salaries[idx + 1];
                                    const prevPenerimaan = prevSalary ? Number(prevSalary.penerimaan ?? 0) : null;
                                    const change = prevPenerimaan !== null ? penerimaan - prevPenerimaan : null;

                                    return (
                                        <tr key={salary.id} className="border-b last:border-0 hover:bg-muted/40">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{salary.period_label}</span>
                                                    {change !== null && change !== 0 && (
                                                        <Badge
                                                            variant={change > 0 ? 'default' : 'destructive'}
                                                            className="text-xs"
                                                        >
                                                            {change > 0 ? '+' : ''}{formatShortCurrency(change)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(salary.penerimaan)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {formatCurrency(salary.pajak)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {formatCurrency(salary.zakat)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                                {formatCurrency(bersih)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/payroll/${salary.id}`}>Detail</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t bg-muted/30 font-medium">
                                    <td className="px-4 py-3">Total ({stats.total_periods} periode)</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">
                                        {formatCurrency(stats.total_penerimaan)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-orange-600">
                                        {formatCurrency(stats.total_pajak)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sky-600">
                                        {formatCurrency(stats.total_zakat)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-600">
                                        {formatCurrency(stats.total_penerimaan - stats.total_pajak - stats.total_zakat)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
