import { AlertTriangle, Clock, FileText, UserPlus, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Notification = {
    id: number;
    type: 'sla_warning' | 'overdue' | 'draft_reminder' | 'assignment';
    title: string;
    description: string;
    target_id: number;
    is_read: boolean;
    created_at: string;
};

type Props = {
    onUnreadCountChange?: (count: number) => void;
};

const typeConfig = {
    sla_warning: { icon: Clock, color: 'text-yellow-600', label: 'SLA Warning' },
    overdue: { icon: AlertTriangle, color: 'text-red-600', label: 'Overdue' },
    draft_reminder: { icon: FileText, color: 'text-blue-600', label: 'Draft' },
    assignment: { icon: UserPlus, color: 'text-green-600', label: 'Assignment' },
};

export function NotificationCenter({ onUnreadCountChange }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/notifications');
            const json = await res.json();
            setNotifications(json.data || []);
            onUnreadCountChange?.(json.unread_count || 0);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            setNotifications([]);
        }
        setLoading(false);
    }

    async function markAsRead(ids: number[]) {
        try {
            await fetch('/api/dashboard/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            setNotifications((prev) =>
                prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    return (
        <div className="space-y-3">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                    Loading...
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
            ) : (
                notifications.map((notif) => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={notif.id}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                                !notif.is_read && 'bg-primary/5 border-primary/20'
                            )}
                        >
                            <Icon className={cn('h-5 w-5 shrink-0', config.color)} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{notif.title}</p>
                                {notif.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {notif.description}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {new Date(notif.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            {!notif.is_read && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead([notif.id])}
                                >
                                    Read
                                </Button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}