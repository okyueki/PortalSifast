import { Head, Link } from '@inertiajs/react';
import { ListFilter, Settings } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
    { title: 'Status Tiket', href: '/tickets/statuses' },
];

const colorDotMap: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    gray: 'bg-slate-500',
};

function getStatusColor(color: string): string {
    const colorMap: Record<string, string> = {
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        purple: 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/25 dark:text-purple-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return colorMap[color] || colorMap.gray;
}

type StatusRow = {
    id: number;
    name: string;
    slug: string;
    color: string;
    order: number;
    is_closed: boolean;
    is_active: boolean;
    tickets_count: number;
};

type Props = {
    statuses: StatusRow[];
};

export default function TicketStatusesIndex({ statuses }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Tiket" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Status Tiket"
                        description="Daftar status tiket yang terintegrasi dengan sistem. Klik jumlah tiket untuk melihat daftar tiket per status."
                    />
                    <Button variant="outline" asChild>
                        <Link href="/settings/tickets">
                            <Settings className="mr-2 h-4 w-4" />
                            Kelola di Master Tiket
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListFilter className="h-4 w-4" />
                            Daftar Status
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Urutan dan warna mengikuti master; jumlah tiket diperbarui otomatis.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-10">Urut</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Warna</TableHead>
                                        <TableHead>Ket.</TableHead>
                                        <TableHead className="text-right">Jumlah Tiket</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statuses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                Belum ada status. Tambah di Master Tiket.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        statuses.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-mono text-muted-foreground">
                                                    {s.order}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={getStatusColor(s.color)}
                                                    >
                                                        {s.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-muted-foreground">
                                                    {s.slug}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-block h-4 w-4 rounded-full border border-border ${colorDotMap[s.color] ?? 'bg-slate-500'}`}
                                                        title={s.color}
                                                    />
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {s.color}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.is_closed && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Ditutup
                                                            </Badge>
                                                        )}
                                                        {!s.is_active && (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={`/tickets?status=${s.id}`}
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {s.tickets_count} tiket
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
