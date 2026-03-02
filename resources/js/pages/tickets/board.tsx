import { Head, Link, router } from '@inertiajs/react';
import { LayoutGrid, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Ticket, TicketStatus as TicketStatusType } from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
    { title: 'Papan', href: '/tickets/board' },
];

function getStatusColor(color: string): string {
    const map: Record<string, string> = {
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        purple: 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/25 dark:text-purple-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return map[color] ?? map.gray;
}

function getPriorityColor(color: string): string {
    const map: Record<string, string> = {
        red: 'border-red-400/60 bg-red-500/15 text-red-700 dark:border-red-500/50 dark:bg-red-500/25 dark:text-red-300',
        orange: 'border-orange-400/60 bg-orange-500/15 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/25 dark:text-orange-300',
        yellow: 'border-yellow-400/60 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/25 dark:text-yellow-300',
        green: 'border-green-400/60 bg-green-500/15 text-green-700 dark:border-green-500/50 dark:bg-green-500/25 dark:text-green-300',
        blue: 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300',
        gray: 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300',
    };
    return map[color] ?? map.gray;
}

type StatusWithId = TicketStatusType & { id: number };

type Props = {
    tickets: Ticket[];
    statuses: StatusWithId[];
    canChangeStatus: boolean;
};

function TicketCard({
    ticket,
    canDrag,
    onDragStart,
}: {
    ticket: Ticket;
    canDrag: boolean;
    onDragStart: (id: number) => void;
}) {
    return (
        <div
            draggable={canDrag}
            onDragStart={(e) => {
                if (!canDrag) return;
                onDragStart(ticket.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(ticket.id));
            }}
            className={`rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-border ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            <Link href={`/tickets/${ticket.id}`} className="block" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-primary">
                        {ticket.ticket_number}
                    </span>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority?.color ?? 'gray')}>
                        {ticket.priority?.name ?? '-'}
                    </Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">
                    {ticket.title}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    {ticket.assignee?.name ?? 'Belum ditugaskan'}
                </p>
            </Link>
        </div>
    );
}

function KanbanColumn({
    status,
    tickets,
    canChangeStatus,
    onDragStart,
    onDrop,
    isDragging,
}: {
    status: StatusWithId;
    tickets: Ticket[];
    canChangeStatus: boolean;
    onDragStart: (id: number) => void;
    onDrop: (ticketId: number, statusId: number) => void;
    isDragging: boolean;
}) {
    const [dragOver, setDragOver] = useState(false);

    return (
        <div
            className={`flex w-72 flex-shrink-0 flex-col rounded-lg border border-border/60 bg-muted/30 p-3 transition-all ${dragOver ? 'ring-2 ring-primary/20 bg-accent/40' : ''}`}
            onDragOver={(e) => {
                e.preventDefault();
                if (canChangeStatus && isDragging) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!canChangeStatus) return;
                const id = e.dataTransfer.getData('text/plain');
                if (id) onDrop(Number(id), status.id);
            }}
        >
            <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span
                        className={`h-2 w-2 rounded-full border border-border ${
                            { blue: 'bg-blue-500', yellow: 'bg-yellow-500', green: 'bg-green-500', orange: 'bg-orange-500', purple: 'bg-purple-500', red: 'bg-red-500', gray: 'bg-slate-500' }[status.color] ?? 'bg-slate-500'
                        }`}
                    />
                    <h2 className="text-sm font-semibold text-foreground">{status.name}</h2>
                    <span className="text-xs text-muted-foreground">{tickets.length}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[calc(100vh-220px)]">
                {tickets.map((t) => (
                    <TicketCard
                        key={t.id}
                        ticket={t}
                        canDrag={canChangeStatus}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </div>
    );
}

export default function TicketsBoard({ tickets, statuses, canChangeStatus }: Props) {
    const [draggedId, setDraggedId] = useState<number | null>(null);

    const ticketsByStatus = statuses.map((s) => ({
        status: s,
        tickets: tickets.filter((t) => t.ticket_status_id === s.id),
    }));

    const handleDrop = (ticketId: number, newStatusId: number) => {
        const ticket = tickets.find((t) => t.id === ticketId);
        if (!ticket || ticket.ticket_status_id === newStatusId) {
            setDraggedId(null);
            return;
        }
        router.patch(`/tickets/${ticketId}`, { ticket_status_id: newStatusId }, { preserveScroll: true });
        setDraggedId(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Papan Tiket" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Papan Tiket
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Seret kartu ke kolom lain untuk mengubah status. Klik kartu untuk buka detail.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Kolom &quot;Selesai&quot; kosong karena tiket yang Anda tandai selesai otomatis pindah ke &quot;Menunggu Konfirmasi&quot;. Tiket yang sudah ditutup tampil di kolom &quot;Ditutup&quot;.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/tickets">Daftar Tiket</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/tickets/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Tiket
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4">
                    {ticketsByStatus.map(({ status, tickets: colTickets }) => (
                        <KanbanColumn
                            key={status.id}
                            status={status}
                            tickets={colTickets}
                            canChangeStatus={canChangeStatus}
                            onDragStart={setDraggedId}
                            onDrop={handleDrop}
                            isDragging={draggedId !== null}
                        />
                    ))}
                </div>

                {statuses.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada status. Atur di Master Tiket.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
