import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil, ListTodo, Calendar, User } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const STATUS_LABELS: Record<string, string> = {
    planning: 'Perencanaan',
    in_progress: 'Sedang Berjalan',
    completed: 'Selesai',
    on_hold: 'Ditunda',
};

function formatDate(s: string | null): string {
    if (!s) return '–';
    return new Date(s).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

type TicketItem = {
    id: number;
    ticket_number: string;
    title: string;
    status?: { id: number; name: string } | null;
    priority?: { id: number; name: string } | null;
    type?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    requester?: { id: number; name: string } | null;
    assignee?: { id: number; name: string } | null;
    created_at: string;
};

type Project = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    dep_id: string | null;
    created_at: string;
    updated_at: string;
    createdBy?: { id: number; name: string } | null;
    created_by_user?: { id: number; name: string } | null;
    tickets: TicketItem[];
};

type Props = {
    project: Project;
};

export default function ProjectsShow({ project }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Rencana', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    const createdBy = project.createdBy ?? project.created_by_user;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/projects">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Heading
                            title={project.name}
                            description={project.description ?? undefined}
                            variant="small"
                        />
                    </div>
                    <Button asChild>
                        <Link href={`/projects/${project.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="rounded-full bg-muted px-2 py-0.5">
                                    {STATUS_LABELS[project.status] ?? project.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    Mulai: {formatDate(project.start_date)} · Selesai:{' '}
                                    {formatDate(project.end_date)}
                                </span>
                            </div>
                            {createdBy && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>Dibuat oleh: {createdBy.name}</span>
                                </div>
                            )}
                            {project.dep_id && (
                                <div className="text-muted-foreground">
                                    Departemen: {project.dep_id}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListTodo className="h-4 w-4" />
                            Tiket dalam project ({project.tickets.length})
                        </CardTitle>
                        <Button size="sm" asChild>
                            <Link href={`/tickets/create?project_id=${project.id}`}>
                                Tambah Tiket
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {project.tickets.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Belum ada tiket dalam project ini. Tambah tiket dari form buat tiket
                                dan pilih project ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 font-medium">No</th>
                                            <th className="py-2 font-medium">Judul</th>
                                            <th className="py-2 font-medium">Status</th>
                                            <th className="py-2 font-medium">Prioritas</th>
                                            <th className="py-2 font-medium">Assignee</th>
                                            <th className="py-2 font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="py-2 font-mono text-muted-foreground">
                                                    {t.ticket_number}
                                                </td>
                                                <td className="py-2">
                                                    <Link
                                                        href={`/tickets/${t.id}`}
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {t.title}
                                                    </Link>
                                                </td>
                                                <td className="py-2">
                                                    {t.status?.name ?? '–'}
                                                </td>
                                                <td className="py-2">
                                                    {t.priority?.name ?? '–'}
                                                </td>
                                                <td className="py-2 text-muted-foreground">
                                                    {t.assignee?.name ?? '–'}
                                                </td>
                                                <td className="py-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/tickets/${t.id}`}>
                                                            Lihat
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
