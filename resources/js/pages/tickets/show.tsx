import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    User,
    MessageSquare,
    FileText,
    History,
    Send,
    UserPlus,
    Users,
    CheckCircle,
    AlertTriangle,
    Paperclip,
    ThumbsUp,
    ThumbsDown,
    Download,
    Trash2,
    DollarSign,
    Package,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, User as AuthUser } from '@/types';
import type {
    Ticket,
    TicketStatus,
    TicketPriority,
    TicketUser,
} from '@/types/ticket';

type Props = {
    ticket: Ticket;
    statuses: TicketStatus[];
    priorities: TicketPriority[];
    availableAssignees: TicketUser[];
    availableCollaborators?: TicketUser[];
    availableGroups?: { id: number; name: string; dep_id: string }[];
    canEdit: boolean;
    canAssign: boolean;
    canChangeStatus: boolean;
    canSetDueDate: boolean;
    canConfirm: boolean;
    canAttach: boolean;
    canManageCollaborators?: boolean;
    canManageVendorCosts?: boolean;
};

function getPriorityColor(color: string): string {
    const colorMap: Record<string, string> = {
        red: 'border-red-400/60 bg-red-500/15 text-red-700 dark:border-red-500/50 dark:bg-red-500/25 dark:text-red-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return colorMap[color] || colorMap.gray;
}

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

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function VendorCostForm({
    ticketId,
    onSuccess,
    onCancel,
}: {
    ticketId: number;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        vendor_name: '',
        estimated_cost: '',
        actual_cost: '',
        sparepart_notes: '',
        vendor_notes: '',
        work_date: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/tickets/${ticketId}/vendor-costs`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onSuccess();
            },
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded border p-3 bg-muted/30"
        >
            <div>
                <Label className="text-xs">Nama Vendor *</Label>
                <Input
                    value={form.data.vendor_name}
                    onChange={(e) =>
                        form.setData('vendor_name', e.target.value)
                    }
                    placeholder="Nama vendor"
                    className="mt-1"
                    required
                />
                {form.errors.vendor_name && (
                    <p className="text-xs text-destructive mt-1">
                        {form.errors.vendor_name}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">Estimasi (Rp)</Label>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.data.estimated_cost}
                        onChange={(e) =>
                            form.setData('estimated_cost', e.target.value)
                        }
                        placeholder="0"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label className="text-xs">Realisasi (Rp)</Label>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.data.actual_cost}
                        onChange={(e) =>
                            form.setData('actual_cost', e.target.value)
                        }
                        placeholder="0"
                        className="mt-1"
                    />
                </div>
            </div>
            <div>
                <Label className="text-xs">Tanggal Pengerjaan</Label>
                <Input
                    type="date"
                    value={form.data.work_date}
                    onChange={(e) =>
                        form.setData('work_date', e.target.value)
                    }
                    className="mt-1"
                />
            </div>
            <div>
                <Label className="text-xs">Catatan Sparepart</Label>
                <Textarea
                    value={form.data.sparepart_notes}
                    onChange={(e) =>
                        form.setData('sparepart_notes', e.target.value)
                    }
                    placeholder="Komponen yang diganti"
                    rows={2}
                    className="mt-1"
                />
            </div>
            <div>
                <Label className="text-xs">Catatan Vendor</Label>
                <Textarea
                    value={form.data.vendor_notes}
                    onChange={(e) =>
                        form.setData('vendor_notes', e.target.value)
                    }
                    placeholder="Informasi tambahan"
                    rows={2}
                    className="mt-1"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={form.processing}>
                    Simpan
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

function SparepartForm({
    ticketId,
    onSuccess,
    onCancel,
}: {
    ticketId: number;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        nama_item: '',
        qty: '1',
        harga_satuan: '',
        catatan: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/tickets/${ticketId}/sparepart-items`, {
            transform: (data) => ({
                nama_item: data.nama_item,
                qty: parseInt(data.qty, 10) || 1,
                harga_satuan: data.harga_satuan ? parseFloat(data.harga_satuan) : 0,
                catatan: data.catatan || null,
            }),
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onSuccess();
            },
        });
    };

    const qtyNum = parseInt(form.data.qty, 10) || 0;
    const hargaNum = form.data.harga_satuan ? parseFloat(form.data.harga_satuan) : 0;
    const previewTotal = qtyNum * hargaNum;

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded border p-3 bg-muted/30"
        >
            <div>
                <Label className="text-xs">Nama Item *</Label>
                <Input
                    value={form.data.nama_item}
                    onChange={(e) => form.setData('nama_item', e.target.value)}
                    placeholder="Contoh: Kabel USB, Adaptor, Fuse"
                    className="mt-1"
                    required
                />
                {form.errors.nama_item && (
                    <p className="text-xs text-destructive mt-1">{form.errors.nama_item}</p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">Jumlah (Qty) *</Label>
                    <Input
                        type="number"
                        min="1"
                        value={form.data.qty}
                        onChange={(e) => form.setData('qty', e.target.value)}
                        placeholder="1"
                        className="mt-1"
                        required
                    />
                    {form.errors.qty && (
                        <p className="text-xs text-destructive mt-1">{form.errors.qty}</p>
                    )}
                </div>
                <div>
                    <Label className="text-xs">Harga Satuan (Rp) *</Label>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.data.harga_satuan}
                        onChange={(e) => form.setData('harga_satuan', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                        required
                    />
                    {form.errors.harga_satuan && (
                        <p className="text-xs text-destructive mt-1">{form.errors.harga_satuan}</p>
                    )}
                </div>
            </div>
            {previewTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                    Total: Rp {new Intl.NumberFormat('id-ID').format(previewTotal)}
                </p>
            )}
            <div>
                <Label className="text-xs">Catatan (opsional)</Label>
                <Input
                    value={form.data.catatan}
                    onChange={(e) => form.setData('catatan', e.target.value)}
                    placeholder="Misalnya: merk, nomor seri"
                    className="mt-1"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={form.processing}>
                    {form.processing ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    Batal
                </Button>
            </div>
        </form>
    );
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return formatDate(dateString);
}

export default function TicketShow({
    ticket,
    statuses,
    priorities,
    availableAssignees,
    availableCollaborators = [],
    availableGroups = [],
    canEdit,
    canAssign,
    canChangeStatus,
    canSetDueDate,
    canConfirm,
    canAttach,
    canManageCollaborators = false,
    canManageVendorCosts = false,
}: Props) {
    const { flash, auth } = usePage<{
        flash: { success?: string };
        auth: { user: AuthUser };
    }>().props;
    const user = auth.user;
    const isStaffOrAdmin = (user as unknown as { role?: string }).role !== 'pemohon';

    const [activeTab, setActiveTab] = useState<'comments' | 'activities'>('comments');
    const [complainNote, setComplainNote] = useState('');
    const [showComplainForm, setShowComplainForm] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentError, setAttachmentError] = useState('');
    const [collaboratorUserId, setCollaboratorUserId] = useState('');
    const [showVendorCostForm, setShowVendorCostForm] = useState(false);
    const [showSparepartForm, setShowSparepartForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'attachment' | 'vendor_cost' | 'collaborator' | 'sparepart';
        id: number;
        label?: string;
    } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tiket', href: '/tickets' },
        { title: ticket.ticket_number, href: `/tickets/${ticket.id}` },
    ];

    // Comment form
    const commentForm = useForm({
        body: '',
        is_internal: false,
    });

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        commentForm.post(`/tickets/${ticket.id}/comments`, {
            preserveScroll: true,
            onSuccess: () => commentForm.reset(),
        });
    };

    // Status update
    const handleStatusChange = (statusId: string) => {
        router.patch(
            `/tickets/${ticket.id}`,
            { ticket_status_id: parseInt(statusId) },
            { preserveScroll: true }
        );
    };

    // Priority update
    const handlePriorityChange = (priorityId: string) => {
        router.patch(
            `/tickets/${ticket.id}`,
            { ticket_priority_id: parseInt(priorityId) },
            { preserveScroll: true }
        );
    };

    // Assignee update
    const handleAssigneeChange = (assigneeId: string) => {
        router.patch(
            `/tickets/${ticket.id}`,
            { assignee_id: assigneeId ? parseInt(assigneeId) : null },
            { preserveScroll: true }
        );
    };

    // Group update (assign to group pool)
    const handleGroupChange = (groupId: string) => {
        router.patch(
            `/tickets/${ticket.id}`,
            { ticket_group_id: groupId ? parseInt(groupId) : null },
            { preserveScroll: true }
        );
    };

    // Assign to self
    const handleAssignToSelf = () => {
        router.post(`/tickets/${ticket.id}/assign-self`, {}, { preserveScroll: true });
    };

    // Close ticket
    const handleClose = () => {
        if (confirm('Apakah Anda yakin ingin menutup tiket ini?')) {
            router.post(`/tickets/${ticket.id}/close`, {}, { preserveScroll: true });
        }
    };

    // Confirm closure (pemohon)
    const handleConfirm = () => {
        router.post(`/tickets/${ticket.id}/confirm`, {}, { preserveScroll: true });
    };

    // Complain (pemohon)
    const handleComplain = (e: React.FormEvent) => {
        e.preventDefault();
        if (!complainNote.trim()) return;
        router.post(`/tickets/${ticket.id}/complain`, { note: complainNote }, { preserveScroll: true });
        setComplainNote('');
        setShowComplainForm(false);
    };

    // Upload attachment
    const handleAttachmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachmentFile) {
            setAttachmentError('Pilih file terlebih dahulu');
            return;
        }
        if (attachmentFile.size > 10 * 1024 * 1024) {
            setAttachmentError('Ukuran file maksimal 10 MB');
            return;
        }
        const formData = new FormData();
        formData.append('file', attachmentFile);
        router.post(`/tickets/${ticket.id}/attachments`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setAttachmentFile(null);
                setAttachmentError('');
            },
            onError: (errors) => {
                setAttachmentError(errors?.file?.[0] || 'Gagal mengunggah');
            },
        });
    };

    const isOverdue =
        ticket.resolution_due_at &&
        new Date(ticket.resolution_due_at) < new Date() &&
        !ticket.status.is_closed;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tiket ${ticket.ticket_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/tickets">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-primary font-medium">
                                    {ticket.ticket_number}
                                </span>
                                <Badge variant="outline" className={getStatusColor(ticket.status.color)}>
                                    {ticket.status.name}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(ticket.priority.color)}>
                                    {ticket.priority.name}
                                </Badge>
                                {isOverdue && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Terlambat
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-xl font-semibold">{ticket.title}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {ticket.type.name}
                                {ticket.category && ` • ${ticket.category.name}`}
                                {ticket.subcategory && ` • ${ticket.subcategory.name}`}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                        {canAssign && !ticket.assignee_id && (
                            <Button variant="outline" onClick={handleAssignToSelf}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Ambil Tiket
                            </Button>
                        )}
                        {canConfirm && (
                            <>
                                <Button variant="default" onClick={handleConfirm}>
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    Konfirmasi Selesai
                                </Button>
                                {!showComplainForm ? (
                                    <Button variant="outline" onClick={() => setShowComplainForm(true)}>
                                        <ThumbsDown className="mr-2 h-4 w-4" />
                                        Komplain
                                    </Button>
                                ) : (
                                    <form onSubmit={handleComplain} className="flex flex-col gap-2">
                                        <Textarea
                                            value={complainNote}
                                            onChange={(e) => setComplainNote(e.target.value)}
                                            placeholder="Alasan komplain (wajib diisi)..."
                                            rows={2}
                                            className="min-w-[200px]"
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" disabled={!complainNote.trim()}>
                                                Kirim Komplain
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setShowComplainForm(false);
                                                    setComplainNote('');
                                                }}
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                        {canChangeStatus && !ticket.status.is_closed && !canConfirm && (
                            <Button variant="outline" onClick={handleClose}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Tutup
                            </Button>
                        )}
                        {canEdit && (
                            <Button asChild>
                                <Link href={`/tickets/${ticket.id}/edit`}>Edit</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        {flash.success}
                    </p>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Deskripsi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ticket.description ? (
                                    <p className="whitespace-pre-wrap text-sm">
                                        {ticket.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Tidak ada deskripsi
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attachments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Lampiran ({ticket.attachments?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {ticket.attachments && ticket.attachments.length > 0 ? (
                                    <ul className="space-y-2">
                                        {ticket.attachments.map((att) => (
                                            <li
                                                key={att.id}
                                                className="flex items-center justify-between rounded border p-2 text-sm"
                                            >
                                                <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-primary hover:underline"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    {att.filename}
                                                    {att.size && (
                                                        <span className="text-muted-foreground text-xs">
                                                            ({Math.round(att.size / 1024)} KB)
                                                        </span>
                                                    )}
                                                </a>
                                                {canAttach && !ticket.status.is_closed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() =>
                                                            setDeleteConfirm({
                                                                type: 'attachment',
                                                                id: att.id,
                                                                label: att.original_name,
                                                            })
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Belum ada lampiran</p>
                                )}
                                {canAttach && !ticket.status.is_closed && (
                                    <form onSubmit={handleAttachmentSubmit} className="flex gap-2 pt-2 border-t">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                setAttachmentFile(f || null);
                                                setAttachmentError('');
                                            }}
                                            className="text-sm"
                                        />
                                        <Button type="submit" size="sm" disabled={!attachmentFile}>
                                            Unggah
                                        </Button>
                                        {attachmentError && (
                                            <span className="text-sm text-destructive">{attachmentError}</span>
                                        )}
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Vendor & Biaya */}
                        {canManageVendorCosts && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Biaya Vendor ({ticket.vendor_costs?.length || 0})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {ticket.vendor_costs && ticket.vendor_costs.length > 0 ? (
                                        <ul className="space-y-3">
                                            {ticket.vendor_costs.map((vc) => (
                                                <li
                                                    key={vc.id}
                                                    className="rounded border p-3 text-sm space-y-1"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-medium">
                                                            {vc.vendor_name}
                                                        </span>
                                                        {!ticket.status.is_closed && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-destructive"
                                                                onClick={() =>
                                                                    setDeleteConfirm({
                                                                        type: 'vendor_cost',
                                                                        id: vc.id,
                                                                        label: vc.vendor_name,
                                                                    })
                                                                }
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-4 text-muted-foreground">
                                                        {vc.estimated_cost != null && (
                                                            <span>
                                                                Estimasi:{' '}
                                                                {new Intl.NumberFormat(
                                                                    'id-ID'
                                                                ).format(vc.estimated_cost)}
                                                            </span>
                                                        )}
                                                        {vc.actual_cost != null && (
                                                            <span>
                                                                Realisasi:{' '}
                                                                {new Intl.NumberFormat(
                                                                    'id-ID'
                                                                ).format(vc.actual_cost)}
                                                            </span>
                                                        )}
                                                        {vc.work_date && (
                                                            <span>
                                                                {new Date(
                                                                    vc.work_date
                                                                ).toLocaleDateString(
                                                                    'id-ID'
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {vc.sparepart_notes && (
                                                        <p className="text-xs">
                                                            Sparepart:{' '}
                                                            {vc.sparepart_notes}
                                                        </p>
                                                    )}
                                                    {vc.vendor_notes && (
                                                        <p className="text-xs">
                                                            Catatan:{' '}
                                                            {vc.vendor_notes}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Belum ada biaya vendor
                                        </p>
                                    )}
                                    {!ticket.status.is_closed && (
                                        <>
                                            {!showVendorCostForm ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowVendorCostForm(
                                                            true
                                                        )
                                                    }
                                                >
                                                    Tambah Biaya Vendor
                                                </Button>
                                            ) : (
                                                <VendorCostForm
                                                    ticketId={ticket.id}
                                                    onSuccess={() =>
                                                        setShowVendorCostForm(
                                                            false
                                                        )
                                                    }
                                                    onCancel={() =>
                                                        setShowVendorCostForm(
                                                            false
                                                        )
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Biaya Sparepart (Perbaikan Sendiri) */}
                        {canManageVendorCosts && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Wrench className="h-4 w-4" />
                                        Biaya Sparepart ({ticket.sparepart_items?.length || 0})
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                                        Catat komponen yang diganti saat perbaikan dilakukan sendiri (bukan dikirim ke vendor).
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {ticket.sparepart_items && ticket.sparepart_items.length > 0 ? (
                                        <>
                                            <ul className="space-y-3">
                                                {ticket.sparepart_items.map((item) => {
                                                    const total = item.qty * item.harga_satuan;
                                                    return (
                                                        <li
                                                            key={item.id}
                                                            className="rounded border p-3 text-sm space-y-1"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-medium">
                                                                    {item.nama_item}
                                                                </span>
                                                                {!ticket.status.is_closed && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-destructive"
                                                                        onClick={() =>
                                                                            setDeleteConfirm({
                                                                                type: 'sparepart',
                                                                                id: item.id,
                                                                                label: item.nama_item,
                                                                            })
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-4 text-muted-foreground">
                                                                <span>
                                                                    {item.qty} × Rp {new Intl.NumberFormat('id-ID').format(item.harga_satuan)} ={' '}
                                                                    <strong className="text-foreground">
                                                                        Rp {new Intl.NumberFormat('id-ID').format(total)}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                            {item.catatan && (
                                                                <p className="text-xs">Catatan: {item.catatan}</p>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <p className="text-sm font-medium border-t pt-2">
                                                Total: Rp{' '}
                                                {new Intl.NumberFormat('id-ID').format(
                                                    ticket.sparepart_items.reduce(
                                                        (sum, i) => sum + i.qty * i.harga_satuan,
                                                        0
                                                    )
                                                )}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Belum ada item spare part. Gunakan tombol di bawah untuk menambah.
                                        </p>
                                    )}
                                    {!ticket.status.is_closed && (
                                        <>
                                            {!showSparepartForm ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowSparepartForm(true)}
                                                >
                                                    + Tambah Item Sparepart
                                                </Button>
                                            ) : (
                                                <SparepartForm
                                                    ticketId={ticket.id}
                                                    onSuccess={() => setShowSparepartForm(false)}
                                                    onCancel={() => setShowSparepartForm(false)}
                                                />
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Comments & Activities Tabs */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex gap-2">
                                    <Button
                                        variant={activeTab === 'comments' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setActiveTab('comments')}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Komentar ({ticket.comments?.length || 0})
                                    </Button>
                                    <Button
                                        variant={activeTab === 'activities' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setActiveTab('activities')}
                                    >
                                        <History className="mr-2 h-4 w-4" />
                                        Riwayat ({ticket.activities?.length || 0})
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {activeTab === 'comments' ? (
                                    <div className="space-y-4">
                                        {/* Comment List */}
                                        {ticket.comments && ticket.comments.length > 0 ? (
                                            <div className="space-y-3">
                                                {ticket.comments.map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className={`rounded-lg border p-3 ${
                                                            comment.is_internal
                                                                ? 'border-yellow-300/50 bg-yellow-50/50 dark:border-yellow-600/30 dark:bg-yellow-950/20'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">
                                                                    {comment.user.name}
                                                                </span>
                                                                {comment.is_internal && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-300"
                                                                    >
                                                                        Internal
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(comment.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {comment.body}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Belum ada komentar
                                            </p>
                                        )}

                                        {/* Comment Form */}
                                        {!ticket.status.is_closed && (
                                            <form
                                                onSubmit={handleCommentSubmit}
                                                className="space-y-3 pt-4 border-t"
                                            >
                                                <Textarea
                                                    placeholder="Tulis komentar..."
                                                    value={commentForm.data.body}
                                                    onChange={(e) =>
                                                        commentForm.setData('body', e.target.value)
                                                    }
                                                    rows={3}
                                                />
                                                <InputError message={commentForm.errors.body} />

                                                <div className="flex items-center justify-between">
                                                    {isStaffOrAdmin && (
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id="is_internal"
                                                                checked={commentForm.data.is_internal}
                                                                onCheckedChange={(checked) =>
                                                                    commentForm.setData(
                                                                        'is_internal',
                                                                        checked === true
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor="is_internal"
                                                                className="text-sm text-muted-foreground"
                                                            >
                                                                Komentar internal (tidak terlihat pemohon)
                                                            </Label>
                                                        </div>
                                                    )}
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            commentForm.processing ||
                                                            !commentForm.data.body.trim()
                                                        }
                                                        size="sm"
                                                    >
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Kirim
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {ticket.activities && ticket.activities.length > 0 ? (
                                            ticket.activities.map((activity) => (
                                                <div
                                                    key={activity.id}
                                                    className="flex gap-3 py-2 border-b last:border-0"
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-sm">
                                                            <span className="font-medium">
                                                                {activity.user.name}
                                                            </span>{' '}
                                                            <span className="text-muted-foreground">
                                                                {activity.action_label}
                                                            </span>
                                                            {activity.old_value &&
                                                                activity.new_value && (
                                                                    <span className="text-muted-foreground">
                                                                        {' '}
                                                                        dari{' '}
                                                                        <span className="font-medium">
                                                                            {activity.old_value}
                                                                        </span>{' '}
                                                                        ke{' '}
                                                                        <span className="font-medium">
                                                                            {activity.new_value}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                        </p>
                                                        {activity.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {activity.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatRelativeTime(activity.created_at)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Belum ada riwayat aktivitas
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Detail</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Status */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        Status
                                    </Label>
                                    {canChangeStatus && !ticket.status.is_closed ? (
                                        <Select
                                            value={String(ticket.ticket_status_id)}
                                            onValueChange={handleStatusChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className={getStatusColor(ticket.status.color)}
                                        >
                                            {ticket.status.name}
                                        </Badge>
                                    )}
                                </div>

                                {/* Priority */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        Prioritas
                                    </Label>
                                    {canEdit && !ticket.status.is_closed ? (
                                        <Select
                                            value={String(ticket.ticket_priority_id)}
                                            onValueChange={handlePriorityChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className={getPriorityColor(ticket.priority.color)}
                                        >
                                            {ticket.priority.name}
                                        </Badge>
                                    )}
                                </div>

                                {/* Assignee */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        Petugas
                                    </Label>
                                    {canAssign && !ticket.status.is_closed ? (
                                        <Select
                                            value={ticket.assignee_id ? String(ticket.assignee_id) : '__none__'}
                                            onValueChange={(v) => handleAssigneeChange(v === '__none__' ? '' : v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih petugas..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Tidak ada</SelectItem>
                                                {availableAssignees.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm">
                                            {ticket.assignee?.name || (
                                                <span className="text-muted-foreground italic">
                                                    Belum ditugaskan
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Grup */}
                                {canAssign && availableGroups.length > 0 && !ticket.status.is_closed && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                                            Grup
                                        </Label>
                                        <Select
                                            value={
                                                ticket.ticket_group_id
                                                    ? String(ticket.ticket_group_id)
                                                    : '__none__'
                                            }
                                            onValueChange={(v) => handleGroupChange(v === '__none__' ? '' : v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih grup..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Tidak ada</SelectItem>
                                                {availableGroups.map((g) => (
                                                    <SelectItem key={g.id} value={String(g.id)}>
                                                        {g.name} ({g.dep_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Assign ke grup agar anggota bisa ambil tiket
                                        </p>
                                    </div>
                                )}

                                {/* Rekan (Collaborators) */}
                                {canManageCollaborators && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                                            <Users className="h-3 w-3 inline mr-1" />
                                            Rekan ({ticket.collaborators?.length || 0})
                                        </Label>
                                        {ticket.collaborators && ticket.collaborators.length > 0 ? (
                                            <ul className="space-y-1.5 mb-2">
                                                {ticket.collaborators.map((col) => (
                                                    <li
                                                        key={col.id}
                                                        className="flex items-center justify-between rounded border px-2 py-1.5 text-sm"
                                                    >
                                                        <span>
                                                            {col.user.name}
                                                            <span className="text-muted-foreground text-xs ml-1">
                                                                ({col.user.dep_id})
                                                            </span>
                                                        </span>
                                                        {!ticket.status.is_closed && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-destructive"
                                                                onClick={() =>
                                                                    setDeleteConfirm({
                                                                        type: 'collaborator',
                                                                        id: col.id,
                                                                        label: col.user.name,
                                                                    })
                                                                }
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic mb-2">
                                                Belum ada rekan
                                            </p>
                                        )}
                                        {!ticket.status.is_closed &&
                                            availableCollaborators.length > 0 && (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        if (!collaboratorUserId) return;
                                                        router.post(
                                                            `/tickets/${ticket.id}/collaborators`,
                                                            { user_id: parseInt(collaboratorUserId) },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () => setCollaboratorUserId(''),
                                                            }
                                                        );
                                                    }}
                                                    className="flex gap-2"
                                                >
                                                    <Select
                                                        value={collaboratorUserId}
                                                        onValueChange={setCollaboratorUserId}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Tambah rekan..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableCollaborators.map((u) => (
                                                                <SelectItem key={u.id} value={String(u.id)}>
                                                                    {u.name} ({u.dep_id})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={!collaboratorUserId}
                                                    >
                                                        Tambah
                                                    </Button>
                                                </form>
                                            )}
                                    </div>
                                )}

                                {/* Requester */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        <User className="h-3 w-3 inline mr-1" />
                                        Pemohon
                                    </Label>
                                    <p className="text-sm">{ticket.requester.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {ticket.requester.email}
                                    </p>
                                </div>

                                {/* Department */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        Departemen
                                    </Label>
                                    <p className="text-sm">{ticket.dep_id}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Waktu
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dibuat</span>
                                    <span>{formatDate(ticket.created_at)}</span>
                                </div>
                                {ticket.response_due_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Target Respons</span>
                                        <span
                                            className={
                                                ticket.first_response_at
                                                    ? 'text-green-600'
                                                    : new Date(ticket.response_due_at) < new Date()
                                                    ? 'text-red-600'
                                                    : ''
                                            }
                                        >
                                            {formatDate(ticket.response_due_at)}
                                        </span>
                                    </div>
                                )}
                                {ticket.first_response_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Respons Pertama</span>
                                        <span className="text-green-600">
                                            {formatDate(ticket.first_response_at)}
                                        </span>
                                    </div>
                                )}
                                {ticket.resolution_due_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Target Selesai</span>
                                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                            {formatDate(ticket.resolution_due_at)}
                                        </span>
                                    </div>
                                )}
                                {ticket.due_date && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Target Manual</span>
                                        <span>{formatDate(ticket.due_date)}</span>
                                    </div>
                                )}
                                {ticket.resolved_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Diselesaikan</span>
                                        <span className="text-green-600">
                                            {formatDate(ticket.resolved_at)}
                                        </span>
                                    </div>
                                )}
                                {ticket.closed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ditutup</span>
                                        <span>{formatDate(ticket.closed_at)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        {ticket.tags && ticket.tags.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tag / Pengelompokan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {ticket.tags.map((tag) => (
                                            <Badge key={tag.id} variant="secondary">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Untuk referensi Knowledge Base
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Related Ticket */}
                        {ticket.related_ticket && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tiket Terkait</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        href={`/tickets/${ticket.related_ticket.id}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {ticket.related_ticket.ticket_number} -{' '}
                                        {ticket.related_ticket.title}
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Inventaris / Asset */}
                        {ticket.inventaris && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Inventaris
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <div className="font-mono font-medium">{ticket.inventaris.no_inventaris}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {ticket.inventaris.barang?.nama_barang ?? ticket.inventaris.kode_barang}
                                    </div>
                                    {ticket.inventaris.ruang?.nama_ruang && (
                                        <div className="text-xs text-muted-foreground">
                                            Ruang: {ticket.inventaris.ruang.nama_ruang}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => !open && setDeleteConfirm(null)}
                title={
                    deleteConfirm?.type === 'attachment'
                        ? 'Hapus Lampiran'
                        : deleteConfirm?.type === 'vendor_cost'
                          ? 'Hapus Biaya Vendor'
                          : deleteConfirm?.type === 'sparepart'
                            ? 'Hapus Item Sparepart'
                            : 'Hapus Rekan'
                }
                description={
                    deleteConfirm?.label
                        ? `Hapus "${deleteConfirm.label}"?`
                        : 'Tindakan ini tidak bisa dibatalkan.'
                }
                onConfirm={() => {
                    if (!deleteConfirm) return;
                    const urlMap = {
                        attachment: `/tickets/${ticket.id}/attachments/${deleteConfirm.id}`,
                        vendor_cost: `/tickets/${ticket.id}/vendor-costs/${deleteConfirm.id}`,
                        sparepart: `/tickets/${ticket.id}/sparepart-items/${deleteConfirm.id}`,
                        collaborator: `/tickets/${ticket.id}/collaborators/${deleteConfirm.id}`,
                    };
                    router.delete(urlMap[deleteConfirm.type], {
                        preserveScroll: true,
                        onSuccess: () => setDeleteConfirm(null),
                    });
                }}
            />
        </AppLayout>
    );
}
