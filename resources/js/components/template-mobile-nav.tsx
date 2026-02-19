import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    ListTodo,
    PlusCircle,
    UserCircle,
    Users,
    Settings,
    FolderCog,
    LayoutDashboard,
    Package,
    BarChart3,
    AlertCircle,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { dashboard } from '@/routes';
import { cn } from '@/lib/utils';

const APP_NAME = 'Portal RS Aisyiyah Siti Fatimah';
const APP_SUBTITLE = 'Panel Admin';

const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { id: 'tickets', label: 'Daftar Tiket', href: '/tickets', icon: ListTodo },
    { id: 'tickets-create', label: 'Buat Tiket', href: '/tickets/create', icon: PlusCircle },
    { id: 'reports-sla', label: 'Laporan SLA', href: '/reports/sla', icon: BarChart3 },
    { id: 'emergency-reports', label: 'Laporan Darurat', href: '/emergency-reports', icon: AlertCircle },
    { id: 'pegawai', label: 'Daftar Pegawai', href: '/pegawai', icon: UserCircle },
    { id: 'inventaris', label: 'Inventaris', href: '/inventaris', icon: Package },
    { id: 'users', label: 'Daftar User', href: '/users', icon: Users },
];

const settingsNavItems = [
    { id: 'profile', label: 'Profil', href: '/settings/profile', icon: Settings },
    { id: 'tickets-master', label: 'Master Tiket', href: '/settings/tickets', icon: FolderCog },
];

function isTicketListActive(path: string): boolean {
    return path === '/tickets' || /^\/tickets\/\d+/.test(path) || /^\/tickets\/\d+\/edit/.test(path);
}

function isTicketCreateActive(path: string): boolean {
    return path === '/tickets/create';
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function TemplateMobileNav({ open, onOpenChange }: Props) {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
            >
                <SheetHeader className="border-b border-sidebar-border p-6">
                    <SheetTitle asChild>
                        <Link
                            href={dashboard()}
                            prefetch
                            onClick={() => onOpenChange(false)}
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                                <LayoutDashboard className="h-5 w-5 text-sidebar-primary-foreground" />
                            </div>
                            <div className="min-w-0 text-left">
                                <span className="text-sm font-semibold text-sidebar-primary-foreground">
                                    {APP_NAME}
                                </span>
                                <p className="text-[11px] text-sidebar-muted">
                                    {APP_SUBTITLE}
                                </p>
                            </div>
                        </Link>
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                    <div className="space-y-1">
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                            Menu Utama
                        </p>
                        {mainNavItems.map((item) => {
                            const isActive =
                                item.href === '/tickets'
                                    ? isTicketListActive(currentUrl)
                                    : item.href === '/tickets/create'
                                      ? isTicketCreateActive(currentUrl)
                                      : item.href === '/inventaris'
                                        ? currentUrl === '/inventaris' || /^\/inventaris\/[^/]+/.test(currentUrl)
                                        : item.href === '/emergency-reports'
                                          ? currentUrl === '/emergency-reports' || /^\/emergency-reports\/.+/.test(currentUrl)
                                          : isCurrentUrl(item.href);
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    prefetch
                                    onClick={() => onOpenChange(false)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                        isActive
                                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                            Pengaturan
                        </p>
                        {settingsNavItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                prefetch
                                onClick={() => onOpenChange(false)}
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
            </SheetContent>
        </Sheet>
    );
}
