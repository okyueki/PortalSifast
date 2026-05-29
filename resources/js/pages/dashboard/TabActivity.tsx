import { useState } from 'react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    onNotificationCountChange?: (count: number) => void;
};

export default function TabActivity({ onNotificationCountChange }: Props) {
    const [activityFilter, setActivityFilter] = useState('all');

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Activity Feed - 60% */}
            <Card className="lg:col-span-3">
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <CardTitle>Activity Feed</CardTitle>
                        <select
                            value={activityFilter}
                            onChange={(e) => setActivityFilter(e.target.value)}
                            className="rounded-md border bg-background px-3 py-1 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="ticket_update">Ticket Updates</option>
                            <option value="user_action">User Actions</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ActivityFeed filter={activityFilter} />
                </CardContent>
            </Card>

            {/* Notification Center - 40% */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <NotificationCenter
                        onUnreadCountChange={onNotificationCountChange}
                    />
                </CardContent>
            </Card>
        </div>
    );
}