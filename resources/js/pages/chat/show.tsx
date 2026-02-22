import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Send, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useWebSocketStatus } from '@/hooks/use-websocket-status';

type Message = {
    id: number;
    body: string;
    user_id: number;
    user_name: string;
    created_at: string;
    is_mine: boolean;
};

type Conversation = {
    id: number;
    display_name: string;
    other_participant: { id: number; name: string } | null;
};

type Props = {
    conversation: Conversation;
    messages: Message[];
};

export default function ChatShow({ conversation: initialConversation, messages: initialMessages }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; name: string } } };
    const currentUserId = auth.user?.id ?? 0;
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const wsStatus = useWebSocketStatus();
    const bottomRef = useRef<HTMLDivElement>(null);
    const form = useForm({ body: '' });

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialConversation.id, initialMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const echo = (window as unknown as { Echo?: { private: (ch: string) => { listen: (e: string, c: (data: Message) => void) => void } } }).Echo;
        if (!echo) return;
        try {
            const channel = echo.private(`conversation.${initialConversation.id}`);
            const handler = (data: Message & { conversation_id?: number }) => {
                const msg: Message = {
                    id: data.id,
                    body: data.body,
                    user_id: data.user_id,
                    user_name: data.user_name,
                    created_at: data.created_at,
                    is_mine: data.user_id === currentUserId,
                };
                setMessages((prev) => [...prev, msg]);
            };
            channel.listen('.message.sent', handler);
            return () => {
                try {
                    channel.stopListening('.message.sent');
                } catch {
                    // ignore when Reverb/Echo sudah putus
                }
            };
        } catch {
            // Reverb/Echo tidak tersedia: chat tetap jalan, hanya tanpa update real-time
        }
    }, [initialConversation.id, currentUserId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.data.body.trim()) {
            form.post(`/chat/${initialConversation.id}/messages`, {
                preserveScroll: true,
                onSuccess: () => form.reset('body'),
                progress: false, // Jangan tampilkan progress bar saat kirim pesan (realtime, respons cepat)
            });
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
        <AppLayout>
            <Head title={`Chat - ${initialConversation.display_name}`} />
            <div className="mx-auto flex max-w-2xl flex-col rounded-xl border bg-card" style={{ minHeight: '70vh' }}>
                <div className="flex items-center gap-4 border-b p-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/chat">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-foreground">
                            {initialConversation.display_name}
                        </h2>
                    </div>
                </div>

                {wsStatus.state !== 'connected' && wsStatus.state !== 'initializing' && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
                        <WifiOff className="h-4 w-4 shrink-0" />
                        <span>Real-time tidak aktif. Pesan tetap tersimpan; refresh halaman untuk melihat pesan terbaru.</span>
                    </div>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    m.is_mine
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                {!m.is_mine && (
                                    <p className="mb-0.5 text-xs font-medium opacity-90">
                                        {m.user_name}
                                    </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                <p
                                    className={`mt-1 text-xs ${
                                        m.is_mine ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                    }`}
                                >
                                    {formatTime(m.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSubmit} className="border-t p-4">
                    <div className="flex gap-2">
                        <Input
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                            placeholder="Ketik pesan..."
                            className="flex-1"
                            maxLength={5000}
                            disabled={form.processing}
                        />
                        <Button type="submit" size="icon" disabled={form.processing || !form.data.body.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    {form.errors.body && (
                        <p className="mt-1 text-sm text-destructive">{form.errors.body}</p>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
