import { useState, useEffect } from 'react';
import { AlertTriangle, Tag, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';

type TextAnalyticsData = {
    by_category: Array<{ name: string; count: number; percentage: number }>;
    top_keywords: Array<{ word: string; count: number }>;
    urgent_tickets: Array<{
        id: number;
        ticket_number: string;
        title: string;
        detected_keywords: string[];
    }>;
};

type Props = {};

export default function TabAnalisa({}: Props) {
    const [timeRange, setTimeRange] = useState(30);
    const [data, setData] = useState<TextAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/dashboard/text-analytics?days=${timeRange}`)
            .then((res) => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [timeRange]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-destructive">Failed to load</div>;
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
                {[7, 30, 90, 180, 365].map((days) => (
                    <button
                        key={days}
                        onClick={() => setTimeRange(days)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            timeRange === days
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {days === 365 ? '1 Year' : `${days} Days`}
                    </button>
                ))}
            </div>

            {/* Category + Keywords Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Auto Kategori */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <CardTitle>Kategori Otomatis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.by_category.length > 0 ? (
                            <div className="space-y-2">
                                {data.by_category.map((cat) => (
                                    <div key={cat.name} className="flex items-center justify-between">
                                        <span className="font-medium">{cat.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${cat.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-muted-foreground w-20 text-right">
                                                {cat.count} ({cat.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                Tidak ada data kategori
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Keyword Frequency */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle>Top Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.top_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.top_keywords.map((kw) => (
                                    <Badge
                                        key={kw.word}
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        {kw.word} ({kw.count})
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                Tidak ada keyword
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Urgent Tickets */}
            <Card className="border-destructive/50">
                <CardHeader className="flex flex-row items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Tiket Urgent Terdeteksi</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.urgent_tickets.length > 0 ? (
                        <div className="space-y-3">
                            {data.urgent_tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                                >
                                    <div>
                                        <Link
                                            href={`/tickets/${ticket.id}`}
                                            className="font-mono text-sm font-medium hover:underline"
                                        >
                                            {ticket.ticket_number}
                                        </Link>
                                        <p className="mt-1 text-sm">{ticket.title}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {ticket.detected_keywords.map((kw) => (
                                            <Badge
                                                key={kw}
                                                variant="destructive"
                                                className="text-xs"
                                            >
                                                {kw}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">
                            Tidak ada tiket urgent terdeteksi
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}