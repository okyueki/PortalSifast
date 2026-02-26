import { FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

interface NotesListProps {
    notes: Note[];
    selectedId: string | null;
    onSelect: (note: Note) => void;
    onAddNote: () => void;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function NotesList({ notes, selectedId, onSelect, onAddNote }: NotesListProps) {
    const [search, setSearch] = useState('');

    const filtered = notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex w-60 shrink-0 flex-col border-r border-border/60 bg-background">
            {/* Header — sama seperti referensi (tanpa border-b) */}
            <div className="px-3 pt-4 pb-2">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Catatan
                    </h2>
                    <button
                        type="button"
                        onClick={onAddNote}
                        className="rounded-md p-1 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
                        title="Catatan baru"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari catatan..."
                        className="h-8 w-full rounded-md border border-border/60 bg-accent/30 pl-8 pr-3 text-xs text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary/30 focus:bg-accent/50"
                    />
                </div>
            </div>
            {/* List — scrollbar-thin + padding seperti referensi */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1">
                {filtered.map((note, i) => (
                    <button
                        key={note.id}
                        type="button"
                        onClick={() => onSelect(note)}
                        className={cn(
                            'mb-0.5 block w-full rounded-md px-2.5 py-2 text-left transition-all duration-150',
                            selectedId === note.id
                                ? 'bg-accent text-foreground'
                                : 'text-foreground/80 hover:bg-accent/50'
                        )}
                        style={{ animationDelay: `${i * 30}ms` }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="shrink-0 text-sm">{note.icon}</span>
                            <span className="truncate text-[13px] font-medium">
                                {note.title}
                            </span>
                        </div>
                        <p className="ml-[1.625rem] mt-0.5 text-[11px] text-muted-foreground">
                            {formatDate(note.updatedAt)}
                        </p>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="px-3 py-8 text-center text-muted-foreground animate-fade-in">
                        <FileText className="mx-auto mb-2 h-7 w-7 opacity-30" />
                        <p className="text-xs">
                            {search ? 'Tidak ditemukan' : 'Belum ada catatan'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
