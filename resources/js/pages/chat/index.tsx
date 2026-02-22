import { Head, Link, useForm } from '@inertiajs/react';
import { MessageCircle, Plus, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import AppLayout from '@/layouts/app-layout';

type ConversationItem = {
    id: number;
    display_name: string;
    other_participant: { id: number; name: string } | null;
    last_message: {
        body: string;
        created_at: string;
        is_mine: boolean;
    } | null;
    updated_at: string;
};

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    conversations: ConversationItem[];
    users: UserOption[];
};

export default function ChatIndex({ conversations, users }: Props) {
    const [open, setOpen] = useState(false);
    const form = useForm({ user_id: '' });

    const handleStartChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.data.user_id) {
            form.post('/chat', {
                onSuccess: () => {
                    setOpen(false);
                    form.reset('user_id');
                },
            });
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <AppLayout>
            <Head title="Chat" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Chat</h1>
                        <p className="text-muted-foreground">Percakapan dengan rekan</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Chat baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Mulai percakapan</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleStartChat} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">Pilih user</Label>
                                    <Select
                                        value={form.data.user_id}
                                        onValueChange={(v) => form.setData('user_id', v)}
                                    >
                                        <SelectTrigger id="user_id">
                                            <SelectValue placeholder="Pilih user..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.user_id && (
                                        <p className="text-sm text-destructive">{form.errors.user_id}</p>
                                    )}
                                </div>
                                <Button type="submit" disabled={form.processing}>
                                    Mulai chat
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border bg-card">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageCircle className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Belum ada percakapan</p>
                            <p className="text-sm text-muted-foreground">
                                Klik &quot;Chat baru&quot; untuk memulai
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {conversations.map((c) => (
                                <li key={c.id}>
                                    <Link
                                        href={`/chat/${c.id}`}
                                        className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground">
                                                {c.display_name}
                                            </p>
                                            {c.last_message && (
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {c.last_message.is_mine && 'Anda: '}
                                                    {c.last_message.body}
                                                </p>
                                            )}
                                        </div>
                                        {c.last_message && (
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {formatTime(c.last_message.created_at)}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
