# User Online Presence System

Sistem ini menggunakan **Laravel Reverb** untuk real-time user presence detection.

## 🚀 **Setup Instructions**

### 1. Environment Configuration
Tambahkan ke file `.env`:
```env
# Reverb Configuration (Production)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=production
REVERB_APP_KEY=production-key
REVERB_APP_SECRET=production-secret
REVERB_APP_HOST=0.0.0.0
REVERB_APP_PORT=8080
REVERB_APP_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

### 2. Start Reverb Server
```bash
php artisan reverb:start --host=0.0.0.0 --port=8080
```

### 3. Start Vite Development Server
```bash
npm run dev
```

### 4. Test Real-time Connection
Buka browser dan login ke aplikasi. User akan otomatis terdeteksi sebagai online.

## 📋 **Features**

### ✅ **Real-time User Tracking**
- User online/offline status
- Live user count
- User name dan email
- Automatic join/leave detection

### ✅ **Backend Components**
- `UserPresenceService` - Service untuk tracking user activity
- `UserPresenceController` - API endpoints
- `TrackUserActivity` middleware - Auto tracking pada setiap request
- Event listeners untuk login/logout

### ✅ **Frontend Components**
- `useUserPresence` hook - Real-time presence state
- `UserPresenceWidget` - UI component untuk menampilkan user online
- Laravel Echo integration untuk WebSocket connection

### ✅ **API Endpoints**
- `GET /api/users/online` - Daftar user online
- `GET /api/users/online/count` - Jumlah user online
- `GET /api/users/{user}/online` - Check status user spesifik

## 🔧 **Configuration**

### Environment Variables
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=production
REVERB_APP_KEY=production-key
REVERB_APP_SECRET=production-secret
REVERB_APP_HOST=0.0.0.0
REVERB_APP_PORT=8080
REVERB_APP_SCHEME=http
```

### Vite Configuration
```js
// resources/js/echo.js
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: 'production-key',
    wsHost: window.location.hostname,
    wsPort: 8080,
    forceTLS: false,
});
```

## 🎯 **Usage Examples**

### 1. Dashboard Integration
Widget sudah terintegrasi di dashboard dan menampilkan:
- Jumlah user online
- Daftar user dengan avatar initials
- Real-time updates

### 2. Custom Component Usage
```tsx
import { useUserPresence } from '@/hooks/use-user-presence';

function MyComponent() {
    const { users, count, online } = useUserPresence();
    
    return (
        <div>
            <p>{count} users online</p>
            {users.map(user => (
                <div key={user.id}>
                    {user.name} - {user.email}
                </div>
            ))}
        </div>
    );
}
```

### 3. API Usage
```javascript
// Get online users
fetch('/api/users/online')
    .then(res => res.json())
    .then(data => console.log(data.users));

// Check specific user
fetch('/api/users/123/online')
    .then(res => res.json())
    .then(data => console.log(data.online));
```

## 🔍 **Troubleshooting**

### Connection Issues
1. Pastikan Reverb server running: `php artisan reverb:start --host=0.0.0.0 --port=8080`
2. Check environment variables
3. Verify WebSocket connection di browser dev tools

### Database Issues
1. Pastikan tabel `users` ada
2. Tidak perlu field `avatar_url` atau `last_activity_at`
3. System menggunakan cache-based tracking

### Performance Tips
1. Cache TTL: 5 menit (configurable di `UserPresenceService`)
2. Automatic cleanup untuk offline users
3. Efficient presence channel dengan Laravel Echo

## 📊 **Monitoring**

### Real-time Events
- `user.online` - User baru online
- `user.offline` - User offline
- `presence.users` - Join/leave channel events

### Cache Strategy
- Redis/Database untuk persistence
- Auto cleanup setiap 5 menit
- Memory efficient untuk high traffic

## 🎉 **Result**

Sekarang kamu bisa:
- ✅ Melihat user yang sedang online secara real-time
- ✅ Mendapatkan notifikasi saat user login/logout
- ✅ Integrasi dengan dashboard dan ticket system
- ✅ Custom widget untuk berbagai keperluan

## 🛠️ **Production Deployment**

### 1. Setup Supervisor untuk Reverb
```ini
[program:reverb]
command=php /path/to/your/project/artisan reverb:start --host=0.0.0.0 --port=8080
directory=/path/to/your/project
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
```

### 2. Nginx Configuration (Optional)
```nginx
location /app/reverb {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**Status: 🟢 COMPLETED & PRODUCTION READY**
