import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { initializeColorTheme } from './hooks/use-color-theme';
import './echo.js';
import { configureEcho } from '@laravel/echo-react';

// ─── Google Fonts: Plus Jakarta Sans ──────────────────────────────────────────
const fonts = document.createElement('link');
fonts.rel = 'preconnect';
fonts.href = 'https://fonts.googleapis.com';
document.head.appendChild(fonts);

const fontsGstatic = document.createElement('link');
fontsGstatic.rel = 'preconnect';
fontsGstatic.href = 'https://fonts.gstatic.com';
fontsGstatic.crossOrigin = 'anonymous';
document.head.appendChild(fontsGstatic);

const fontsSheet = document.createElement('link');
fontsSheet.rel = 'stylesheet';
fontsSheet.href =
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap';
document.head.appendChild(fontsSheet);

configureEcho({
    broadcaster: 'reverb',
});

// Add Echo and Reverb config to global window type
declare global {
  interface Window {
    Echo: any;
    REVERB_CONFIG?: { key: string; host: string; port: number; scheme: string } | null;
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'Portal RS Aisyiyah Siti Fatimah';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4361ee',
    },
});

// This will set light / dark mode on load...
initializeTheme();
// Initialize color theme customizer...
initializeColorTheme();