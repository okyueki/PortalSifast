import { Link, usePage } from '@inertiajs/react';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import { logout } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { SharedData } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
    onMenuClick?: () => void;
};

export function TemplateHeader({ breadcrumbs = [], onMenuClick }: Props) {
    const { auth } = usePage<SharedData>().props;
    const title =
        breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].title
            : 'Dashboard';
    const user = auth.user;

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-4 backdrop-blur-sm md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {onMenuClick && (
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80 md:hidden"
                        aria-label="Buka menu"
                    >
                        <Menu className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
                <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-foreground">
                    {title}
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                    {user?.name ?? user?.email}
                </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <button
                    type="button"
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80"
                    aria-label="Notifikasi"
                >
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </button>
                <Link
                    href={logout()}
                    as="button"
                    method="post"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-destructive/10"
                    title="Logout"
                    aria-label="Logout"
                >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                </Link>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                </div>
            </div>
        </header>
    );
}
