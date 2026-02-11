import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    UserCircle,
    Users,
    Settings,
    LayoutDashboard,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function TemplateMobileNav({ open, onOpenChange }: Props) {
    const { isCurrentUrl } = useCurrentUrl();

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
                        {mainNavItems.map((item) => (
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

                <div className="border-t border-sidebar-border p-4">
                    <Link
                        href={edit()}
                        prefetch
                        onClick={() => onOpenChange(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    >
                        <Settings className="h-4 w-4" />
                        Pengaturan
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
