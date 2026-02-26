export type BlockType =
    | 'text'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'bulleted-list'
    | 'numbered-list'
    | 'todo-list'
    | 'toggle-list'
    | 'callout'
    | 'table';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    checked?: boolean;
    expanded?: boolean;
    children?: string;
    tableData?: string[][];
}

export interface Note {
    id: string;
    title: string;
    icon: string;
    blocks: Block[];
    createdAt: string;
    updatedAt: string;
}

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
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
