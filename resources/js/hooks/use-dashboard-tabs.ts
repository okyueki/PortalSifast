import { useState } from 'react';

type Tab = 'overview' | 'analytics' | 'activity';

export function useDashboardTabs() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [notificationCount, setNotificationCount] = useState(0);

    return {
        activeTab,
        setActiveTab,
        notificationCount,
        setNotificationCount
    };
}