import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block, BlockType, BLOCK_TYPES } from '@/types/note';

const BLOCK_TYPES_LIST: { type: BlockType; label: string; icon: string }[] = [
    { type: 'text', label: 'Teks', icon: 'T' },
    { type: 'h1', label: 'Heading 1', icon: 'H1' },
    { type: 'h2', label: 'Heading 2', icon: 'H2' },
    { type: 'h3', label: 'Heading 3', icon: 'H3' },
    { type: 'bulleted-list', label: 'Daftar Bullet', icon: '•' },
    { type: 'numbered-list', label: 'Daftar Nomor', icon: '1.' },
    { type: 'todo-list', label: 'Daftar Tugas', icon: '☑' },
    { type: 'toggle-list', label: 'Daftar Toggle', icon: '▶' },
    { type: 'callout', label: 'Callout', icon: '💡' },
    { type: 'table', label: 'Tabel', icon: '⊞' },
];

interface BlockRendererProps {
    block: Block;
    index: number;
    numberedIndex?: number;
    onUpdate: (block: Block) => void;
    onDelete: (blockId: string) => void;
    onAddBelow: (blockId: string, type: BlockType) => void;
}

const placeholders: Record<string, string> = {
    text: 'Tulis sesuatu...',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    'bulleted-list': 'Daftar item',
    'numbered-list': 'Daftar item',
    'todo-list': 'Tugas',
    'toggle-list': 'Toggle',
    callout: 'Tulis catatan penting...',
};

export function BlockRenderer({
    block,
    index,
    numberedIndex,
    onUpdate,
    onDelete,
    onAddBelow,
}: BlockRendererProps) {
    const [hovered, setHovered] = useState(false);

    const handleContentChange = (value: string) => {
        onUpdate({ ...block, content: value });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const listTypes: BlockType[] = [
                'todo-list',
                'bulleted-list',
                'numbered-list',
            ];
            onAddBelow(
                block.id,
                listTypes.includes(block.type) ? block.type : 'text'
            );
        }
        if (e.key === 'Backspace' && block.content === '') {
            e.preventDefault();
            onDelete(block.id);
        }
    };

    const handleTableCellChange = (row: number, col: number, value: string) => {
        if (!block.tableData) return;
        const newData = block.tableData.map((r, ri) =>
            r.map((c, ci) => (ri === row && ci === col ? value : c))
        );
        onUpdate({ ...block, tableData: newData });
    };

    const addTableRow = () => {
        if (!block.tableData) return;
        const cols = block.tableData[0]?.length ?? 3;
        onUpdate({
            ...block,
            tableData: [...block.tableData, Array(cols).fill('')],
        });
    };

    const addTableCol = () => {
        if (!block.tableData) return;
        onUpdate({
            ...block,
            tableData: block.tableData.map((r) => [...r, '']),
        });
    };

    const editableProps = {
        contentEditable: true,
        suppressContentEditableWarning: true,
        'data-placeholder': placeholders[block.type] ?? 'Tulis sesuatu...',
        onBlur: (e: React.FocusEvent<HTMLElement>) =>
            handleContentChange(e.currentTarget.textContent ?? ''),
        onKeyDown: handleKeyDown,
    };

    const renderBlock = () => {
        switch (block.type) {
            case 'h1':
                return (
                    <h1
                        {...editableProps}
                        className="py-1 text-[2rem] font-bold leading-tight text-foreground outline-none"
                    >
                        {block.content}
                    </h1>
                );
            case 'h2':
                return (
                    <h2
                        {...editableProps}
                        className="py-0.5 text-[1.5rem] font-semibold leading-tight text-foreground outline-none"
                    >
                        {block.content}
                    </h2>
                );
            case 'h3':
                return (
                    <h3
                        {...editableProps}
                        className="py-0.5 text-[1.15rem] font-semibold leading-tight text-foreground outline-none"
                    >
                        {block.content}
                    </h3>
                );
            case 'bulleted-list':
                return (
                    <div className="flex items-baseline gap-2 pl-0.5">
                        <span className="select-none text-lg leading-none text-muted-foreground">
                            •
                        </span>
                        <div
                            {...editableProps}
                            className="flex-1 leading-relaxed text-foreground outline-none"
                        >
                            {block.content}
                        </div>
                    </div>
                );
            case 'numbered-list':
                return (
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[1.25rem] shrink-0 text-right tabular-nums text-sm text-muted-foreground">
                            {numberedIndex !== undefined
                                ? `${numberedIndex}.`
                                : '1.'}
                        </span>
                        <div
                            {...editableProps}
                            className="flex-1 leading-relaxed text-foreground outline-none"
                        >
                            {block.content}
                        </div>
                    </div>
                );
            case 'todo-list':
                return (
                    <div className="flex items-start gap-2.5">
                        <Checkbox
                            checked={block.checked ?? false}
                            onCheckedChange={(checked) =>
                                onUpdate({
                                    ...block,
                                    checked: checked === true,
                                })
                            }
                            className="mt-[3px] transition-all duration-200"
                        />
                        <div
                            {...editableProps}
                            className={cn(
                                'flex-1 leading-relaxed outline-none transition-all duration-200',
                                block.checked
                                    ? 'text-muted-foreground/60 line-through'
                                    : 'text-foreground'
                            )}
                        >
                            {block.content}
                        </div>
                    </div>
                );
            case 'toggle-list':
                return (
                    <div className="rounded-md">
                        <button
                            type="button"
                            className="group/toggle flex w-full items-start gap-1.5 text-left"
                            onClick={() =>
                                onUpdate({
                                    ...block,
                                    expanded: !block.expanded,
                                })
                            }
                        >
                            <ChevronRight
                                className={cn(
                                    'mt-[2px] h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
                                    block.expanded && 'rotate-90'
                                )}
                            />
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                data-placeholder="Toggle"
                                className="flex-1 font-medium leading-relaxed text-foreground outline-none"
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) =>
                                    handleContentChange(
                                        e.currentTarget.textContent ?? ''
                                    )
                                }
                                onKeyDown={handleKeyDown}
                            >
                                {block.content}
                            </div>
                        </button>
                        <div
                            className={cn(
                                'ml-[26px] overflow-hidden transition-all duration-200 ease-out',
                                block.expanded
                                    ? 'mt-1 max-h-96 opacity-100'
                                    : 'max-h-0 opacity-0'
                            )}
                        >
                            <div className="border-border/60 border-l-2 py-1 pl-3">
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    data-placeholder="Konten toggle..."
                                    className="text-sm leading-relaxed text-muted-foreground outline-none"
                                    onBlur={(e) =>
                                        onUpdate({
                                            ...block,
                                            children:
                                                e.currentTarget.textContent ??
                                                '',
                                        })
                                    }
                                >
                                    {block.children}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'callout':
                return (
                    <div className="flex items-start gap-3 rounded-lg bg-accent/40 p-4 transition-colors duration-200">
                        <span className="mt-0.5 select-none text-lg">💡</span>
                        <div
                            {...editableProps}
                            className="flex-1 text-[0.9375rem] leading-relaxed text-foreground/90 outline-none"
                        >
                            {block.content}
                        </div>
                    </div>
                );
            case 'table':
                if (!block.tableData || block.tableData.length === 0)
                    return null;
                return (
                    <div className="overflow-hidden rounded-lg border border-border/60">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-accent/30 hover:bg-accent/30">
                                    {block.tableData[0].map((cell, ci) => (
                                        <TableHead
                                            key={ci}
                                            className="h-9 text-xs"
                                        >
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                className="font-semibold outline-none"
                                                onBlur={(e) =>
                                                    handleTableCellChange(
                                                        0,
                                                        ci,
                                                        e.currentTarget
                                                            .textContent ?? ''
                                                    )
                                                }
                                            >
                                                {cell}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {block.tableData.slice(1).map((row, ri) => (
                                    <TableRow
                                        key={ri + 1}
                                        className="hover:bg-accent/20 transition-colors duration-100"
                                    >
                                        {row.map((cell, ci) => (
                                            <TableCell
                                                key={ci}
                                                className="py-2 text-sm"
                                            >
                                                <div
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    data-placeholder="—"
                                                    className="outline-none"
                                                    onBlur={(e) =>
                                                        handleTableCellChange(
                                                            ri + 1,
                                                            ci,
                                                            e.currentTarget
                                                                .textContent ??
                                                                ''
                                                        )
                                                    }
                                                >
                                                    {cell}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex gap-3 border-t border-border/40 bg-accent/10 px-3 py-1.5">
                            <button
                                type="button"
                                onClick={addTableRow}
                                className="text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                            >
                                + Baris
                            </button>
                            <button
                                type="button"
                                onClick={addTableCol}
                                className="text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                            >
                                + Kolom
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div
                        {...editableProps}
                        className="leading-relaxed text-foreground outline-none"
                    >
                        {block.content}
                    </div>
                );
        }
    };

    return (
        <div
            className="group relative -mx-10 rounded-sm px-10 py-[2px] transition-colors duration-100 hover:bg-accent/20"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                className={cn(
                    'absolute left-1 top-[3px] flex items-center gap-0 transition-all duration-150',
                    hovered ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'
                )}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="rounded-md p-1 text-muted-foreground/50 transition-colors duration-100 hover:bg-accent hover:text-muted-foreground"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-52 animate-in fade-in-0 zoom-in-95"
                    >
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Tipe Blok
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {BLOCK_TYPES_LIST.map((bt) => (
                            <DropdownMenuItem
                                key={bt.type}
                                className="cursor-pointer gap-3"
                                onClick={() => onAddBelow(block.id, bt.type)}
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent/60 font-mono text-xs text-muted-foreground">
                                    {bt.icon}
                                </span>
                                <span className="text-[13px]">{bt.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <button
                    type="button"
                    className="cursor-grab rounded-md p-1 text-muted-foreground/50 transition-colors duration-100 active:cursor-grabbing hover:bg-accent hover:text-muted-foreground"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="min-w-0">{renderBlock()}</div>
        </div>
    );
}
