import { useCallback, useSyncExternalStore } from 'react';

export type ColorTheme =
    | 'blue'      // TailAdmin / Professional
    | 'indigo'    // Deep indigo / Tech
    | 'violet'    // Violet / Creative
    | 'teal'      // Teal / Healthcare
    | 'green'     // Green / Growth
    | 'amber';    // Amber / Warm

export const COLOR_THEMES: Record<ColorTheme, { label: string; primary: string; ring: string }> = {
    blue: {
        label: 'Biru',
        primary: 'oklch(0.50 0.20 250)',
        ring:   'oklch(0.50 0.20 250)',
    },
    indigo: {
        label: 'Indigo',
        primary: 'oklch(0.45 0.18 275)',
        ring:   'oklch(0.45 0.18 275)',
    },
    violet: {
        label: 'Violet',
        primary: 'oklch(0.50 0.16 290)',
        ring:   'oklch(0.50 0.16 290)',
    },
    teal: {
        label: 'Teal',
        primary: 'oklch(0.48 0.14 195)',
        ring:   'oklch(0.48 0.14 195)',
    },
    green: {
        label: 'Hijau',
        primary: 'oklch(0.50 0.14 165)',
        ring:   'oklch(0.50 0.14 165)',
    },
    amber: {
        label: 'Amber',
        primary: 'oklch(0.60 0.16 80)',
        ring:   'oklch(0.60 0.16 80)',
    },
};

const listeners = new Set<() => void>();
let currentTheme: ColorTheme = 'blue';

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${value};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
};

const getStoredTheme = (): ColorTheme => {
    if (typeof window === 'undefined') return 'blue';
    return (localStorage.getItem('color_theme') as ColorTheme) || 'blue';
};

const applyColorTheme = (theme: ColorTheme): void => {
    if (typeof document === 'undefined') return;
    const config = COLOR_THEMES[theme];

    // Update CSS custom properties on :root
    document.documentElement.style.setProperty('--color-primary', config.primary);
    document.documentElement.style.setProperty('--color-ring', config.ring);
    document.documentElement.style.setProperty('--sidebar-ring', config.ring);

    // Also update sidebar-primary to stay in sync
    document.documentElement.style.setProperty('--sidebar-primary', config.primary);
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

export function initializeColorTheme(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem('color_theme')) {
        localStorage.setItem('color_theme', 'blue');
    }

    currentTheme = getStoredTheme();
    applyColorTheme(currentTheme);
}

export function useColorTheme() {
    const theme: ColorTheme = useSyncExternalStore(
        subscribe,
        () => currentTheme,
        () => 'blue',
    );

    const setTheme = useCallback((t: ColorTheme) => {
        currentTheme = t;
        localStorage.setItem('color_theme', t);
        setCookie('color_theme', t);
        applyColorTheme(t);
        notify();
    }, []);

    return { theme, setTheme, themes: COLOR_THEMES } as const;
}