import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Edit, FolderTree, Hash, Info, User } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'SIMMUTU', href: '/simmutu' },
    { title: 'Rekap Mutu', href: '/simmutu/realisations' },
    { title: 'Detail', href: '#' },
];

type Props = {
    realisation: {
        id: number;
        mutu_indicator_id: number;
        indicator_title: string | null;
        category_name: string | null;
        description: string | null;
        numerator_definition: string | null;
        denominator_definition: string | null;
        collection_frequency: string | null;
        collection_frequency_label: string | null;
        dep_id: string;
        period_anchor: string;
        numerator_value: number | null;
        denominator_value: number | null;
        achievement_percent: number | null;
        notes: string | null;
        input_by: number | null;
        input_by_name: string | null;
        created_at: string | null;
        updated_at: string | null;
        can_edit: boolean;
    };
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

function ymdToDate(ymd: string): Date {
    return new Date(`${ymd}T00:00:00`);
}

function formatPeriodAnchor(anchor: string): string {
    if (anchor.startsWith('D:')) {
        return dateFormatter.format(ymdToDate(anchor.replace('D:', '')));
    }
    if (anchor.startsWith('W:')) {
        return `Minggu ${anchor.replace('W:', '')}`;
    }
    if (anchor.startsWith('M:')) {
        const [year, month] = anchor.replace('M:', '').split('-');
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
            new Date(`${year}-${month}-01`),
        );
    }
    if (anchor.startsWith('Y:')) {
        return `Tahun ${anchor.replace('Y:', '')}`;
    }
    return anchor;
}

function formatNumber(value: number | null): string {
    if (value === null) return '–';
    return value.toFixed(4).replace(/\.?0+$/, '');
}

export default function MutuRealisationsShow({ realisation }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Realisasi — ${realisation.indicator_title ?? 'ID ' + realisation.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Detail Realisasi Mutu"
                        description="Informasi lengkap capaian indikator mutu."
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/simmutu/realisations">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                        {realisation.can_edit && (
                            <Button size="sm" asChild>
                                <Link href={`/simmutu/realisations/${realisation.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hash className="h-5 w-5 text-primary" />
                                    {realisation.indicator_title ?? '–'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <FolderTree className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Kategori</p>
                                            <p className="font-medium">{realisation.category_name ?? '–'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Periode</p>
                                            <p className="font-medium">{formatPeriodAnchor(realisation.period_anchor)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Profil</p>
                                            <Badge variant="outline">{realisation.collection_frequency_label ?? '–'}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Departemen</p>
                                            <p className="font-medium">{realisation.dep_id}</p>
                                        </div>
                                    </div>
                                </div>

                                {realisation.description && (
                                    <div className="rounded-md border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">Deskripsi Indikator</p>
                                        <p className="text-sm mt-1">{realisation.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Hasil Capaian</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div className="text-center p-4 rounded-lg border bg-muted/20">
                                        <p className="text-xs text-muted-foreground mb-1">Numerator</p>
                                        <p className="text-2xl font-bold">{formatNumber(realisation.numerator_value)}</p>
                                        {realisation.numerator_definition && (
                                            <p className="text-xs text-muted-foreground mt-1">{realisation.numerator_definition}</p>
                                        )}
                                    </div>
                                    <div className="text-center p-4 rounded-lg border bg-muted/20">
                                        <p className="text-xs text-muted-foreground mb-1">Denominator</p>
                                        <p className="text-2xl font-bold">{formatNumber(realisation.denominator_value)}</p>
                                        {realisation.denominator_definition && (
                                            <p className="text-xs text-muted-foreground mt-1">{realisation.denominator_definition}</p>
                                        )}
                                    </div>
                                    <div className="text-center p-4 rounded-lg border bg-primary/10">
                                        <p className="text-xs text-muted-foreground mb-1">Capaian</p>
                                        <p className="text-3xl font-bold text-primary">
                                            {realisation.achievement_percent !== null
                                                ? `${formatNumber(realisation.achievement_percent)}%`
                                                : '–'}
                                        </p>
                                    </div>
                                </div>

                                {realisation.notes && (
                                    <div className="mt-4 rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Catatan</p>
                                        <p className="text-sm mt-1">{realisation.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Informasi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">ID Record</p>
                                    <p className="font-mono">#{realisation.id}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Kode Periode</p>
                                    <p className="font-mono">{realisation.period_anchor}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Input oleh</p>
                                    <p>{realisation.input_by_name ?? '–'}</p>
                                </div>
                                {realisation.created_at && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Dibuat</p>
                                        <p>{dateTimeFormatter.format(new Date(realisation.created_at))}</p>
                                    </div>
                                )}
                                {realisation.updated_at && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Diperbarui</p>
                                        <p>{dateTimeFormatter.format(new Date(realisation.updated_at))}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {realisation.can_edit && (
                            <Button className="w-full" asChild>
                                <Link href={`/simmutu/realisations/${realisation.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Realisasi
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}