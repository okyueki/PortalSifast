import { Head } from '@inertiajs/react';
import { BarChart3, Users } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan', href: '/reports' },
    { title: 'Laporan Pemohon per Unit', href: '/reports/requesters' },
];

type DepartmentRow = {
    departemen: string;
    total_tickets: number;
    total_requesters: number;
};

type TopRequesterRow = {
    requester_id: number;
    requester_name: string;
    departemen: string | null;
    total_tickets: number;
};

type GlobalTopItem = {
    name: string;
    departemen: string;
    total_tickets: number;
};

type Props = {
    departments: DepartmentRow[];
    topRequesters: TopRequesterRow[];
    globalTop: GlobalTopItem[];
    filters: { from: string; to: string; dep_id: string | null };
    departmentsForFilter: string[];
};

export default function RequesterReport({
    departments,
    topRequesters,
    globalTop,
    filters,
    departmentsForFilter,
}: Props) {
    const { data, setData, get } = useForm({
        from: filters.from,
        to: filters.to,
        dep_id: filters.dep_id ?? '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('from', data.from);
        params.set('to', data.to);
        if (data.dep_id) {
            params.set('dep_id', data.dep_id);
        }
        get(`/reports/requesters?${params.toString()}`);
    };

    const totalTickets = departments.reduce((s, d) => s + d.total_tickets, 0);
    const totalRequesters = departments.reduce((s, d) => s + d.total_requesters, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pemohon per Unit" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan Pemohon per Unit
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Siapa yang paling sering membuat tiket dan dari unit/departemen mana, berdasarkan data pegawai SIMRS (kolom departemen).
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filter</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode berdasarkan tanggal dibuatnya tiket (created_at). Departemen diambil dari tabel pegawai.departemen.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="from">Dari bulan</Label>
                                <Input
                                    id="from"
                                    type="month"
                                    value={data.from}
                                    onChange={(e) => setData('from', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="to">Sampai bulan</Label>
                                <Input
                                    id="to"
                                    type="month"
                                    value={data.to}
                                    onChange={(e) => setData('to', e.target.value)}
                                />
                            </div>
                            {departmentsForFilter.length > 0 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="dep_id">Departemen pemohon</Label>
                                    <Input
                                        id="dep_id"
                                        list="dep-list"
                                        placeholder="Semua departemen"
                                        value={data.dep_id}
                                        onChange={(e) => setData('dep_id', e.target.value)}
                                        className="w-56"
                                    />
                                    <datalist id="dep-list">
                                        {departmentsForFilter.map((d) => (
                                            <option key={d} value={d} />
                                        ))}
                                    </datalist>
                                </div>
                            )}
                            <Button type="submit">Terapkan</Button>
                        </form>
                    </CardContent>
                </Card>

                {departments.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" />
                                Ringkasan per Unit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total tiket (periode ini)
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">{totalTickets}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Jumlah pemohon unik
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">{totalRequesters}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Unit terbanyak
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">
                                        {departments[0]
                                            ? `${departments[0].departemen} (${departments[0].total_tickets} tiket)`
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="px-3 py-2 text-left font-medium">
                                                Departemen (pegawai.departemen)
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Tiket
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Pemohon unik
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {departments.map((d) => (
                                            <tr key={d.departemen} className="border-b border-border/40">
                                                <td className="px-3 py-2">
                                                    {d.departemen || '(Tanpa departemen)'}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {d.total_tickets}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {d.total_requesters}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {globalTop.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5" />
                                Top 10 Pemohon (Global)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="px-3 py-2 text-left font-medium">
                                                Nama pemohon
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Departemen
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Tiket
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {globalTop.map((r) => (
                                            <tr key={`${r.name}-${r.departemen}`} className="border-b border-border/40">
                                                <td className="px-3 py-2">{r.name}</td>
                                                <td className="px-3 py-2">
                                                    {r.departemen || '(Tanpa departemen)'}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {r.total_tickets}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {departments.length === 0 && globalTop.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            Tidak ada data tiket pada periode ini.
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

