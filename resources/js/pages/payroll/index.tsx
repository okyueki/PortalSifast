import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownIcon,
    ArrowUpDownIcon,
    ArrowUpIcon,
    BarChart3,
    CalendarIcon,
    CheckSquare,
    ClipboardList,
    Download,
    FileSpreadsheet,
    FileText,
    History,
    Loader2,
    Mail,
    Pencil,
    Plus,
    Printer,
    RotateCcw,
    Send,
    Square,
    Trash2,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payroll', href: '/payroll' },
];

type SalaryItem = {
    id: number;
    period_start: string;
    simrs_nik: string;
    employee_name: string | null;
    unit: string | null;
    penerimaan: string | null;
    pajak: string | null;
    zakat: string | null;
};

type PaginatedSalaries = {
    data: SalaryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Comparison = {
    prev_period: string;
    prev_penerimaan: number;
    prev_pajak: number;
    prev_zakat: number;
    prev_employees: number;
    diff_penerimaan: number;
    diff_percent: number;
} | null;

type Props = {
    salaries: PaginatedSalaries;
    filters: {
        period: string;
        q?: string;
        unit?: string;
        sort?: string;
        dir?: 'asc' | 'desc';
        per_page?: number;
    };
    summary: {
        total_penerimaan: number;
        total_pajak: number;
        total_zakat: number;
        total_employees?: number;
    };
    comparison?: Comparison;
};

type SortColumn = 'period_start' | 'simrs_nik' | 'employee_name' | 'unit' | 'penerimaan' | 'pajak' | 'zakat';

export default function PayrollIndex({ salaries, filters, summary, comparison }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [unit, setUnit] = useState(filters.unit ?? '');
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const allIds = salaries.data.map((r) => r.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
    const someSelected = selectedIds.size > 0;

    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        startTransition(() => {
            router.get(
                '/payroll',
                {
                    period: filters.period ?? '',
                    q: search,
                    unit,
                    sort: filters.sort ?? '',
                    dir: filters.dir ?? 'desc',
                    per_page: filters.per_page ?? 25,
                    ...overrides,
                },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        });
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        applyFilters({ period: e.target.value });
    };

    const handleSort = (column: SortColumn) => {
        const newDir = filters.sort === column && filters.dir === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort: column, dir: newDir });
    };

    const handlePerPageChange = (value: string) => {
        applyFilters({ per_page: Number(value) });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        setUnit('');
        startTransition(() => {
            router.get('/payroll', {}, { preserveState: true, preserveScroll: true, replace: true });
        });
    }, []);

    const hasFilters = filters.period || filters.q || filters.unit;

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Yakin ingin menghapus ${selectedIds.size} data gaji yang dipilih?`)) return;

        setIsDeleting(true);
        router.post(
            '/payroll/bulk-delete',
            { ids: Array.from(selectedIds) },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setSelectedIds(new Set());
                },
            }
        );
    };

    const handleBulkEmail = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Kirim slip gaji ke ${selectedIds.size} pegawai yang dipilih? Email akan dikirim ke alamat yang terdaftar di akun mereka.`)) return;

        setIsSendingEmail(true);
        setEmailStatus(null);

        try {
            const response = await fetch('/payroll/bulk-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ salary_ids: Array.from(selectedIds) }),
            });

            const data = await response.json();

            if (data.success) {
                setEmailStatus({ type: 'success', message: data.message });
                setSelectedIds(new Set());
            } else {
                setEmailStatus({ type: 'error', message: data.error ?? 'Gagal mengirim email' });
            }
        } catch {
            setEmailStatus({ type: 'error', message: 'Terjadi kesalahan saat mengirim email' });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSendEmail = async (salaryId: number, email: string) => {
        try {
            const response = await fetch(`/payroll/${salaryId}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setEmailStatus({ type: 'success', message: data.message });
            } else {
                setEmailStatus({ type: 'error', message: data.error ?? 'Gagal mengirim email' });
            }
        } catch {
            setEmailStatus({ type: 'error', message: 'Terjadi kesalahan saat mengirim email' });
        }
    };

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.q ?? '') || unit !== (filters.unit ?? '')) {
                applyFilters({ q: search, unit });
            }
        }, 350);

        return () => clearTimeout(t);
    }, [search, unit]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setSelectedIds(new Set());
    }, [salaries.current_page]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                    clearFilters();
                }
                return;
            }

            if (e.key === '/' || (e.ctrlKey && e.key === 'f')) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape') {
                clearFilters();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [clearFilters]);

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

    const formatPeriod = (dateString: string | null): string => {
        if (!dateString) return '-';
        const match = dateString.match(/^(\d{4})-(\d{2})/);
        if (match) {
            const [, year, month] = match;
            const d = new Date(parseInt(year), parseInt(month) - 1, 1);
            return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        }
        return dateString;
    };

    const isAnomaly = (row: SalaryItem): boolean => {
        const penerimaan = Number(row.penerimaan ?? 0);
        return penerimaan === 0 || !row.employee_name;
    };

    const exportCsv = () => {
        const params = new URLSearchParams();
        if (filters.period) params.set('period', filters.period);
        if (filters.q) params.set('q', filters.q);
        if (filters.unit) params.set('unit', filters.unit);
        if (filters.sort) params.set('sort', filters.sort);
        if (filters.dir) params.set('dir', filters.dir);
        params.set('export', 'csv');

        window.open(`/payroll?${params.toString()}`, '_blank');
    };

    const downloadPdf = (id: number) => {
        const printWindow = window.open(`/payroll/${id}/print`, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
        }
    };

    const SortHeader = ({ column, label, align = 'left' }: { column: SortColumn; label: string; align?: 'left' | 'right' }) => {
        const isActive = filters.sort === column;
        return (
            <th
                className={`px-4 py-3 font-medium cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${align === 'right' ? 'text-right' : ''}`}
                onClick={() => handleSort(column)}
            >
                <span className="inline-flex items-center gap-1">
                    {label}
                    {isActive ? (
                        filters.dir === 'asc' ? (
                            <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                        )
                    ) : (
                        <ArrowUpDownIcon className="h-3 w-3 opacity-30" />
                    )}
                </span>
            </th>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll - Gaji Karyawan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Heading
                        title="Payroll - Gaji Karyawan"
                        description="Data gaji hasil impor dari file CSV per periode."
                    />
                    <div className="flex items-center gap-2">
                        {someSelected && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleBulkEmail}
                                    disabled={isSendingEmail}
                                >
                                    {isSendingEmail ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    Email {selectedIds.size} dipilih
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Hapus {selectedIds.size} dipilih
                                </Button>
                            </>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/payroll/dashboard">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Analytics
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/payroll/audit-logs">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Audit Log
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={exportCsv} title="Export CSV">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button asChild>
                            <Link href="/payroll/import">
                                <Plus className="mr-2 h-4 w-4" />
                                Impor Gaji
                            </Link>
                        </Button>
                    </div>
                </div>

                {emailStatus && (
                    <Alert
                        className={emailStatus.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                        }
                    >
                        {emailStatus.type === 'success' ? (
                            <Send className="h-4 w-4 text-emerald-600" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription className={emailStatus.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                            {emailStatus.message}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Periode</span>
                    </div>
                    <Input
                        type="month"
                        className="w-auto min-w-[160px]"
                        value={filters.period ?? ''}
                        onChange={handlePeriodChange}
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Cari nama / NIK / NPWP..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="min-w-[220px]"
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Tekan <kbd className="rounded bg-muted px-1">/</kbd> untuk fokus</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Input
                        placeholder="Filter unit..."
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="min-w-[180px]"
                    />

                    {hasFilters && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={clearFilters} title="Reset filter">
                                        <RotateCcw className="mr-1 h-3 w-3" />
                                        Reset
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Tekan <kbd className="rounded bg-muted px-1">Esc</kbd> untuk reset</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <div className="ml-auto flex items-center gap-3">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Badge variant="outline" className="flex items-center gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            <span className="text-xs">{salaries.total.toLocaleString('id-ID')} baris</span>
                        </Badge>
                    </div>
                </div>

                {comparison && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Jumlah Pegawai</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold">{summary.total_employees ?? 0}</p>
                            <p className="text-xs text-muted-foreground">
                                vs {comparison.prev_employees} ({comparison.prev_period})
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                {comparison.diff_penerimaan >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm">Total Penerimaan</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-emerald-600">
                                {formatCurrency(summary.total_penerimaan)}
                            </p>
                            <p className={`text-xs ${comparison.diff_penerimaan >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {comparison.diff_penerimaan >= 0 ? '+' : ''}
                                {formatCurrency(comparison.diff_penerimaan)} ({comparison.diff_percent}%)
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm">Total Pajak</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.total_pajak)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                vs {formatCurrency(comparison.prev_pajak)}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm">Total Zakat</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-sky-600">
                                {formatCurrency(summary.total_zakat)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                vs {formatCurrency(comparison.prev_zakat)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-violet-500/10 dark:from-emerald-500/20 dark:via-sky-500/20 dark:to-violet-500/20">
                                    <th className="w-10 px-4 py-3">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Pilih semua"
                                        />
                                    </th>
                                    <SortHeader column="period_start" label="Periode" />
                                    <SortHeader column="simrs_nik" label="NIK" />
                                    <SortHeader column="employee_name" label="Nama" />
                                    <SortHeader column="unit" label="Unit" />
                                    <SortHeader column="penerimaan" label="Penerimaan" align="right" />
                                    <SortHeader column="pajak" label="Pajak" align="right" />
                                    <SortHeader column="zakat" label="Zakat" align="right" />
                                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-0">
                                            <EmptyState
                                                title="Belum ada data gaji"
                                                description={
                                                    hasFilters
                                                        ? 'Tidak ada data untuk filter yang dipilih. Coba reset filter atau impor data baru.'
                                                        : 'Silakan impor data gaji dari CSV terlebih dahulu.'
                                                }
                                                action={
                                                    hasFilters ? (
                                                        <Button onClick={clearFilters}>Reset Filter</Button>
                                                    ) : (
                                                        <Button asChild>
                                                            <Link href="/payroll/import">Impor Gaji</Link>
                                                        </Button>
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    salaries.data.map((row) => {
                                        const anomaly = isAnomaly(row);
                                        return (
                                            <tr
                                                key={row.id}
                                                className={`border-b last:border-0 hover:bg-muted/40 ${
                                                    anomaly ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                                                } ${selectedIds.has(row.id) ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <Checkbox
                                                        checked={selectedIds.has(row.id)}
                                                        onCheckedChange={() => toggleSelect(row.id)}
                                                        aria-label={`Pilih ${row.employee_name}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatPeriod(row.period_start)}</td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    <Link href={`/payroll/${row.id}`} className="hover:underline">
                                                        {row.simrs_nik}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/payroll/${row.id}`} className="hover:underline">
                                                            {row.employee_name ?? '–'}
                                                        </Link>
                                                        {anomaly && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            {!row.employee_name
                                                                                ? 'Nama kosong'
                                                                                : 'Penerimaan = 0'}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.unit ?? '–'}</td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {formatCurrency(row.penerimaan)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    {formatCurrency(row.pajak)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    {formatCurrency(row.zakat)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                                            <Link
                                                                href={`/payroll/employee/${encodeURIComponent(row.simrs_nik)}`}
                                                                title="Histori Gaji"
                                                            >
                                                                <History className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                                            <Link href={`/payroll/${row.id}`} title="Edit">
                                                                <Pencil className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                                            <Link
                                                                href={`/payroll/${row.id}/print`}
                                                                title="Preview Slip"
                                                                target="_blank"
                                                            >
                                                                <Printer className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => downloadPdf(row.id)}
                                                            title="Download PDF"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => {
                                                                if (!confirm('Yakin ingin menghapus data gaji ini?')) {
                                                                    return;
                                                                }
                                                                router.delete(`/payroll/${row.id}`, {
                                                                    preserveScroll: true,
                                                                });
                                                            }}
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {salaries.data.length > 0 && (
                                <tfoot>
                                    <tr className="border-t bg-muted/30 font-medium">
                                        <td></td>
                                        <td colSpan={4} className="px-4 py-3 text-right text-muted-foreground">
                                            Total (filtered):
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(summary.total_penerimaan)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                                            {formatCurrency(summary.total_pajak)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                                            {formatCurrency(summary.total_zakat)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {salaries.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Tampilkan</span>
                                <Select
                                    value={String(filters.per_page ?? 25)}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">per halaman</span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {salaries.links.map((link, i) => (
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
                        </div>
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Keyboard shortcuts:</span>{' '}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">/</kbd> fokus pencarian,{' '}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd> reset filter
                </div>
            </div>
        </AppLayout>
    );
}
