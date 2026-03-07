import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Join presence channel saat user sudah login, supaya user terdeteksi "online"
 * di halaman User Online. Mount sekali di layout agar setiap buka aplikasi = join.
 */
export function PresenceJoiner() {
    const { auth } = usePage().props as { auth: { user?: { id: number } } };

    useEffect(() => {
        if (!auth?.user) return;

        const echo = (window as unknown as { Echo?: { join: (ch: string) => { leave: () => void } } }).Echo;
        if (!echo) return;

        let channel: { leave: () => void } | null = null;
        try {
            channel = echo.join('presence.users');
        } catch {
            // Reverb/Echo tidak tersedia
        }

        return () => {
            try {
                channel?.leave();
            } catch {
                // ignore
            }
        };
    }, [auth?.user?.id]);

    return null;
}
