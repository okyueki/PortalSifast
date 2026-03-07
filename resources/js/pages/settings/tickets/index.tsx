import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Master Tiket', href: '/settings/tickets' },
];

type Department = {
    dep_id: string;
    nama: string;
};

type TicketType = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
};

type TicketCategory = {
    id: number;
    name: string;
    ticket_type_id: number;
    dep_id: string;
    is_development: boolean;
    is_active: boolean;
    type?: TicketType;
};

type TicketPriority = {
    id: number;
    name: string;
    level: number;
    color: string;
    response_hours: number | null;
    resolution_hours: number | null;
    is_active: boolean;
};

type TicketStatus = {
    id: number;
    name: string;
    slug: string;
    color: string;
    order: number;
    is_closed: boolean;
    is_active: boolean;
};

type TicketTag = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
};

type Props = {
    types: TicketType[];
    categories: TicketCategory[];
    priorities: TicketPriority[];
    statuses: TicketStatus[];
    tags: TicketTag[];
    departments: Department[];
};

type Tab = 'types' | 'categories' | 'priorities' | 'statuses' | 'tags';

export default function TicketSettingsIndex({
    types,
    categories,
    priorities,
    statuses,
    tags,
    departments,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('categories');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<unknown>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: Tab; id: number } | null>(null);

    // Form for types
    const typeForm = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    // Form for categories
    const categoryForm = useForm({
        name: '',
        ticket_type_id: '',
        dep_id: '',
        is_development: false,
        is_active: true,
    });

    // Form for priorities
    const priorityForm = useForm({
        name: '',
        level: 1,
        color: 'blue',
        response_hours: '',
        resolution_hours: '',
        is_active: true,
    });

    // Form for statuses
    const statusForm = useForm({
        name: '',
        slug: '',
        color: 'blue',
        order: 1,
        is_closed: false,
        is_active: true,
    });

    // Form for tags
    const tagForm = useForm({
        name: '',
        slug: '',
        is_active: true,
    });

    const openCreateDialog = () => {
        setEditingItem(null);
        resetForms();
        setDialogOpen(true);
    };

    const openEditDialog = (item: unknown, tab: Tab) => {
        setEditingItem(item);
        if (tab === 'types') {
            const t = item as TicketType;
            typeForm.setData({
                name: t.name,
                description: t.description || '',
                is_active: t.is_active,
            });
        } else if (tab === 'categories') {
            const c = item as TicketCategory;
            categoryForm.setData({
                name: c.name,
                ticket_type_id: String(c.ticket_type_id),
                dep_id: c.dep_id,
                is_development: c.is_development,
                is_active: c.is_active,
            });
        } else if (tab === 'priorities') {
            const p = item as TicketPriority;
            priorityForm.setData({
                name: p.name,
                level: p.level,
                color: p.color,
                response_hours: p.response_hours ? String(p.response_hours) : '',
                resolution_hours: p.resolution_hours ? String(p.resolution_hours) : '',
                is_active: p.is_active,
            });
        } else if (tab === 'statuses') {
            const s = item as TicketStatus;
            statusForm.setData({
                name: s.name,
                slug: s.slug,
                color: s.color,
                order: s.order,
                is_closed: s.is_closed,
                is_active: s.is_active,
            });
        } else if (tab === 'tags') {
            const t = item as TicketTag;
            tagForm.setData({
                name: t.name,
                slug: t.slug,
                is_active: t.is_active,
            });
        }
        setDialogOpen(true);
    };

    const resetForms = () => {
        typeForm.reset();
        categoryForm.reset();
        priorityForm.reset();
        statusForm.reset();
        tagForm.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (activeTab === 'types') {
            if (editingItem) {
                typeForm.put(`/settings/ticket-types/${(editingItem as TicketType).id}`, {
                    onSuccess: () => setDialogOpen(false),
                });
            } else {
                typeForm.post('/settings/ticket-types', {
                    onSuccess: () => setDialogOpen(false),
                });
            }
        } else if (activeTab === 'categories') {
            if (editingItem) {
                categoryForm.put(`/settings/ticket-categories/${(editingItem as TicketCategory).id}`, {
                    onSuccess: () => setDialogOpen(false),
                });
            } else {
                categoryForm.post('/settings/ticket-categories', {
                    onSuccess: () => setDialogOpen(false),
                });
            }
        } else if (activeTab === 'priorities') {
            if (editingItem) {
                priorityForm.put(`/settings/ticket-priorities/${(editingItem as TicketPriority).id}`, {
                    onSuccess: () => setDialogOpen(false),
                });
            } else {
                priorityForm.post('/settings/ticket-priorities', {
                    onSuccess: () => setDialogOpen(false),
                });
            }
        } else if (activeTab === 'statuses') {
            if (editingItem) {
                statusForm.put(`/settings/ticket-statuses/${(editingItem as TicketStatus).id}`, {
                    onSuccess: () => setDialogOpen(false),
                });
            } else {
                statusForm.post('/settings/ticket-statuses', {
                    onSuccess: () => setDialogOpen(false),
                });
            }
        } else if (activeTab === 'tags') {
            if (editingItem) {
                tagForm.put(`/settings/ticket-tags/${(editingItem as TicketTag).id}`, {
                    onSuccess: () => setDialogOpen(false),
                });
            } else {
                tagForm.post('/settings/ticket-tags', {
                    onSuccess: () => setDialogOpen(false),
                });
            }
        }
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;

        const urlMap = {
            types: '/settings/ticket-types',
            categories: '/settings/ticket-categories',
            priorities: '/settings/ticket-priorities',
            statuses: '/settings/ticket-statuses',
            tags: '/settings/ticket-tags',
        };

        router.delete(`${urlMap[deleteConfirm.type]}/${deleteConfirm.id}`, {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const tabLabels: Record<Tab, string> = {
        types: 'Tipe Tiket',
        categories: 'Kategori',
        priorities: 'Prioritas',
        statuses: 'Status',
        tags: 'Tag',
    };

    const getDialogTitle = () => {
        const action = editingItem ? 'Edit' : 'Tambah';
        return `${action} ${tabLabels[activeTab]}`;
    };

    const colorOptions = [
        { value: 'blue', label: 'Biru' },
        { value: 'green', label: 'Hijau' },
        { value: 'yellow', label: 'Kuning' },
        { value: 'orange', label: 'Oranye' },
        { value: 'red', label: 'Merah' },
        { value: 'purple', label: 'Ungu' },
        { value: 'gray', label: 'Abu-abu' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Tiket" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Master Tiket"
                        description="Kelola data master untuk sistem tiket"
                    />
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah {tabLabels[activeTab]}
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                    {(Object.keys(tabLabels) as Tab[]).map((tab) => (
                        <Button
                            key={tab}
                            variant={activeTab === tab ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab(tab)}
                            className="flex-1"
                        >
                            {tabLabels[tab]}
                        </Button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-xl border bg-card">
                    {activeTab === 'types' && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {types.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">{type.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {type.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={type.is_active ? 'default' : 'secondary'}>
                                                {type.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(type, 'types')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteConfirm({ type: 'types', id: type.id })}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === 'categories' && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Pengembangan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>{cat.type?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{cat.dep_id}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {cat.is_development ? (
                                                <Badge variant="secondary">Ya</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                                                {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(cat, 'categories')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteConfirm({ type: 'categories', id: cat.id })}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === 'priorities' && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Warna</TableHead>
                                    <TableHead>Response (jam)</TableHead>
                                    <TableHead>Resolusi (jam)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {priorities.map((priority) => (
                                    <TableRow key={priority.id}>
                                        <TableCell>{priority.level}</TableCell>
                                        <TableCell className="font-medium">{priority.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            priority.color === 'red'
                                                                ? '#ef4444'
                                                                : priority.color === 'orange'
                                                                ? '#f97316'
                                                                : priority.color === 'yellow'
                                                                ? '#eab308'
                                                                : priority.color === 'green'
                                                                ? '#22c55e'
                                                                : priority.color === 'blue'
                                                                ? '#3b82f6'
                                                                : priority.color === 'purple'
                                                                ? '#a855f7'
                                                                : '#6b7280',
                                                    }}
                                                />
                                                {priority.color}
                                            </div>
                                        </TableCell>
                                        <TableCell>{priority.response_hours || '-'}</TableCell>
                                        <TableCell>{priority.resolution_hours || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={priority.is_active ? 'default' : 'secondary'}>
                                                {priority.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(priority, 'priorities')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteConfirm({ type: 'priorities', id: priority.id })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === 'statuses' && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Urutan</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Warna</TableHead>
                                    <TableHead>Closed</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statuses.map((status) => (
                                    <TableRow key={status.id}>
                                        <TableCell>{status.order}</TableCell>
                                        <TableCell className="font-medium">{status.name}</TableCell>
                                        <TableCell className="font-mono text-sm">{status.slug}</TableCell>
                                        <TableCell>
                                            <Badge
                                                style={{
                                                    backgroundColor:
                                                        status.color === 'red'
                                                            ? '#ef4444'
                                                            : status.color === 'orange'
                                                            ? '#f97316'
                                                            : status.color === 'yellow'
                                                            ? '#eab308'
                                                            : status.color === 'green'
                                                            ? '#22c55e'
                                                            : status.color === 'blue'
                                                            ? '#3b82f6'
                                                            : status.color === 'purple'
                                                            ? '#a855f7'
                                                            : '#6b7280',
                                                    color: 'white',
                                                }}
                                            >
                                                {status.color}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {status.is_closed ? (
                                                <Badge variant="secondary">Ya</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.is_active ? 'default' : 'secondary'}>
                                                {status.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(status, 'statuses')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteConfirm({ type: 'statuses', id: status.id })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === 'tags' && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.map((tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell className="font-medium">{tag.name}</TableCell>
                                        <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
                                        <TableCell>
                                            <Badge variant={tag.is_active ? 'default' : 'secondary'}>
                                                {tag.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(tag, 'tags')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteConfirm({ type: 'tags', id: tag.id })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? 'Ubah data di bawah ini.' : 'Isi data di bawah ini.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'types' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        value={typeForm.data.name}
                                        onChange={(e) => typeForm.setData('name', e.target.value)}
                                    />
                                    <InputError message={typeForm.errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea
                                        id="description"
                                        value={typeForm.data.description}
                                        onChange={(e) => typeForm.setData('description', e.target.value)}
                                    />
                                    <InputError message={typeForm.errors.description} />
                                </div>
                            </>
                        )}

                        {activeTab === 'categories' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        value={categoryForm.data.name}
                                        onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    />
                                    <InputError message={categoryForm.errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ticket_type_id">Tipe Tiket</Label>
                                    <Select
                                        value={categoryForm.data.ticket_type_id}
                                        onValueChange={(v) => categoryForm.setData('ticket_type_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((type) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={categoryForm.errors.ticket_type_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dep_id">Departemen</Label>
                                    <Select
                                        value={categoryForm.data.dep_id}
                                        onValueChange={(v) => categoryForm.setData('dep_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih departemen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.dep_id} value={dept.dep_id}>
                                                    {dept.nama} ({dept.dep_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={categoryForm.errors.dep_id} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_development"
                                        checked={categoryForm.data.is_development}
                                        onChange={(e) =>
                                            categoryForm.setData('is_development', e.target.checked)
                                        }
                                    />
                                    <Label htmlFor="is_development">Kategori Pengembangan</Label>
                                </div>
                            </>
                        )}

                        {activeTab === 'priorities' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input
                                            id="name"
                                            value={priorityForm.data.name}
                                            onChange={(e) => priorityForm.setData('name', e.target.value)}
                                        />
                                        <InputError message={priorityForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="level">Level</Label>
                                        <Input
                                            id="level"
                                            type="number"
                                            min={1}
                                            value={priorityForm.data.level}
                                            onChange={(e) =>
                                                priorityForm.setData('level', parseInt(e.target.value))
                                            }
                                        />
                                        <InputError message={priorityForm.errors.level} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="color">Warna</Label>
                                    <Select
                                        value={priorityForm.data.color}
                                        onValueChange={(v) => priorityForm.setData('color', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colorOptions.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="response_hours">Response (jam)</Label>
                                        <Input
                                            id="response_hours"
                                            type="number"
                                            min={0}
                                            value={priorityForm.data.response_hours}
                                            onChange={(e) =>
                                                priorityForm.setData('response_hours', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="resolution_hours">Resolusi (jam)</Label>
                                        <Input
                                            id="resolution_hours"
                                            type="number"
                                            min={0}
                                            value={priorityForm.data.resolution_hours}
                                            onChange={(e) =>
                                                priorityForm.setData('resolution_hours', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'statuses' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama</Label>
                                        <Input
                                            id="name"
                                            value={statusForm.data.name}
                                            onChange={(e) => statusForm.setData('name', e.target.value)}
                                        />
                                        <InputError message={statusForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="slug">Slug</Label>
                                        <Input
                                            id="slug"
                                            value={statusForm.data.slug}
                                            onChange={(e) => statusForm.setData('slug', e.target.value)}
                                        />
                                        <InputError message={statusForm.errors.slug} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="color">Warna</Label>
                                        <Select
                                            value={statusForm.data.color}
                                            onValueChange={(v) => statusForm.setData('color', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {colorOptions.map((c) => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="order">Urutan</Label>
                                        <Input
                                            id="order"
                                            type="number"
                                            min={1}
                                            value={statusForm.data.order}
                                            onChange={(e) =>
                                                statusForm.setData('order', parseInt(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_closed"
                                        checked={statusForm.data.is_closed}
                                        onChange={(e) => statusForm.setData('is_closed', e.target.checked)}
                                    />
                                    <Label htmlFor="is_closed">Status Closed (tiket selesai)</Label>
                                </div>
                            </>
                        )}

                        {activeTab === 'tags' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        value={tagForm.data.name}
                                        onChange={(e) => tagForm.setData('name', e.target.value)}
                                    />
                                    <InputError message={tagForm.errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug (opsional)</Label>
                                    <Input
                                        id="slug"
                                        value={tagForm.data.slug}
                                        onChange={(e) => tagForm.setData('slug', e.target.value)}
                                        placeholder="Akan di-generate otomatis dari nama jika kosong"
                                    />
                                    <InputError message={tagForm.errors.slug} />
                                </div>
                            </>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={
                                activeTab === 'types' ? typeForm.processing :
                                activeTab === 'categories' ? categoryForm.processing :
                                activeTab === 'priorities' ? priorityForm.processing :
                                activeTab === 'statuses' ? statusForm.processing :
                                tagForm.processing
                            }>
                                {editingItem ? 'Simpan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data ini? Data yang sudah dihapus tidak bisa dikembalikan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
