import { Head } from '@inertiajs/react';
import { CheckCircle2, Circle, HelpCircle, Server, Wifi, WifiOff, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useWebSocketStatus } from '@/hooks/use-websocket-status';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

declare global {
    interface Window {
        REVERB_CONFIG?: { key: string; host: string; port: number; scheme: string } | null;
    }
}

function getWebSocketUrl(): string | null {
    if (typeof window === 'undefined' || !window.REVERB_CONFIG) return null;
    const { scheme, host, port } = window.REVERB_CONFIG;
    const wsScheme = scheme === 'https' ? 'wss' : 'ws';
    const portSuffix = (scheme === 'https' && port === 443) || (scheme === 'http' && port === 80) ? '' : `:${port}`;
    return `${wsScheme}://${host}${portSuffix}/app/${window.REVERB_CONFIG.key}`;
}

/** Tes WebSocket native (tanpa Pusher/Echo) — request pasti muncul di Network → Socket */
function useNativeWebSocketTest() {
    const [result, setResult] = useState<{
        status: 'idle' | 'connecting' | 'open' | 'failed';
        message: string | null;
    }>({ status: 'idle', message: null });

    useEffect(() => {
        const url = getWebSocketUrl();
        if (!url) {
            setResult({ status: 'idle', message: 'REVERB_CONFIG tidak ada' });
            return;
        }
        setResult({ status: 'connecting', message: 'Membuka WebSocket langsung...' });
        const ws = new WebSocket(url);
        const timeout = window.setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                ws.close();
                setResult((r) =>
                    r.status === 'connecting'
                        ? { status: 'failed', message: 'Timeout — Nginx/Reverb tidak merespons' }
                        : r,
                );
            }
        }, 8000);
        ws.onopen = () => {
            window.clearTimeout(timeout);
            setResult({ status: 'open', message: 'Koneksi native berhasil. Reverb/Nginx OK.' });
            ws.close();
        };
        ws.onerror = () => {
            window.clearTimeout(timeout);
            setResult((r) =>
                r.status === 'connecting' ? { status: 'failed', message: 'Error — cek Console & Network' } : r,
            );
        };
        ws.onclose = (e) => {
            window.clearTimeout(timeout);
            setResult((r) => {
                if (r.status !== 'open' && r.status !== 'failed')
                    return {
                        status: 'failed',
                        message: e.code === 1006 ? 'Connection refused / Nginx tidak proxy' : `Tutup: ${e.code} ${e.reason || ''}`,
                    };
                return r;
            });
        };
        return () => {
            window.clearTimeout(timeout);
            if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, []);

    return result;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Status WebSocket',
        href: '/settings/websocket-status',
    },
];

function StatusBadge({
    state,
    label,
}: {
    state: string;
    label: string;
}) {
    const isOk = state === 'connected' || state === 'loaded';
    const isConnecting = state === 'connecting' || state === 'initializing';
    const isError = ['disconnected', 'unavailable', 'error', 'echo_unavailable'].includes(state);

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
                isOk && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                isConnecting && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                isError && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            )}
        >
            {isOk && <CheckCircle2 className="h-4 w-4" />}
            {isConnecting && <Circle className="h-4 w-4 animate-pulse" />}
            {isError && (state === 'echo_unavailable' ? <HelpCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />)}
            {label}
        </div>
    );
}

export default function WebSocketStatus() {
    const { echoLoaded, state, stateLabel, lastUpdated, errorMessage } = useWebSocketStatus();
    const nativeTest = useNativeWebSocketTest();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status WebSocket & Reverb" />

            <h1 className="sr-only">Status WebSocket & Laravel Reverb</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Status WebSocket & Laravel Reverb
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Cek apakah koneksi real-time (WebSocket) dan server Reverb aktif. Halaman ini memaksa koneksi WebSocket — buka DevTools → Network → filter <strong>Socket</strong> / <strong>WS</strong> lalu refresh untuk melihat request <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">wss://...</code>.
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Laravel Echo:</span>
                            <StatusBadge
                                state={echoLoaded ? 'loaded' : 'echo_unavailable'}
                                label={echoLoaded ? 'Ter-load' : 'Tidak ter-load'}
                            />
                            <span className="text-sm text-gray-400 dark:text-gray-500">|</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Koneksi WebSocket:</span>
                            <StatusBadge state={state} label={stateLabel} />
                        </div>
                        {lastUpdated && (
                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
                            </p>
                        )}
                        {errorMessage && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                        )}
                        {getWebSocketUrl() && (
                            <p className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                                URL koneksi: <span className="break-all">{getWebSocketUrl()}</span>
                            </p>
                        )}
                        {typeof window !== 'undefined' && window.location.protocol === 'https:' && getWebSocketUrl()?.startsWith('ws://') && (
                            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                                Halaman ini HTTPS tetapi URL WebSocket pakai <strong>ws://</strong>. Browser memblokir koneksi; harus <strong>wss://</strong>. Pastikan .env punya <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">REVERB_CLIENT_SCHEME=https</code> dan jalankan <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">php artisan config:clear</code>.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tes WebSocket langsung (native) — harus muncul di Network → Socket
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Halaman ini membuka <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">new WebSocket(url)</code> dengan URL yang sama. Request pasti tercatat di DevTools → Network → filter Socket/WS.
                        </p>
                        {nativeTest.status === 'idle' && nativeTest.message && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{nativeTest.message}</p>
                        )}
                        {nativeTest.status === 'connecting' && (
                            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{nativeTest.message}</p>
                        )}
                        {nativeTest.status === 'open' && (
                            <p className="mt-2 text-sm text-green-600 dark:text-green-400">{nativeTest.message}</p>
                        )}
                        {nativeTest.status === 'failed' && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{nativeTest.message}</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                            <Server className="h-4 w-4" />
                            Production (aaPanel / Nginx)
                        </h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            Reverb jalan di <strong>127.0.0.1:8082</strong>. Browser harus akses lewat domain yang sama. Wajib ada <strong>reverse proxy</strong> di Nginx yang meneruskan WebSocket ke Reverb.
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-blue-700 dark:text-blue-300">
                            <li>Tambahkan <code className="rounded bg-blue-100 px-1 dark:bg-blue-900/40">location /app/</code> → <code className="rounded bg-blue-100 px-1 dark:bg-blue-900/40">proxy_pass http://127.0.0.1:8082;</code> dengan header <code className="rounded bg-blue-100 px-1 dark:bg-blue-900/40">Upgrade</code> dan <code className="rounded bg-blue-100 px-1 dark:bg-blue-900/40">Connection</code>.</li>
                            <li>Tanpa proxy ini, status akan tetap &quot;Terputus&quot; meskipun Reverb dan queue jalan. Detail: <code className="rounded bg-blue-100 px-1 dark:bg-blue-900/40">docs/WEBSOCKET_PRODUCTION_CHECKLIST.md</code></li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Wifi className="h-4 w-4" />
                            Cara menyalakan WebSocket (Laravel Reverb)
                        </h3>
                        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>Jalankan server Reverb di terminal: <code className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">php artisan reverb:start</code></li>
                            <li>Pastikan <code className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">.env</code> berisi <code className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">BROADCAST_CONNECTION=reverb</code> dan konfigurasi <code className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">REVERB_*</code> / <code className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">VITE_REVERB_*</code>.</li>
                            <li>Refresh halaman ini setelah Reverb berjalan. Status akan berubah ke &quot;Terhubung&quot; jika berhasil.</li>
                        </ol>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                            <WifiOff className="h-4 w-4" />
                            Jika status tetap &quot;Terputus&quot; atau &quot;Server tidak tersedia&quot;
                        </h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-300">
                            <li>Pastikan proses <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">php artisan reverb:start</code> benar-benar jalan (tidak error di terminal).</li>
                            <li>Jika akses dari jaringan lain, pastikan <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">REVERB_HOST</code> / <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">VITE_REVERB_APP_HOST</code> atau <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">VITE_REVERB_HOST</code> mengarah ke IP/host yang bisa diakses dari browser (bukan hanya localhost).</li>
                            <li>Di production, browser tidak akses port Reverb langsung; Nginx proxy ke 127.0.0.1:8082 (lihat blok Production di atas).</li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Di mana nilai .env dipakai?
                        </h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li><strong>REVERB_*</strong> (REVERB_HOST, REVERB_PORT, dll.): dipakai Laravel (backend) saat broadcast &amp; saat Anda jalankan <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">reverb:start</code>.</li>
                            <li><strong>VITE_REVERB_*</strong> (VITE_REVERB_HOST, VITE_REVERB_PORT, VITE_REVERB_APP_KEY, dll.): dipakai saat <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">npm run build</code>; nilai ini masuk ke JS yang di-load browser. Setelah ubah .env, wajib <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">npm run build</code> lagi.</li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Melihat log Reverb (Supervisor / aaPanel)
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Jika Reverb dijalankan lewat Supervisor di aaPanel:
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li><strong>aaPanel:</strong> Supervisor → pilih program Reverb → tombol &quot;Log&quot; / &quot;View log&quot;.</li>
                            <li><strong>SSH:</strong> log biasanya di <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">/www/wwwlogs/</code> atau path yang Anda set di konfigurasi Supervisor (stdout_logfile / stderr_logfile).</li>
                            <li><strong>CLI:</strong> <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">supervisorctl tail -f &lt;nama_program&gt;</code> untuk lihat log real-time.</li>
                        </ul>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
