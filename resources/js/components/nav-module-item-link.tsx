import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavModuleItemLinkProps = {
    href: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    fullPage?: boolean;
    onNavigate?: () => void;
    className?: string;
};

export function NavModuleItemLink({
    href,
    icon: Icon,
    label,
    isActive,
    fullPage = false,
    onNavigate,
    className,
}: NavModuleItemLinkProps) {
    const classes = cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        className,
    );

    if (fullPage) {
        return (
            <a href={href} className={classes} onClick={onNavigate}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
            </a>
        );
    }

    return (
        <Link href={href} prefetch className={classes} onClick={onNavigate}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </Link>
    );
}
