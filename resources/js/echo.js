import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

try {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'production-key',
        wsHost: import.meta.env.VITE_REVERB_APP_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_APP_PORT || 8080,
        wssPort: import.meta.env.VITE_REVERB_APP_PORT || 8080,
        forceTLS: import.meta.env.VITE_REVERB_APP_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        disableAuth: true, // Disable auth for now to test
    });

    console.log('Echo initialized successfully');
} catch (error) {
    console.error('Failed to initialize Echo:', error);
}
