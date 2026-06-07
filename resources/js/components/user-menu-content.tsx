import { Link, router } from '@inertiajs/react';
import { Check, LogOut, Palette, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useColorTheme } from '@/hooks/use-color-theme';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';
import type { ColorTheme } from '@/hooks/use-color-theme';

type Props = {
    user: User;
};

const COLOR_PREVIEWS: Record<ColorTheme, { bg: string; dot: string }> = {
    blue:   { bg: 'oklch(0.95 0.08 250)', dot: 'oklch(0.50 0.20 250)' },
    indigo: { bg: 'oklch(0.93 0.08 275)', dot: 'oklch(0.45 0.18 275)' },
    violet: { bg: 'oklch(0.93 0.08 290)', dot: 'oklch(0.50 0.16 290)' },
    teal:   { bg: 'oklch(0.93 0.08 195)', dot: 'oklch(0.48 0.14 195)' },
    green:  { bg: 'oklch(0.93 0.08 165)', dot: 'oklch(0.50 0.14 165)' },
    amber:  { bg: 'oklch(0.95 0.08 80)',  dot: 'oklch(0.60 0.16 80)'  },
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { theme: activeTheme, setTheme, themes } = useColorTheme();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Theme color picker */}
            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                    <Palette className="mr-2 size-4" />
                    <span>Warna Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Pilih warna tema
                    </DropdownMenuLabel>
                    {(Object.keys(themes) as ColorTheme[]).map((key) => {
                        const config = themes[key];
                        const preview = COLOR_PREVIEWS[key];
                        const active = activeTheme === key;
                        return (
                            <DropdownMenuItem
                                key={key}
                                className="flex cursor-pointer items-center gap-3 py-2"
                                onClick={() => setTheme(key)}
                            >
                                {/* Color swatch */}
                                <span
                                    className="flex size-6 shrink-0 items-center justify-center rounded-full"
                                    style={{ background: preview.bg }}
                                >
                                    <span
                                        className="size-3.5 rounded-full"
                                        style={{ background: preview.dot }}
                                    />
                                </span>
                                <span className="flex-1 text-sm">{config.label}</span>
                                {active && <Check className="size-4 text-primary" />}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2 size-4" />
                        Pengaturan
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 size-4" />
                    Keluar
                </Link>
            </DropdownMenuItem>
        </>
    );
}