import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Activity = {
    id: number;
    user: { id: number; name: string; avatar_url?: string } | null;
    type: 'ticket_update' | 'user_action' | 'system';
    action: string;
    target: string;
    timestamp: string;
};

type Props = {
    filter?: string;
};

export function ActivityFeed({ filter = 'all' }: Props) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);

    const loadActivities = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ per_page: '20' });
        if (filter !== 'all') params.append('filter', filter);

        try {
            const res = await fetch(`/api/dashboard/activities?${params}`);
            const json = await res.json();
            setActivities(json.data || []);
            setCursor(json.next_cursor);
        } catch (error) {
            console.error('Failed to load activities:', error);
            setActivities([]);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    async function loadMore() {
        if (!cursor) return;
        try {
            const res = await fetch(
                `/api/dashboard/activities?page=${cursor}&per_page=20`
            );
            const json = await res.json();
            setActivities((prev) => [...prev, ...(json.data || [])]);
            setCursor(json.next_cursor);
        } catch (error) {
            console.error('Failed to load more:', error);
        }
    }

    const typeColors = {
        ticket_update:
            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        user_action:
            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                    Loading...
                </div>
            ) : activities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    Belum ada aktivitas
                </div>
            ) : (
                <>
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={activity.user?.avatar_url} />
                                <AvatarFallback>
                                    {activity.user?.name?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {activity.user?.name || 'System'}
                                    </span>
                                    <Badge
                                        className={cn(
                                            'text-xs',
                                            typeColors[activity.type]
                                        )}
                                    >
                                        {activity.action}
                                    </Badge>
                                </div>
                                <p className="truncate text-sm text-muted-foreground">
                                    {activity.target}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(
                                        activity.timestamp
                                    ).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    ))}

                    {cursor && (
                        <button
                            onClick={loadMore}
                            className="w-full rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground hover:bg-muted/50"
                        >
                            Load more
                        </button>
                    )}
                </>
            )}
        </div>
    );
}