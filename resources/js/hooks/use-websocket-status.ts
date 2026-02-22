import { useState, useEffect } from 'react';

export type WebSocketState = 'initializing' | 'connecting' | 'connected' | 'disconnected' | 'unavailable' | 'error' | 'echo_unavailable';

export interface WebSocketStatus {
    echoLoaded: boolean;
    state: WebSocketState;
    stateLabel: string;
    lastUpdated: Date | null;
    errorMessage: string | null;
}

function getPusherConnection(): { bind: (e: string, c: (s: { current?: string }) => void) => void; state: string } | null {
    const echo = (window as unknown as { Echo?: { connector?: { pusher?: { connection?: { bind: (e: string, c: (s: { current?: string }) => void) => void; state: string } } } } }).Echo;
    return echo?.connector?.pusher?.connection ?? null;
}

function connectionStateToStatus(state: string): WebSocketState {
    switch (state) {
        case 'connecting':
            return 'connecting';
        case 'connected':
            return 'connected';
        case 'disconnected':
        case 'failed':
            return 'disconnected';
        case 'unavailable':
            return 'unavailable';
        default:
            return state ? 'error' : 'disconnected';
    }
}

function stateToLabel(state: WebSocketState): string {
    const labels: Record<WebSocketState, string> = {
        initializing: 'Memeriksa...',
        connecting: 'Menghubungkan...',
        connected: 'Terhubung',
        disconnected: 'Terputus',
        unavailable: 'Server tidak tersedia',
        error: 'Error',
        echo_unavailable: 'Echo tidak tersedia',
    };
    return labels[state];
}

export function useWebSocketStatus(): WebSocketStatus {
    const [status, setStatus] = useState<WebSocketStatus>({
        echoLoaded: typeof window !== 'undefined' && !!(window as unknown as { Echo?: unknown }).Echo,
        state: 'initializing',
        stateLabel: 'Memeriksa...',
        lastUpdated: null,
        errorMessage: null,
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const echo = (window as unknown as { Echo?: unknown }).Echo;
        if (!echo) {
            setStatus({
                echoLoaded: false,
                state: 'echo_unavailable',
                stateLabel: stateToLabel('echo_unavailable'),
                lastUpdated: new Date(),
                errorMessage: 'Laravel Echo tidak ter-load. Pastikan Vite/build sudah include echo.js.',
            });
            return;
        }

        const conn = getPusherConnection();
        if (!conn) {
            setStatus({
                echoLoaded: true,
                state: 'error',
                stateLabel: 'Status koneksi tidak diketahui',
                lastUpdated: new Date(),
                errorMessage: 'Struktur connector Echo tidak dikenali (Reverb/Pusher).',
            });
            return;
        }

        const updateFromState = (currentState: string) => {
            const wsState = connectionStateToStatus(currentState);
            setStatus((prev) => ({
                ...prev,
                echoLoaded: true,
                state: wsState,
                stateLabel: stateToLabel(wsState),
                lastUpdated: new Date(),
                errorMessage: wsState === 'error' ? currentState || 'Unknown state' : null,
            }));
        };

        // Set initial state
        updateFromState(conn.state ?? 'disconnected');

        const handleStateChange = (states: { current?: string }) => {
            if (states?.current) {
                updateFromState(states.current);
            }
        };

        conn.bind('state_change', handleStateChange);
        conn.bind('connected', () => updateFromState('connected'));
        conn.bind('disconnected', () => updateFromState('disconnected'));
        conn.bind('unavailable', () => updateFromState('unavailable'));
        conn.bind('error', () => updateFromState('error'));

        return () => {
            try {
                conn.bind('state_change', () => {});
            } catch {
                // ignore cleanup errors
            }
        };
    }, []);

    return status;
}
