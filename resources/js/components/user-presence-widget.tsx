import { usePresence } from '@/contexts/presence-context';
import { Users, Wifi, WifiOff } from 'lucide-react';

export default function UserPresenceWidget() {
  const { online, users, count } = usePresence();

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

  // Real-time tidak aktif: tampilkan info, bukan error (aplikasi tetap jalan)
  if (!online && users.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-muted-foreground" />
            User Online
          </h3>
          <span className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded">
            0
          </span>
        </div>

        <div className="text-center py-6 text-muted-foreground">
          <WifiOff className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm font-medium">Real-time tidak aktif</p>
          <p className="text-xs mt-1 text-muted-foreground/80">
            Untuk daftar user online, buka halaman User Online atau jalankan <code className="bg-muted px-1 rounded text-[11px]">php artisan reverb:start</code>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-border">
          <p className="text-xs text-muted-foreground text-center">
            Aplikasi berjalan normal tanpa Reverb
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {online ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-gray-400" />
          )}
          User Online
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {count}
        </span>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Tidak ada user online saat ini</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {getUserInitial(user.name)}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400">
                  Online {formatLastSeen(user.last_seen)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {online ? 'Real-time connection active' : 'Connecting...'}
        </p>
      </div>
    </div>
  );
}
