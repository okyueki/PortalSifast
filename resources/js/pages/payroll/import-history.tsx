import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle,
    Clock,
    FileSpreadsheet,
    RotateCcw,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
    { title: 'Riwayat Import', href: '/payroll/import-history' },
];

type ImportItem = {
    id: number;
    period_start: string;
    period_label: string;
    filename: string | null;
    total_rows: number;
    imported_count: number;
    skipped_count: number;
    warning_count: number;
    status: 'completed' | 'rolled_back';
    approval_status: 'pending' | 'approved' | 'rejected';
    approver_name: string | null;
    approved_at: string | null;
    approval_notes: string | null;
    importer_name: string | null;
    created_at: string;
    rolled_back_at: string | null;
};

type PaginatedImports = {
    data: ImportItem[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    imports: PaginatedImports;
    pendingCount: number;
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function ImportHistory() {
    const { imports, pendingCount, flash } = usePage<PageProps>().props;
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; importId: number | null }>({
        open: false,
        importId: null,
    });
    const [rejectNotes, setRejectNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRollback = (importItem: ImportItem) => {
        if (importItem.status === 'rolled_back') return;

        if (
            !confirm(
                `Yakin ingin rollback import "${importItem.filename ?? importItem.period_label}"?\n\nSemua data gaji dari import ini akan dihapus.`
            )
        ) {
            return;
        }

        router.post(`/payroll/import/${importItem.id}/rollback`);
    };

    const handleApprove = (importItem: ImportItem) => {
        if (!confirm(`Setujui import payroll "${importItem.period_label}"?`)) return;

        setIsProcessing(true);
        router.post(
            `/payroll/import/${importItem.id}/approve`,
            { notes: '' },
            {
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    const handleReject = () => {
        if (!rejectDialog.importId) return;
        if (!rejectNotes.trim()) {
            alert('Alasan penolakan wajib diisi.');
            return;
        }

        setIsProcessing(true);
        router.post(
            `/payroll/import/${rejectDialog.importId}/reject`,
            { notes: rejectNotes },
            {
                onFinish: () => {
                    setIsProcessing(false);
                    setRejectDialog({ open: false, importId: null });
                    setRejectNotes('');
                },
            }
        );
    };

    const getApprovalBadge = (item: ImportItem) => {
        if (item.status === 'rolled_back') return null;

        switch (item.approval_status) {
            case 'pending':
                return (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <Clock className="mr-1 h-3 w-3" />
                        Menunggu Approval
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300">
                        <Check className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Import Payroll" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/payroll">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title="Riwayat Import Payroll"
                            description="Lihat semua aktivitas import gaji dengan opsi approval dan rollback."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {pendingCount > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                <Clock className="mr-1 h-3 w-3" />
                                {pendingCount} menunggu approval
                            </Badge>
                        )}
                        <Button asChild>
                            <Link href="/payroll/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Import Baru
                            </Link>
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 dark:text-emerald-200">Berhasil</AlertTitle>
                        <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left font-medium">Waktu</th>
                                    <th className="px-4 py-3 text-left font-medium">Periode</th>
                                    <th className="px-4 py-3 text-left font-medium">File</th>
                                    <th className="px-4 py-3 text-left font-medium">Oleh</th>
                                    <th className="px-4 py-3 text-right font-medium">Imported</th>
                                    <th className="px-4 py-3 text-center font-medium">Status</th>
                                    <th className="px-4 py-3 text-center font-medium">Approval</th>
                                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {imports.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            <FileSpreadsheet className="mx-auto h-12 w-12 opacity-30" />
                                            <p className="mt-2">Belum ada riwayat import.</p>
                                            <Button asChild className="mt-4">
                                                <Link href="/payroll/import">Mulai Import</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    imports.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`border-b last:border-0 hover:bg-muted/40 ${
                                                item.status === 'rolled_back' ? 'opacity-60' : ''
                                            } ${item.approval_status === 'pending' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {item.created_at}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{item.period_label}</td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                {item.filename ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">{item.importer_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-medium text-emerald-600">{item.imported_count}</span>
                                                {item.warning_count > 0 && (
                                                    <span className="ml-1 text-amber-600">({item.warning_count}⚠)</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.status === 'completed' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Completed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Rolled Back
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getApprovalBadge(item)}
                                                {item.approval_notes && (
                                                    <p className="mt-1 text-xs text-muted-foreground truncate max-w-[150px]" title={item.approval_notes}>
                                                        {item.approval_notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {item.status === 'completed' && item.approval_status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-emerald-600 hover:text-emerald-700"
                                                                onClick={() => handleApprove(item)}
                                                                disabled={isProcessing}
                                                            >
                                                                <Check className="mr-1 h-3 w-3" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => setRejectDialog({ open: true, importId: item.id })}
                                                                disabled={isProcessing}
                                                            >
                                                                <X className="mr-1 h-3 w-3" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {item.status === 'completed' && item.approval_status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleRollback(item)}
                                                        >
                                                            <RotateCcw className="mr-1 h-3 w-3" />
                                                            Rollback
                                                        </Button>
                                                    )}
                                                    {item.status === 'rolled_back' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.rolled_back_at}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {imports.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {imports.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button size="sm" variant={link.active ? 'default' : 'outline'} asChild>
                                            <Link href={link.url} preserveScroll preserveState>
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            className="inline-flex size-8 items-center justify-center text-muted-foreground"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border bg-amber-50/50 p-4 dark:bg-amber-950/20">
                    <h3 className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        Catatan Approval Workflow
                    </h3>
                    <ul className="mt-2 list-inside list-disc text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>Setiap import baru berstatus "Menunggu Approval"</li>
                        <li>Hanya admin yang dapat approve atau reject</li>
                        <li>Payroll yang di-reject tidak akan bisa digunakan untuk pengiriman email</li>
                        <li>Rollback hanya bisa dilakukan setelah approval</li>
                    </ul>
                </div>
            </div>

            <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, importId: open ? rejectDialog.importId : null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Import Payroll</DialogTitle>
                        <DialogDescription>
                            Masukkan alasan penolakan. Ini akan dicatat dan ditampilkan di riwayat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Alasan penolakan..."
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, importId: null })}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectNotes.trim()}>
                            {isProcessing ? 'Memproses...' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
