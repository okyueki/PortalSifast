import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Menu, Moon, Search, Sun } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';
import AppSidebar from './app-sidebar';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-15 items-center px-4 md:max-w-7xl">
                    {/* Mobile: nav sheet using the sidebar */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mr-2 size-9 cursor-pointer rounded-lg text-foreground/70 hover:bg-primary/10 hover:text-primary"
                                aria-label="Buka menu navigasi"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <AppSidebar />
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center gap-2.5"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav
                        className="ml-6 hidden h-full items-center lg:flex"
                        aria-label="Navigasi utama"
                    >
                        <ul className="flex h-full items-center gap-1" role="list">
                            {mainNavItems.map((item) => {
                                const active = isCurrentUrl(item.href);
                                return (
                                    <li key={item.title} className="relative flex h-full items-center">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150 cursor-pointer',
                                                active
                                                    ? 'text-primary bg-primary/10'
                                                    : 'text-foreground/60 hover:text-foreground hover:bg-muted'
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="size-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {active && (
                                            <span
                                                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                                                aria-hidden
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Right actions */}
                    <div className="ml-auto flex items-center gap-1">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 cursor-pointer rounded-lg text-foreground/70 hover:bg-primary/10 hover:text-primary"
                                        aria-label="Cari"
                                    >
                                        <Search className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cari</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="ml-1 size-9 cursor-pointer rounded-full p-0 hover:bg-primary/10"
                                    aria-label="Menu pengguna"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 rounded-xl" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Breadcrumbs bar */}
            {breadcrumbs.length > 1 && (
                <div className="border-b border-border/40 bg-background/50">
                    <div className="mx-auto flex h-10 w-full items-center px-4 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
