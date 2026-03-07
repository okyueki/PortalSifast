import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

try {
    // Prefer config from Laravel (injected in app.blade.php) so host/port always match .env
    const fromLaravel = typeof window !== 'undefined' && window.REVERB_CONFIG;
    let wsHost = fromLaravel
        ? window.REVERB_CONFIG.host
        : (import.meta.env.VITE_REVERB_APP_HOST ?? import.meta.env.VITE_REVERB_HOST ?? window.location.hostname);
    // 0.0.0.0 is server bind only; browser must use the same host as the page
    if (typeof window !== 'undefined' && (wsHost === '0.0.0.0' || !wsHost)) {
        wsHost = window.location.hostname;
    }
    const wsPort = fromLaravel
        ? window.REVERB_CONFIG.port
        : (Number(import.meta.env.VITE_REVERB_APP_PORT ?? import.meta.env.VITE_REVERB_PORT) || 8080);
    const scheme = fromLaravel
        ? window.REVERB_CONFIG.scheme
        : (import.meta.env.VITE_REVERB_APP_SCHEME ?? import.meta.env.VITE_REVERB_SCHEME ?? 'http');
    const key = fromLaravel
        ? window.REVERB_CONFIG.key
        : (import.meta.env.VITE_REVERB_APP_KEY || 'production-key');

    const forceTLS = scheme === 'https';

    if (typeof key === 'string' && key.includes('@')) {
        console.warn(
            'Echo/Reverb: REVERB_APP_KEY jangan pakai karakter @ (merusak URL WebSocket). Gunakan hanya huruf/angka.',
        );
    }

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost,
        wsPort,
        wssPort: wsPort,
        forceTLS,
        enabledTransports: forceTLS ? ['wss'] : ['ws', 'wss'],
        disableStats: true,
        authEndpoint: '/broadcasting/auth',
    });

    console.log('Echo initialized:', {
        fromLaravel: !!fromLaravel,
        wsHost,
        wsPort,
        scheme,
        forceTLS,
    });

    // Paksa koneksi: connect() + subscribe channel publik agar Pusher benar-benar buka WebSocket (shared connection)
    const pusher = window.Echo?.connector?.pusher;
    if (typeof pusher?.connect === 'function') {
        setTimeout(() => {
            pusher.connect();
            // Subscribe channel publik supaya connection manager betul-betul connect (Pusher lazy tanpa channel)
            try {
                window.Echo.channel('connection-check').subscribed(() => {
                    console.log('Echo: koneksi shared aktif (channel connection-check)');
                });
            } catch {
                // ignore
            }
        }, 0);
    }
} catch (error) {
    console.error('Failed to initialize Echo:', error);
}
