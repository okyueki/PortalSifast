import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Ticket as TicketType } from '@/types/ticket';
import TabActivity from './dashboard/TabActivity';
import TabAnalytics from './dashboard/TabAnalytics';
import TabOverview from './dashboard/TabOverview';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

type DashboardStats = {
    total_open: number;
    total_closed_month: number;
    overdue: number;
    assigned_to_me: number;
    unassigned: number;
    by_status: Record<string, number>;
    by_department: Record<string, number>;
};

type Props = {
    stats: DashboardStats;
    recentTickets: TicketType[];
    overdueTickets: TicketType[];
    unresolvedTickets: TicketType[];
    onlineUsers: {
        count: number;
        users: Array<{
            id: number;
            name: string;
            email: string;
            avatar_url?: string;
        }>;
    };
};

export default function Dashboard({
    stats,
    recentTickets,
    overdueTickets,
    unresolvedTickets,
}: Props) {
    const [activeTab, setActiveTab] = useState('overview');
    const [notificationCount, setNotificationCount] = useState(0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Selamat datang
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola tiket, pegawai, dan user akses aplikasi dari sini.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="activity">
                            Activity
                            {notificationCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {notificationCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <TabOverview
                            stats={stats}
                            recentTickets={recentTickets}
                            overdueTickets={overdueTickets}
                            unresolvedTickets={unresolvedTickets}
                        />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <TabAnalytics />
                    </TabsContent>

                    <TabsContent value="activity">
                        <TabActivity
                            onNotificationCountChange={setNotificationCount}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}