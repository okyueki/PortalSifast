import { usePresence } from '@/contexts/presence-context';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

interface OnlineUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  last_seen: string;
}

export default function UserOnlineStatus() {
  const { users, count, online } = usePresence();
  const [showDetails, setShowDetails] = useState(false);

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

  if (count === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 mb-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">0 User Online</span>
            <Users className="h-4 w-4" />
          </button>
        </div>

        {showDetails && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Status User</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center py-6">
              <WifiOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">Tidak ada user online</p>
              <p className="text-sm text-gray-400 mt-1">User akan muncul saat login</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Status Button */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 mb-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
        >
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">{count} User Online</span>
          <Users className="h-4 w-4" />
        </button>
      </div>

      {/* Detail Popup */}
      {showDetails && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-80 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold text-gray-900">User Online</h3>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Connection:</span>
              <span className={`font-medium ${online ? 'text-green-600' : 'text-red-600'}`}>
                {online ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                      {getUserInitial(user.name)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Online {formatLastSeen(user.last_seen)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Total: {count} users</span>
              <span>Updated: {new Date().toLocaleTimeString('id-ID')}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => window.location.href = '/users/online'}
              className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Lihat Full Page
            </button>
            <button
              onClick={() => setShowDetails(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
