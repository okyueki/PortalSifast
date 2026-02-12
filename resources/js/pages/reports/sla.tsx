import { Head, Link, router, useForm } from '@inertiajs/react';
import {
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
import { BarChart3, CheckCircle, TrendingUp } from 'lucide-react';
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
    { title: 'Laporan SLA', href: '/reports/sla' },
];

type SlaMetrics = {
    total: number;
    met: number;
    breached: number;
    pending: number;
    percentage: number;
};

type MonthlyPoint = {
    month: string;
    month_label: string;
    response_met: number;
    response_breached: number;
    response_total: number;
    resolution_met: number;
    resolution_breached: number;
    resolution_total: number;
};

type DepMetrics = {
    response_met: number;
    response_breached: number;
    resolution_met: number;
    resolution_breached: number;
};

type Props = {
    responseSla: SlaMetrics;
    resolutionSla: SlaMetrics;
    monthlyTrend: MonthlyPoint[];
    byDepartment: Record<string, DepMetrics>;
    byPriority: Record<string, DepMetrics>;
    filters: { from: string; to: string; dep_id: string | null };
    departments: string[];
};

const COLORS = {
    met: '#22C55E',
    breached: '#DC2626',
    pending: '#94A3B8',
};

export default function SlaReport({
    responseSla,
    resolutionSla,
    monthlyTrend,
    byDepartment,
    byPriority,
    filters,
    departments,
}: Props) {
    const { data, setData } = useForm({
        from: filters.from,
        to: filters.to,
        dep_id: filters.dep_id || '__all__',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('from', data.from);
        params.set('to', data.to);
        if (data.dep_id && data.dep_id !== '__all__') {
            params.set('dep_id', data.dep_id);
        }
        router.get(`/reports/sla?${params.toString()}`);
    };

    const responsePieData = [
        { name: 'Tepat', value: responseSla.met, color: COLORS.met },
        { name: 'Terlambat', value: responseSla.breached, color: COLORS.breached },
    ].filter((d) => d.value > 0);

    const resolutionPieData = [
        { name: 'Tepat', value: resolutionSla.met, color: COLORS.met },
        { name: 'Terlambat', value: resolutionSla.breached, color: COLORS.breached },
    ].filter((d) => d.value > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan SLA" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan Kepatuhan SLA
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Response time &amp; resolution time per target SLA
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/tickets">Lihat Tiket</Link>
                    </Button>
                </div>

                {/* Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filter Periode</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleFilter}
                            className="flex flex-wrap items-end gap-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="from">Dari bulan</Label>
                                <Input
                                    id="from"
                                    type="month"
                                    value={data.from}
                                    onChange={(e) =>
                                        setData('from', e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="to">Sampai bulan</Label>
                                <Input
                                    id="to"
                                    type="month"
                                    value={data.to}
                                    onChange={(e) =>
                                        setData('to', e.target.value)
                                    }
                                />
                            </div>
                            {departments.length > 1 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="dep_id">Departemen</Label>
                                    <Select
                                        value={data.dep_id}
                                        onValueChange={(v) =>
                                            setData('dep_id', v)
                                        }
                                    >
                                        <SelectTrigger id="dep_id" className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">
                                                Semua
                                            </SelectItem>
                                            {departments.map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button type="submit">Terapkan</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Response SLA
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {responseSla.percentage}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {responseSla.met} tepat / {responseSla.breached}{' '}
                                terlambat
                                {responseSla.pending > 0 &&
                                    ` · ${responseSla.pending} menunggu`}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resolution SLA
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {resolutionSla.percentage}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {resolutionSla.met} tepat / {resolutionSla.breached}{' '}
                                terlambat
                                {resolutionSla.pending > 0 &&
                                    ` · ${resolutionSla.pending} menunggu`}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Tiket (Response)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {responseSla.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dengan target response
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Tiket (Resolution)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {resolutionSla.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dengan target resolution
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pie charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-5 w-5" />
                                Response SLA — Tepat vs Terlambat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {responsePieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={responsePieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, value }) =>
                                                `${name}: ${value}`
                                            }
                                        >
                                            {responsePieData.map((entry, i) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-64 items-center justify-center text-muted-foreground">
                                    Tidak ada data
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-5 w-5" />
                                Resolution SLA — Tepat vs Terlambat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resolutionPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={resolutionPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, value }) =>
                                                `${name}: ${value}`
                                            }
                                        >
                                            {resolutionPieData.map(
                                                (entry, i) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={entry.color}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-64 items-center justify-center text-muted-foreground">
                                    Tidak ada data
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly trend */}
                {monthlyTrend.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="h-5 w-5" />
                                Tren Bulanan
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Response &amp; resolution kepatuhan per bulan
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={monthlyTrend}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-muted"
                                    />
                                    <XAxis
                                        dataKey="month_label"
                                        tick={{ fontSize: 12 }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="response_met"
                                        name="Response tepat"
                                        fill={COLORS.met}
                                        stackId="response"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="response_breached"
                                        name="Response terlambat"
                                        fill={COLORS.breached}
                                        stackId="response"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="resolution_met"
                                        name="Resolution tepat"
                                        fill={COLORS.met}
                                        stackId="resolution"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="resolution_breached"
                                        name="Resolution terlambat"
                                        fill={COLORS.breached}
                                        stackId="resolution"
                                        radius={[0, 0, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="mt-2 text-xs text-muted-foreground">
                                * Bar response &amp; resolution di-stack per
                                bulan
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Tables: by department & priority */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {Object.keys(byDepartment).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Per Departemen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-3 py-2 text-left font-medium">
                                                    Dep
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    R-Met
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    R-Breach
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Res-Met
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Res-Breach
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(byDepartment).map(
                                                ([dep, m]) => (
                                                    <tr
                                                        key={dep}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-3 py-2 font-medium">
                                                            {dep}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                                            {m.response_met}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                                            {m.response_breached}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                                            {m.resolution_met}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                                            {m.resolution_breached}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    R = Response, Res = Resolution
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {Object.keys(byPriority).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Per Prioritas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-3 py-2 text-left font-medium">
                                                    Prioritas
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    R-Met
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    R-Breach
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Res-Met
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Res-Breach
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(byPriority).map(
                                                ([name, m]) => (
                                                    <tr
                                                        key={name}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-3 py-2 font-medium">
                                                            {name}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                                            {m.response_met}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                                            {m.response_breached}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                                            {m.resolution_met}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                                            {m.resolution_breached}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    R = Response, Res = Resolution
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
