import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Paperclip, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactSelect, { type SingleValue } from 'react-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { InventarisSearchInput } from '@/components/inventaris-search-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { UserSearchInput } from '@/components/user-search-input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { TicketType, TicketCategory, TicketPriority, TicketTag } from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
    { title: 'Buat Tiket', href: '/tickets/create' },
];

type TicketForLink = {
    id: number;
    ticket_number: string;
    title: string;
    created_at: string;
};

type ProjectOption = { id: number; name: string };
type RelatedTicketOption = {
    value: string;
    label: string;
    ticketNumber: string;
    title: string;
    createdAt: string;
};

type Props = {
    types: TicketType[];
    categories: TicketCategory[];
    priorities: TicketPriority[];
    tags: TicketTag[];
    recentTicketsForLink: TicketForLink[];
    canSelectRequester: boolean;
    projects?: ProjectOption[];
    initialProjectId?: number | null;
};

export default function TicketCreate({
    types,
    categories,
    priorities,
    tags = [],
    recentTicketsForLink = [],
    canSelectRequester = false,
    projects = [],
    initialProjectId = null,
}: Props) {
    const { data, setData, post, processing, errors, transform } = useForm({
        ticket_type_id: '',
        ticket_category_id: '',
        ticket_subcategory_id: '',
        ticket_priority_id: '',
        title: '',
        description: '',
        related_ticket_id: '',
        asset_no_inventaris: null as string | null,
        tag_ids: [] as number[],
        requester_id: null as number | null,
        created_at: '' as string,
        project_id: (initialProjectId ?? '') as string | number,
        is_draft: false,
        plan_ideas: '',
        plan_tools: '',
        budget_estimate: '',
        budget_notes: '',
        attachments: [] as File[],
    });

    const [filteredCategories, setFilteredCategories] = useState<TicketCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
    const relatedTicketOptions: RelatedTicketOption[] = recentTicketsForLink.map((ticket) => ({
        value: String(ticket.id),
        label: `${ticket.ticket_number} - ${ticket.title}`,
        ticketNumber: ticket.ticket_number,
        title: ticket.title,
        createdAt: ticket.created_at,
    }));
    const selectedRelatedTicketOption =
        relatedTicketOptions.find((option) => option.value === data.related_ticket_id) ?? null;

    // Filter categories based on selected type (null = kategori untuk semua tipe)
    useEffect(() => {
        if (data.ticket_type_id) {
            const typeId = parseInt(data.ticket_type_id);
            const filtered = categories.filter(
                (c) => c.ticket_type_id == null || c.ticket_type_id === typeId
            );
            setFilteredCategories(filtered);

            // Reset category if not in filtered list
            if (
                data.ticket_category_id &&
                !filtered.some((c) => c.id === parseInt(data.ticket_category_id))
            ) {
                setData('ticket_category_id', '');
                setData('ticket_subcategory_id', '');
                setSelectedCategory(null);
            }
        } else {
            setFilteredCategories([]);
        }
    }, [data.ticket_type_id, categories]);

    // Update selected category
    useEffect(() => {
        if (data.ticket_category_id) {
            const category = categories.find((c) => c.id === parseInt(data.ticket_category_id));
            setSelectedCategory(category || null);

            // Reset subcategory if not in selected category
            if (category && data.ticket_subcategory_id) {
                const hasSubcategory = category.subcategories?.some(
                    (s) => s.id === parseInt(data.ticket_subcategory_id)
                );
                if (!hasSubcategory) {
                    setData('ticket_subcategory_id', '');
                }
            }
        } else {
            setSelectedCategory(null);
            setData('ticket_subcategory_id', '');
        }
    }, [data.ticket_category_id, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasAttachments = data.attachments.length > 0;

        transform((formData) => {
            const payload: Record<string, unknown> = {
                ...formData,
                ticket_subcategory_id: formData.ticket_subcategory_id === '_none' ? '' : formData.ticket_subcategory_id,
            };
            if (formData.related_ticket_id && formData.related_ticket_id !== '_none') {
                payload.related_ticket_id = parseInt(formData.related_ticket_id);
            } else {
                payload.related_ticket_id = null;
            }
            payload.asset_no_inventaris = formData.asset_no_inventaris || null;
            payload.tag_ids = Array.isArray(formData.tag_ids) ? formData.tag_ids : [];
            payload.created_at = formData.created_at && String(formData.created_at).trim() ? formData.created_at : null;
            payload.project_id = formData.project_id && formData.project_id !== '_none' ? (typeof formData.project_id === 'number' ? formData.project_id : parseInt(String(formData.project_id), 10)) : null;
            payload.budget_estimate = String(formData.budget_estimate).trim() !== '' ? parseInt(String(formData.budget_estimate), 10) : null;

            if (hasAttachments) {
                payload.attachments = formData.attachments;
            } else {
                delete payload.attachments;
            }

            return payload;
        });

        post('/tickets', {
            preserveScroll: true,
            forceFormData: hasAttachments,
        });
    };

    const attachmentFieldErrors = Object.entries(errors)
        .filter(([key]) => key.startsWith('attachments'))
        .map(([, message]) => message)
        .filter(Boolean);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Tiket" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/tickets">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Buat Tiket Baru"
                        description="Ajukan permintaan layanan atau laporkan insiden"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border bg-card p-6"
                >
                    {/* Requester Selection (Admin / Teknisi) */}
                    {canSelectRequester && (
                        <div className="grid gap-2">
                            <Label htmlFor="requester_id">
                                Pemohon
                            </Label>
                            <UserSearchInput
                                value={data.requester_id}
                                onChange={(v) => setData('requester_id', v)}
                                placeholder="Cari nama, email, atau NIK pemohon..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Pilih pemohon untuk tiket ini. Kosongkan jika Anda adalah pemohon.
                            </p>
                            <InputError message={errors.requester_id} />
                        </div>
                    )}

                    {/* Type */}
                    <div className="grid gap-2">
                        <Label htmlFor="ticket_type_id">
                            Tipe Tiket <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.ticket_type_id}
                            onValueChange={(v) => setData('ticket_type_id', v)}
                        >
                            <SelectTrigger id="ticket_type_id">
                                <SelectValue placeholder="Pilih tipe tiket..." />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((type) => (
                                    <SelectItem key={type.id} value={String(type.id)}>
                                        <div className="flex flex-col">
                                            <span>{type.name}</span>
                                            {type.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {type.description}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Insiden = ada yang rusak/error. Permintaan Layanan = butuh bantuan/instalasi.
                        </p>
                        <InputError message={errors.ticket_type_id} />
                    </div>

                    {/* Category */}
                    <div className="grid gap-2">
                        <Label htmlFor="ticket_category_id">
                            Kategori
                        </Label>
                        <Select
                            value={data.ticket_category_id}
                            onValueChange={(v) => setData('ticket_category_id', v)}
                            disabled={!data.ticket_type_id}
                        >
                            <SelectTrigger id="ticket_category_id">
                                <SelectValue
                                    placeholder={
                                        data.ticket_type_id
                                            ? 'Pilih kategori...'
                                            : 'Pilih tipe tiket terlebih dahulu'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCategories.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Tidak ada kategori untuk tipe ini
                                    </div>
                                ) : (
                                    filteredCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({cat.dep_id})
                                            </span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ticket_category_id} />
                    </div>

                    {/* Subcategory (if available) */}
                    {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="ticket_subcategory_id">Sub-kategori</Label>
                            <Select
                                value={data.ticket_subcategory_id}
                                onValueChange={(v) => setData('ticket_subcategory_id', v)}
                            >
                                <SelectTrigger id="ticket_subcategory_id">
                                    <SelectValue placeholder="Pilih sub-kategori (opsional)..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Tidak ada</SelectItem>
                                    {selectedCategory.subcategories.map((sub) => (
                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.ticket_subcategory_id} />
                        </div>
                    )}

                    {/* Priority */}
                    <div className="grid gap-2">
                        <Label htmlFor="ticket_priority_id">
                            Prioritas <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.ticket_priority_id}
                            onValueChange={(v) => setData('ticket_priority_id', v)}
                        >
                            <SelectTrigger id="ticket_priority_id">
                                <SelectValue placeholder="Pilih prioritas..." />
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
                                            {priority.resolution_hours && (
                                                <span className="text-xs text-muted-foreground">
                                                    (target {priority.resolution_hours}h)
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Kritis = layanan utama berhenti. Tinggi = banyak user terdampak. Sedang = ada
                            workaround. Rendah = tidak mendesak.
                        </p>
                        <InputError message={errors.ticket_priority_id} />
                    </div>

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
                        />
                        <p className="text-xs text-muted-foreground">
                            Contoh: "Monitor tidak menyala", "Request instalasi Microsoft Office"
                        </p>
                        <InputError message={errors.title} />
                    </div>

                    {/* Related Ticket */}
                    {recentTicketsForLink.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="related_ticket_id">
                                Tiket Terkait (opsional)
                            </Label>
                            <ReactSelect<RelatedTicketOption, false>
                                inputId="related_ticket_id"
                                value={selectedRelatedTicketOption}
                                options={relatedTicketOptions}
                                isClearable
                                placeholder="Pilih tiket sebelumnya jika masalah berulang..."
                                noOptionsMessage={() => 'Tidak ada tiket'}
                                onChange={(option: SingleValue<RelatedTicketOption>) =>
                                    setData('related_ticket_id', option?.value ?? '')
                                }
                                formatOptionLabel={(option) => (
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm">
                                            {option.ticketNumber} - {option.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(option.createdAt).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                )}
                            />
                            <p className="text-xs text-muted-foreground">
                                Pilih jika ini lanjutan/terkait tiket sebelumnya
                                (masalah yang sama muncul lagi).
                            </p>
                            <InputError message={errors.related_ticket_id} />
                        </div>
                    )}

                    {/* Project / Rencana (opsional) */}
                    {projects.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="project_id">Rencana / Project (opsional)</Label>
                            <Select
                                value={data.project_id === null || data.project_id === '' ? '_none' : String(data.project_id)}
                                onValueChange={(v) => setData('project_id', v === '_none' ? '' : v)}
                            >
                                <SelectTrigger id="project_id">
                                    <SelectValue placeholder="Pilih project untuk tracking..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Tidak ada</SelectItem>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Kelompokkan tiket ke dalam rencana/proyek untuk tracking pekerjaan besar.
                            </p>
                            <InputError message={errors.project_id} />
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Tag / Pengelompokan (opsional)</Label>
                            <p className="text-xs text-muted-foreground">
                                Centang satu atau lebih tag untuk memudahkan pencarian dan referensi solusi nanti (Knowledge Base).
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
                        />
                        <p className="text-xs text-muted-foreground">
                            Untuk tiket IPS: pilih barang inventaris jika tiket terkait alat medis/peralatan.
                        </p>
                        <InputError message={errors.asset_no_inventaris} />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Jelaskan detail masalah/permintaan Anda. Sertakan informasi seperti: kapan terjadi, apa yang sudah dicoba, lokasi perangkat, dll."
                            rows={8}
                            className="min-h-40"
                            maxLength={10000}
                        />
                        <InputError message={errors.description} />
                    </div>

                    {/* Lampiran */}
                    <div className="grid gap-2">
                        <Label htmlFor="attachments" className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Lampiran foto / dokumen (opsional)
                        </Label>
                        <Input
                            id="attachments"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/gif,image/webp,.zip"
                            className="cursor-pointer"
                            onChange={(e) => {
                                const picked = e.target.files ? Array.from(e.target.files) : [];
                                const next = [...data.attachments];
                                for (const file of picked) {
                                    if (next.length >= 10) {
                                        break;
                                    }
                                    next.push(file);
                                }
                                setData('attachments', next);
                                e.target.value = '';
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maksimal 10 file, tiap file maks. 10 MB. PDF, Word, Excel, gambar (JPG, PNG, GIF, WebP), atau ZIP.
                        </p>
                        {data.attachments.length > 0 && (
                            <ul className="space-y-2 rounded-md border p-2 text-sm">
                                {data.attachments.map((file, idx) => (
                                    <li
                                        key={`${file.name}-${file.size}-${idx}`}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span className="truncate text-muted-foreground">{file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() =>
                                                setData(
                                                    'attachments',
                                                    data.attachments.filter((_, i) => i !== idx)
                                                )
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Hapus {file.name}</span>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {attachmentFieldErrors.length > 0 && (
                            <ul className="text-sm text-destructive space-y-1">
                                {attachmentFieldErrors.map((msg) => (
                                    <li key={msg}>{msg}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Plan Proposal */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <div>
                            <p className="text-sm font-medium">Rencana Usulan (opsional)</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Isi ide, kebutuhan tools, dan estimasi anggaran jika tiket ini butuh perencanaan.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plan_ideas">Ide / pendekatan</Label>
                            <Textarea
                                id="plan_ideas"
                                value={data.plan_ideas}
                                onChange={(e) => setData('plan_ideas', e.target.value)}
                                placeholder="Contoh: integrasi notifikasi WA, pemecahan tahap implementasi, dll."
                                rows={4}
                                maxLength={10000}
                            />
                            <InputError message={errors.plan_ideas} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plan_tools">Tools / kebutuhan</Label>
                            <Textarea
                                id="plan_tools"
                                value={data.plan_tools}
                                onChange={(e) => setData('plan_tools', e.target.value)}
                                placeholder="Contoh: server tambahan, lisensi, vendor, kebutuhan SDM."
                                rows={4}
                                maxLength={10000}
                            />
                            <InputError message={errors.plan_tools} />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="budget_estimate">Estimasi biaya (Rp)</Label>
                                <Input
                                    id="budget_estimate"
                                    type="number"
                                    min={0}
                                    value={data.budget_estimate}
                                    onChange={(e) => setData('budget_estimate', e.target.value)}
                                    placeholder="Contoh: 15000000"
                                />
                                <InputError message={errors.budget_estimate} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="budget_notes">Catatan anggaran</Label>
                                <Textarea
                                    id="budget_notes"
                                    value={data.budget_notes}
                                    onChange={(e) => setData('budget_notes', e.target.value)}
                                    placeholder="Contoh: rentang 10-15 juta tergantung vendor."
                                    rows={3}
                                    maxLength={5000}
                                />
                                <InputError message={errors.budget_notes} />
                            </div>
                        </div>
                    </div>

                    {/* Tanggal & waktu lapor (backdate) */}
                    <div className="grid gap-2">
                        <Label htmlFor="created_at">
                            Tanggal & waktu lapor (opsional)
                        </Label>
                        <Input
                            id="created_at"
                            type="datetime-local"
                            value={data.created_at}
                            onChange={(e) => setData('created_at', e.target.value)}
                            className="max-w-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                            Kosongkan = waktu sekarang. Isi jika tiket dilaporkan/terjadi di waktu lalu (backdate).
                        </p>
                        <InputError message={errors.created_at} />
                    </div>

                    {/* Development Notice */}
                    {selectedCategory?.is_development && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950">
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                                Kategori Pengembangan
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                                Tiket ini masuk kategori pengembangan sistem. Tidak ada SLA otomatis.
                                Admin akan menentukan target penyelesaian setelah analisis.
                            </p>
                        </div>
                    )}

                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="is_draft"
                            checked={data.is_draft}
                            onCheckedChange={(checked) => setData('is_draft', !!checked)}
                        />
                        <div className="grid gap-1">
                            <Label htmlFor="is_draft" className="cursor-pointer">
                                Simpan sebagai draf (tanpa SLA & notifikasi)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Draf hanya terlihat oleh Anda dan admin. Publikasikan saat sudah siap dikerjakan tim.
                            </p>
                            <InputError message={errors.is_draft} />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : data.is_draft ? 'Simpan Draf' : 'Buat Tiket'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/tickets">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
