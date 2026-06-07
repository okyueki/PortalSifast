import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

type NavMainProps = {
    items: NavItem[];
    label?: string;
};

export function NavMain({ items = [], label = 'Platform' }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && (
                <SidebarGroupLabel className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className="group relative"
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className="cursor-pointer"
                                >
                                    {/* Active left indicator bar */}
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary"
                                            aria-hidden
                                        />
                                    )}
                                    {item.icon && (
                                        <item.icon
                                            className={`size-[18px] shrink-0 transition-colors duration-150 ${
                                                active
                                                    ? 'text-primary'
                                                    : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                                            }`}
                                        />
                                    )}
                                    <span
                                        className={`font-medium transition-colors duration-150 ${
                                            active
                                                ? 'text-primary'
                                                : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                                        }`}
                                    >
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}