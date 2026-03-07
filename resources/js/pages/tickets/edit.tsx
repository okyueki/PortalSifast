import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { InventarisSearchInput } from '@/components/inventaris-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    Ticket,
    TicketType,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    TicketTag,
} from '@/types/ticket';

type Props = {
    ticket: Ticket;
    types: TicketType[];
    categories: TicketCategory[];
    priorities: TicketPriority[];
    statuses: TicketStatus[];
    tags: TicketTag[];
    canDelete?: boolean;
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

export default function TicketEdit({ ticket, types, categories, priorities, statuses, tags = [], canDelete = false }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tiket', href: '/tickets' },
        { title: ticket.ticket_number, href: `/tickets/${ticket.id}` },
        { title: 'Edit', href: `/tickets/${ticket.id}/edit` },
    ];

    const inventarisLabel =
        ticket.inventaris != null
            ? `${ticket.inventaris.no_inventaris} - ${ticket.inventaris.barang?.nama_barang ?? ticket.inventaris.kode_barang}`
            : null;

    const { data, setData, patch, processing, errors } = useForm({
        title: ticket.title,
        description: ticket.description || '',
        ticket_priority_id: String(ticket.ticket_priority_id),
        ticket_status_id: String(ticket.ticket_status_id),
        asset_no_inventaris: ticket.asset_no_inventaris ?? null,
        tag_ids: (ticket.tags ?? []).map((t) => t.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/tickets/${ticket.id}`, {
            transform: (d) => ({
                ...d,
                asset_no_inventaris: d.asset_no_inventaris || null,
                tag_ids: Array.isArray(d.tag_ids) ? d.tag_ids : [],
            }),
        });
    };

    const isClosed = ticket.status.is_closed;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tiket ${ticket.ticket_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
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
                        </div>
                        <Heading
                            title="Edit Tiket"
                            description="Perbarui informasi tiket"
                            variant="small"
                        />
                    </div>
                </div>

                {isClosed && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-950">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Tiket Sudah Ditutup
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                            Tiket yang sudah ditutup tidak dapat diedit. Silakan buat tiket baru jika
                            diperlukan.
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border bg-card p-6"
                >
                    {/* Read-only info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="text-muted-foreground">Tipe</Label>
                            <p className="text-sm mt-1">{ticket.type.name}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Kategori</Label>
                            <p className="text-sm mt-1">
                                {ticket.category?.name || '-'}
                                {ticket.subcategory && ` / ${ticket.subcategory.name}`}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Pemohon</Label>
                            <p className="text-sm mt-1">{ticket.requester.name}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Departemen</Label>
                            <p className="text-sm mt-1">{ticket.dep_id}</p>
                        </div>
                    </div>

                    <hr />

                    {/* Title */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">
                            Judul <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Ringkasan singkat masalah/permintaan..."
                            maxLength={255}
                            required
                            disabled={isClosed}
                        />
                        <InputError message={errors.title} />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Jelaskan detail masalah/permintaan..."
                            rows={5}
                            maxLength={10000}
                            disabled={isClosed}
                        />
                        <InputError message={errors.description} />
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Tag / Pengelompokan (opsional)</Label>
                            <p className="text-xs text-muted-foreground">
                                Centang tag yang sesuai untuk pengelompokan kasus dan referensi Knowledge Base.
                            </p>
                            <div className="flex flex-wrap gap-3 rounded-md border p-3">
                                {tags.map((tag) => (
                                    <label
                                        key={tag.id}
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={data.tag_ids.includes(tag.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setData('tag_ids', [...data.tag_ids, tag.id]);
                                                } else {
                                                    setData(
                                                        'tag_ids',
                                                        data.tag_ids.filter((id) => id !== tag.id)
                                                    );
                                                }
                                            }}
                                        />
                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.tag_ids} />
                        </div>
                    )}

                    {/* Inventaris / Asset */}
                    <div className="grid gap-2">
                        <Label htmlFor="asset_no_inventaris">Inventaris / Asset (opsional)</Label>
                        <InventarisSearchInput
                            value={data.asset_no_inventaris}
                            onChange={(v) => setData('asset_no_inventaris', v)}
                            initialLabel={inventarisLabel}
                        />
                        <p className="text-xs text-muted-foreground">
                            Untuk tiket IPS: pilih barang inventaris jika tiket terkait alat medis/peralatan.
                        </p>
                        <InputError message={errors.asset_no_inventaris} />
                    </div>

                    {/* Priority */}
                    <div className="grid gap-2">
                        <Label htmlFor="ticket_priority_id">Prioritas</Label>
                        <Select
                            value={data.ticket_priority_id}
                            onValueChange={(v) => setData('ticket_priority_id', v)}
                            disabled={isClosed}
                        >
                            <SelectTrigger id="ticket_priority_id">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map((priority) => (
                                    <SelectItem key={priority.id} value={String(priority.id)}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        priority.color === 'red'
                                                            ? '#ef4444'
                                                            : priority.color === 'orange'
                                                            ? '#f97316'
                                                            : priority.color === 'yellow'
                                                            ? '#eab308'
                                                            : '#22c55e',
                                                }}
                                            />
                                            <span>{priority.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ticket_priority_id} />
                    </div>

                    {/* Status */}
                    <div className="grid gap-2">
                        <Label htmlFor="ticket_status_id">Status</Label>
                        <Select
                            value={data.ticket_status_id}
                            onValueChange={(v) => setData('ticket_status_id', v)}
                            disabled={isClosed}
                        >
                            <SelectTrigger id="ticket_status_id">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((status) => (
                                    <SelectItem key={status.id} value={String(status.id)}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ticket_status_id} />
                    </div>

                    {/* Submit */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                        <div className="flex gap-3">
                            <Button type="submit" disabled={processing || isClosed}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/tickets/${ticket.id}`}>Batal</Link>
                            </Button>
                        </div>
                        {canDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Hapus Tiket
                            </Button>
                        )}
                    </div>
                </form>
                {canDelete && (
                    <ConfirmDialog
                        open={showDeleteConfirm}
                        onOpenChange={setShowDeleteConfirm}
                        title="Hapus Tiket"
                        description={`Apakah Anda yakin ingin menghapus tiket ${ticket.ticket_number}? Tindakan ini tidak bisa dibatalkan.`}
                        confirmLabel="Hapus"
                        onConfirm={() => router.delete(`/tickets/${ticket.id}`)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
