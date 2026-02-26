import { Head } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { NotesList } from '@/components/notes/NotesList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Note } from '@/types/note';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Catatan Kerja', href: '/catatan' },
];

const SAVE_DEBOUNCE_MS = 1000;

/** Map API response ke tipe Note (blocks, createdAt, updatedAt) */
function apiNoteToNote(raw: {
    id: string;
    title: string;
    icon: string;
    content?: unknown[];
    created_at: string;
    updated_at: string;
}): Note {
    return {
        id: String(raw.id),
        title: raw.title,
        icon: raw.icon ?? '📄',
        blocks: Array.isArray(raw.content) ? (raw.content as Note['blocks']) : [],
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
    };
}

type Props = {
    notes: Note[];
    selectedNote: Note | null;
};

export default function CatatanIndex({ notes, selectedNote }: Props) {
    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [selectedId, setSelectedId] = useState<string | null>(
        () => selectedNote?.id ?? notes[0]?.id ?? null
    );
    const [localNote, setLocalNote] = useState<Note | null>(selectedNote);
    const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const displayNote =
        localNote?.id === selectedId
            ? localNote
            : localNotes.find((n) => n.id === selectedId) ?? null;

    useEffect(() => {
        setLocalNotes(notes);
        setSelectedId((prev) => selectedNote?.id ?? prev ?? notes[0]?.id ?? null);
        if (selectedNote) setLocalNote(selectedNote);
    }, [notes, selectedNote?.id, selectedNote]);

    const scheduleSave = useCallback((note: Note) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            saveTimeoutRef.current = null;
            try {
                const res = await fetch(`/api/work-notes/${note.id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        title: note.title,
                        icon: note.icon,
                        content: note.blocks,
                    }),
                });
                if (!res.ok) return;
                const json = (await res.json()) as { data?: { updated_at: string } };
                const updatedAt = json.data?.updated_at;
                if (updatedAt) {
                    setLocalNote((prev) =>
                        prev && prev.id === note.id ? { ...prev, updatedAt } : prev
                    );
                    setLocalNotes((prev) =>
                        prev.map((n) =>
                            n.id === note.id ? { ...n, updatedAt } : n
                        )
                    );
                }
            } catch {
                // silent fail; bisa nanti tambah toast
            }
        }, SAVE_DEBOUNCE_MS);
    }, []);

    const handleUpdate = useCallback(
        (updated: Note) => {
            setLocalNote(updated);
            setLocalNotes((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
            );
            scheduleSave(updated);
        },
        [scheduleSave]
    );

    const handleSelect = useCallback((note: Note) => {
        setSelectedId(note.id);
        setLocalNote(note);
    }, []);

    const handleDeleteRequest = useCallback((note: Note) => {
        setDeleteTarget(note);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/work-notes/${deleteTarget.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                setDeleteLoading(false);
                return;
            }
            setLocalNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
            setSelectedId((prev) => {
                if (prev !== deleteTarget.id) return prev;
                const rest = localNotes.filter((n) => n.id !== deleteTarget.id);
                return rest[0]?.id ?? null;
            });
            setLocalNote((prev) => {
                if (!prev || prev.id !== deleteTarget.id) return prev;
                const rest = localNotes.filter((n) => n.id !== deleteTarget.id);
                return rest[0] ?? null;
            });
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    }, [deleteTarget, localNotes]);

    const handleAddNote = useCallback(async () => {
        try {
            const res = await fetch('/api/work-notes', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    title: 'Catatan Baru',
                    icon: '📄',
                }),
            });
            if (!res.ok) return;
            const json = (await res.json()) as { data?: Record<string, unknown> };
            const raw = json.data;
            if (!raw || typeof raw.id === 'undefined') return;
            const newNote = apiNoteToNote({
                id: String(raw.id),
                title: (raw.title as string) ?? 'Catatan Baru',
                icon: (raw.icon as string) ?? '📄',
                content: (raw.content as Note['blocks']) ?? [],
                created_at: (raw.created_at as string) ?? new Date().toISOString(),
                updated_at: (raw.updated_at as string) ?? new Date().toISOString(),
            });
            setLocalNotes((prev) => [newNote, ...prev]);
            setSelectedId(newNote.id);
            setLocalNote(newNote);
        } catch {
            // silent fail
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catatan Kerja" />
            {/* Full-bleed notes area seperti referensi (escape padding layout) */}
            <div className="-m-4 md:-m-6 flex h-[calc(100vh-var(--header-height,4rem))] min-h-[calc(100vh-7rem)] bg-background">
                <NotesList
                    notes={localNotes}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onAddNote={handleAddNote}
                />
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {displayNote ? (
                        <div
                            key={displayNote.id}
                            className="animate-fade-in"
                            style={{ animationDuration: '0.2s' }}
                        >
                            <NoteEditor
                                note={displayNote}
                                onUpdate={handleUpdate}
                                onDelete={handleDeleteRequest}
                            />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground animate-fade-in">
                            <div className="text-center">
                                <FileText className="mx-auto mb-3 h-10 w-10 opacity-20" />
                                <p className="text-sm font-medium">
                                    Pilih catatan
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground/60">
                                    atau buat catatan baru untuk memulai
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus catatan?"
                description="Catatan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
                confirmLabel="Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                loading={deleteLoading}
            />
        </AppLayout>
    );
}
