import { Head } from '@inertiajs/react';
import { Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { usePresence } from '@/contexts/presence-context';
import { useWebSocketStatus } from '@/hooks/use-websocket-status';
import { useState, useEffect } from 'react';

interface OnlineUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    last_seen: string;
}

interface Props {
    onlineUsers: OnlineUser[];
    onlineCount: number;
    timestamp: string;
}

export default function UserOnlinePage({ onlineUsers: initialUsers, onlineCount: initialCount, timestamp }: Props) {
    const { users, count, online } = usePresence();
    const wsStatus = useWebSocketStatus();
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Data dari server (untuk fallback saat real-time mati + setelah klik Refresh)
    const [serverUsers, setServerUsers] = useState<OnlineUser[]>(initialUsers);
    const [serverCount, setServerCount] = useState(initialCount);
    const [serverTimestamp, setServerTimestamp] = useState(timestamp);

    useEffect(() => {
        setServerUsers(initialUsers);
        setServerCount(initialCount);
        setServerTimestamp(timestamp);
    }, [initialUsers, initialCount, timestamp]);

    // Prioritas: data real-time (Echo) kalau connected, else data server
    const displayUsers = online ? users : serverUsers;
    const displayCount = online ? count : serverCount;
    const realtimeActive = wsStatus.state === 'connected';

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/api/users-online');
            const data = await response.json();
            setServerUsers(data.users ?? []);
            setServerCount(data.count ?? 0);
            setServerTimestamp(data.timestamp ?? new Date().toISOString());
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getUserInitial = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const formatLastSeen = (lastSeen: string) => {
        try {
            const date = new Date(lastSeen);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Baru saja';
            if (diffMins < 60) return `${diffMins} menit yang lalu`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam yang lalu`;
            return `${Math.floor(diffMins / 1440)} hari yang lalu`;
        } catch (error) {
            return 'Unknown';
        }
    };

    return (
        <AppLayout>
            <Head title="User Online" />

            <div className="space-y-6">
                {/* Banner saat real-time tidak aktif */}
                {!realtimeActive && wsStatus.state !== 'initializing' && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                        <WifiOff className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-medium">Koneksi real-time tidak aktif</p>
                            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                                Data di bawah dari server (user aktif dalam 5 menit terakhir). Gunakan tombol Refresh untuk memperbarui.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Online</h1>
                        <p className="text-gray-600 mt-1">
                            Monitor user yang sedang aktif secara real-time
                        </p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Online</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{displayCount}</div>
                            <p className="text-xs text-muted-foreground">
                                User aktif saat ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                            {online ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-gray-400" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold">
                                {online ? 'Connected' : 'Disconnected'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Real-time presence
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold">
                                {new Date(serverTimestamp).toLocaleTimeString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {realtimeActive ? 'Real-time' : 'Data server'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* User List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Daftar User Online
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {displayUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <WifiOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Tidak Ada User Online
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Belum ada user yang online saat ini. User akan muncul di sini 
                                    ketika mereka login dan mengakses aplikasi.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {displayUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                                    {getUserInitial(user.name)}
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                {user.name}
                                            </h3>
                                            <p className="text-gray-600">{user.email}</p>
                                            <p className="text-sm text-gray-500">
                                                Online {formatLastSeen(user.last_seen)}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col items-end">
                                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                                Online
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                ID: {user.id}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="text-center text-sm text-gray-500">
                    <p>
                        Data diperbarui secara real-time. 
                        <span className="font-medium"> {displayCount} user</span> sedang online.
                    </p>
                    <p className="text-xs mt-1">
                        Update terakhir: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
