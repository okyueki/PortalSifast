import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    PieChart,
    Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimeRange = 'daily' | 'weekly' | 'monthly';

type AnalyticsData = {
    ticket_volume: {
        daily: Array<{ date: string; count: number }>;
        weekly: Array<{ week: string; count: number }>;
        monthly: Array<{ month: string; count: number }>;
    };
    by_department: Array<{
        dep_id: number;
        name: string;
        count: number;
        sla_rate: number;
    }>;
    by_user: Array<{
        user_id: number;
        name: string;
        created: number;
        resolved: number;
    }>;
    by_category: Array<{ category_id: number; name: string; count: number; percentage: number }>;
    by_type: Array<{ type_id: number; name: string; count: number; percentage: number }>;
    summary: {
        total_tickets: number;
        vs_previous: number;
        avg_resolution_hours: number;
        sla_compliance: number;
    };
};

function getSlaColor(rate: number): string {
    if (rate >= 0.8) return '#22c55e';
    if (rate >= 0.5) return '#eab308';
    return '#ef4444';
}

type Props = {
    initialData?: AnalyticsData;
};

export default function TabAnalytics({ initialData }: Props) {
    const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
    const [data, setData] = useState<AnalyticsData | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);

    const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff729f', '#00bcd4', '#ff9800', '#9c27b0', '#607d8b'];

    useEffect(() => {
        if (initialData) {
            setData(initialData);
            setLoading(false);
            return;
        }
        fetch('/api/dashboard/analytics')
            .then((res) => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [initialData]);

    if (loading)
        return (
            <div className="p-8 text-center text-muted-foreground">
                Loading analytics...
            </div>
        );

    if (!data)
        return (
            <div className="p-8 text-center text-destructive">
                Failed to load analytics
            </div>
        );

    const volumeData = data.ticket_volume[timeRange];
    const dataKey =
        timeRange === 'daily'
            ? 'date'
            : timeRange === 'weekly'
              ? 'week'
              : 'month';

    const chartData = volumeData.map((item: { [key: string]: string | number }) => ({
        name: item[dataKey],
        tickets: item.count,
    }));

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            timeRange === range
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tiket
                        </CardTitle>
                        {data.summary.vs_previous >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.total_tickets}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.vs_previous >= 0 ? '+' : ''}
                            {(data.summary.vs_previous * 100).toFixed(0)}% vs last
                            month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Resolution
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.avg_resolution_hours}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Average time to resolve
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            SLA Compliance
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(data.summary.sla_compliance * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tickets resolved on time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Departments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.by_department.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active departments
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="tickets"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Department Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.by_department} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                />
                                <Tooltip />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {data.by_department.map(
                                        (entry: { sla_rate: number }, index: number) => (
                                            <Cell
                                                key={index}
                                                fill={getSlaColor(entry.sla_rate)}
                                            />
                                        )
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.by_user}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="created"
                                    name="Created"
                                    fill="#8884d8"
                                />
                                <Bar
                                    dataKey="resolved"
                                    name="Resolved"
                                    fill="#82ca9d"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Breakdown Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Tiket per Kategori */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tiket per Kategori</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.by_category && data.by_category.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.by_category}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                        >
                                            {data.by_category.map((_, index) => (
                                                <Cell
                                                    key={`cat-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number, name: string) => [
                                                `${value} tiket`,
                                                name,
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    Belum ada data kategori
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tiket per Jenis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tiket per Jenis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.by_type && data.by_type.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.by_type}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                        >
                                            {data.by_type.map((_, index) => (
                                                <Cell
                                                    key={`type-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number, name: string) => [
                                                `${value} tiket`,
                                                name,
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    Belum ada data jenis tiket
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}