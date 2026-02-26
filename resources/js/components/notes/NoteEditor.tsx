import { Plus, Trash2 } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import { Button } from '@/components/ui/button';
import type { Block, BlockType, Note } from '@/types/note';

interface NoteEditorProps {
    note: Note;
    onUpdate: (note: Note) => void;
    onDelete?: (note: Note) => void;
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function NoteEditor({ note, onUpdate, onDelete }: NoteEditorProps) {
    const updateBlock = (updated: Block) => {
        const newBlocks = note.blocks.map((b) =>
            b.id === updated.id ? updated : b
        );
        onUpdate({
            ...note,
            blocks: newBlocks,
            updatedAt: new Date().toISOString(),
        });
    };

    const deleteBlock = (blockId: string) => {
        if (note.blocks.length <= 1) return;
        const newBlocks = note.blocks.filter((b) => b.id !== blockId);
        onUpdate({
            ...note,
            blocks: newBlocks,
            updatedAt: new Date().toISOString(),
        });
    };

    const addBlockBelow = (blockId: string, type: BlockType) => {
        const idx = note.blocks.findIndex((b) => b.id === blockId);
        const newBlock: Block = {
            id: String(Date.now()),
            type,
            content: '',
            ...(type === 'todo-list' && { checked: false }),
            ...(type === 'toggle-list' && {
                expanded: false,
                children: '',
            }),
            ...(type === 'table' && {
                tableData: [
                    ['Kolom 1', 'Kolom 2', 'Kolom 3'],
                    ['', '', ''],
                    ['', '', ''],
                ],
            }),
        };
        const newBlocks = [...note.blocks];
        newBlocks.splice(idx + 1, 0, newBlock);
        onUpdate({
            ...note,
            blocks: newBlocks,
            updatedAt: new Date().toISOString(),
        });
    };

    const addBlockAtEnd = () => {
        const newBlock: Block = {
            id: String(Date.now()),
            type: 'text',
            content: '',
        };
        onUpdate({
            ...note,
            blocks: [...note.blocks, newBlock],
            updatedAt: new Date().toISOString(),
        });
    };

    const handleTitleChange = (e: React.FocusEvent<HTMLHeadingElement>) => {
        onUpdate({
            ...note,
            title: e.currentTarget.textContent || 'Tanpa Judul',
            updatedAt: new Date().toISOString(),
        });
    };

    let numberedCounter = 0;

    return (
        <div className="mx-auto max-w-[720px] px-8 py-12 animate-fade-in">
            {/* Cover icon + aksi (hapus) */}
            <div className="mb-4 flex items-start justify-between gap-4">
                <span className="inline-block cursor-pointer text-5xl transition-transform duration-200 hover:scale-110">
                    {note.icon}
                </span>
                {onDelete && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(note)}
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Hapus catatan
                    </Button>
                )}
            </div>
            {/* Judul */}
            <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleChange}
                data-placeholder="Tanpa Judul"
                className="caret-foreground mb-1 text-[2.5rem] font-bold leading-[1.2] text-foreground outline-none"
            >
                {note.title}
            </h1>
            <p className="mb-10 text-[11px] tracking-wide text-muted-foreground/60">
                Terakhir diubah {formatDateTime(note.updatedAt)}
            </p>
            {/* Separator */}
            <div className="mb-6 h-px bg-border/40" />
            {/* Blok-blok */}
            <div className="space-y-[1px]">
                {note.blocks.map((block, index) => {
                    let numberedIndex: number | undefined;
                    if (block.type === 'numbered-list') {
                        numberedCounter++;
                        numberedIndex = numberedCounter;
                    } else {
                        numberedCounter = 0;
                    }
                    return (
                        <BlockRenderer
                            key={block.id}
                            block={block}
                            index={index}
                            numberedIndex={numberedIndex}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            onAddBelow={addBlockBelow}
                        />
                    );
                })}
            </div>
            {/* Tambah blok — seperti referensi */}
            <button
                type="button"
                onClick={addBlockAtEnd}
                className="group mt-6 flex items-center gap-2 py-2 text-[13px] text-muted-foreground/40 transition-all duration-200 hover:text-muted-foreground"
            >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                <span>Klik untuk menambah blok baru</span>
            </button>
            <div className="h-40" />
        </div>
    );
}
