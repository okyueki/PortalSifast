import { Head, Link } from '@inertiajs/react';
import { BarChart3, AlertCircle, FileText, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Laporan', href: '/reports' },
];

type ReportItem = {
    title: string;
    description: string;
    href: string;
    icon: typeof BarChart3;
    visible: boolean;
};

type Props = {
    canAccessSlaReport: boolean;
    canAccessEmergencyReport: boolean;
    canAccessDepartmentReport: boolean;
};

export default function ReportsIndex({ canAccessSlaReport, canAccessEmergencyReport, canAccessDepartmentReport }: Props) {
    const reports: ReportItem[] = [
        {
            title: 'Laporan SLA Tiket',
            description: 'Pencapaian target respons dan resolusi tiket per periode, departemen, dan prioritas.',
            href: '/reports/sla',
            icon: BarChart3,
            visible: canAccessSlaReport,
        },
        {
            title: 'Laporan per Departemen',
            description: 'Tiket ditangani per departemen: jumlah, lama penyelesaian, kategori, tag, dan breakdown per petugas.',
            href: '/reports/department',
            icon: Building2,
            visible: canAccessDepartmentReport,
        },
        {
            title: 'Laporan Darurat',
            description: 'Daftar laporan darurat (panic button) dan respons operator.',
            href: '/emergency-reports',
            icon: AlertCircle,
            visible: canAccessEmergencyReport,
        },
    ].filter((r) => r.visible);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Laporan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pilih jenis laporan di bawah. Laporan SLA untuk admin/staff; laporan darurat untuk riwayat insiden darurat.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => {
                        const Icon = report.icon;
                        return (
                            <Link key={report.href} href={report.href}>
                                <Card className="h-full transition-colors hover:bg-muted/50">
                                    <CardHeader className="flex flex-row items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-base">{report.title}</CardTitle>
                                            <CardDescription className="mt-1 text-sm">
                                                {report.description}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="text-sm font-medium text-primary hover:underline">
                                            Buka laporan →
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {reports.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="size-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                Tidak ada laporan yang dapat Anda akses.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
