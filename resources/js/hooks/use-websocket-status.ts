import { useState, useEffect } from 'react';

export type WebSocketState = 'initializing' | 'connecting' | 'connected' | 'disconnected' | 'unavailable' | 'error' | 'echo_unavailable';

export interface WebSocketStatus {
    echoLoaded: boolean;
    state: WebSocketState;
    stateLabel: string;
    lastUpdated: Date | null;
    errorMessage: string | null;
}

type EchoLike = {
    connectionStatus?: () => string;
    connector?: {
        onConnectionChange?: (cb: (s: string) => void) => () => void;
        pusher?: {
            connect: () => void;
            connection?: { bind: (e: string, c: (x: { current?: string }) => void) => void };
        };
    };
    channel?: (n: string) => unknown;
    leave?: (n: string) => void;
};

function getEcho(): EchoLike | null {
    return (window as unknown as { Echo?: EchoLike }).Echo ?? null;
}

function getEchoConnectionStatus(): string | null {
    const echo = getEcho();
    if (typeof echo?.connectionStatus !== 'function') return null;
    return echo.connectionStatus();
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

        const echo = getEcho();
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

        // Pakai API resmi Echo: connectionStatus() dan onConnectionChange()
        const initialStatus = getEchoConnectionStatus();
        updateFromState(initialStatus ?? 'disconnected');

        const unbind = echo.connector?.onConnectionChange?.((s: string) => updateFromState(s));
        if (typeof unbind !== 'function') {
            // Fallback: bind langsung ke pusher.connection
            const conn = echo.connector?.pusher?.connection;
            if (conn) {
                conn.bind('state_change', (x) => x?.current && updateFromState(x.current));
                conn.bind('connected', () => updateFromState('connected'));
                conn.bind('disconnected', () => updateFromState('disconnected'));
                conn.bind('unavailable', () => updateFromState('unavailable'));
                conn.bind('error', () => updateFromState('error'));
            }
        }

        // Paksa koneksi
        const pusher = echo.connector?.pusher;
        if (typeof pusher?.connect === 'function') {
            pusher.connect();
        } else {
            try {
                echo.channel?.('websocket-connection-check');
            } catch {
                /* ignore */
            }
        }

        // Re-sync pakai Echo.connectionStatus() (sumber kebenaran yang sama dengan UI Echo)
        const t1 = window.setTimeout(() => {
            const s = getEchoConnectionStatus();
            if (s) updateFromState(s);
        }, 800);
        const t2 = window.setTimeout(() => {
            const s = getEchoConnectionStatus();
            if (s) updateFromState(s);
        }, 2000);
        const t3 = window.setTimeout(() => {
            const s = getEchoConnectionStatus();
            if (s) updateFromState(s);
        }, 4000);

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            if (typeof unbind === 'function') unbind();
            try {
                echo.leave?.('websocket-connection-check');
            } catch {
                /* ignore */
            }
        };

    }, []);

    return status;
}
