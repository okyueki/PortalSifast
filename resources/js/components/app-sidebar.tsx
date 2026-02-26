import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Columns3,
    FileText,
    FolderCog,
    LayoutGrid,
    ListFilter,
    Package,
    Ticket,
    UserCircle,
    Users,
    Wifi,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Tiket',
        href: '/tickets',
        icon: Ticket,
    },
    {
        title: 'Papan Tiket',
        href: '/tickets/board',
        icon: Columns3,
    },
    {
        title: 'Status Tiket',
        href: '/tickets/statuses',
        icon: ListFilter,
    },
    {
        title: 'Catatan Kerja',
        href: '/catatan',
        icon: FileText,
    },
    {
        title: 'Laporan',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Daftar Pegawai',
        href: '/pegawai',
        icon: UserCircle,
    },
    {
        title: 'Inventaris',
        href: '/inventaris',
        icon: Package,
    },
    {
        title: 'User Online',
        href: '/users/online',
        icon: Wifi,
    },
    {
        title: 'Daftar User',
        href: '/users',
        icon: Users,
    },
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Master Tiket',
        href: '/settings/tickets',
        icon: FolderCog,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavMain items={settingsNavItems} label="Pengaturan" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
