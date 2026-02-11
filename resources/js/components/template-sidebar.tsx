import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    UserCircle,
    Users,
    Settings,
    LayoutDashboard,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import { edit } from '@/routes/profile';
import { cn } from '@/lib/utils';
const APP_NAME = 'Sika';
const APP_SUBTITLE = 'Panel Admin';

const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { id: 'pegawai', label: 'Daftar Pegawai', href: '/pegawai', icon: UserCircle },
    { id: 'users', label: 'Daftar User', href: '/users', icon: Users },
];

export function TemplateSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
            <div className="border-b border-sidebar-border p-6">
                <Link
                    href={dashboard()}
                    prefetch
                    className="flex items-center gap-3"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                        <LayoutDashboard className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-semibold text-sidebar-primary-foreground">
                            {APP_NAME}
                        </h1>
                        <p className="truncate text-[11px] text-sidebar-muted">
                            {APP_SUBTITLE}
                        </p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                <div className="space-y-1">
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                        Menu Utama
                    </p>
                    {mainNavItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                isCurrentUrl(item.href)
                                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="border-t border-sidebar-border p-4">
                <Link
                    href={edit()}
                    prefetch
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                </Link>
            </div>
        </aside>
    );
}
